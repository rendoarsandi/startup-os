import { eq, and, desc } from 'drizzle-orm';
import { employees, attendance, leaveRequests, expenseClaims } from '../../db/schema';
import { GeminiService } from '../gemini';
import { v4 as uuidv4 } from 'uuid';
import {
  decodeEmployee,
  decodeGenerateDoc,
  decodeClockIn,
  decodeClockOut,
  decodeLeaveRequest,
  decodeUpdateLeaveStatus,
  decodeExpenseClaim,
  decodeUpdateExpenseStatus,
} from '../schemas';
import { getValidatedBody, jsonResponse, matchRoute } from '../utils';

export async function handleHrRoutes(request: Request, path: string, method: string, db: any, userId: string, env: any): Promise<Response | null> {
  if (path === '/api/hr/employees') {
    if (method === 'GET') {
      const results = await db.select().from(employees).where(eq(employees.userId, userId)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeEmployee);
      const newEmployee = {
        id: body.id || uuidv4(),
        userId,
        name: body.name,
        role: body.role,
        department: body.department,
        salary: body.salary,
        status: body.status || 'active',
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const existing = await db.select().from(employees).where(and(eq(employees.id, newEmployee.id), eq(employees.userId, userId))).get();
      if (existing) {
        await db.update(employees).set({
          name: newEmployee.name,
          role: newEmployee.role,
          department: newEmployee.department,
          salary: newEmployee.salary,
          status: newEmployee.status,
          updatedAt: new Date()
        }).where(and(eq(employees.id, newEmployee.id), eq(employees.userId, userId))).run();
      } else {
        await db.insert(employees).values(newEmployee).run();
      }
      return jsonResponse(newEmployee, 201);
    }
  }

  if (path === '/api/hr/generate-doc' && method === 'POST') {
    const gemini = new GeminiService(env.GEMINI_API_KEY);
    const { docType, title, department, salary, details } = await getValidatedBody(request, decodeGenerateDoc);
    let prompt = "";
    if (docType === "job_description") {
      prompt = `Create a professional Job Description for a "${title}" in the "${department}" department. 
      Salary Range: ${salary}. 
      Additional details/responsibilities: ${details || 'None'}.
      Include:
      - Position Summary
      - Key Responsibilities
      - Required Qualifications
      - Key Benefits & Why Join Us.`;
    } else if (docType === "offer_letter") {
      prompt = `Draft a standard professional Employee Offer Letter for a candidate named "${details || 'Candidate Name'}" for the position of "${title}" in the "${department}" department.
      Annual Base Salary: ${salary}.
      Assume start date is two weeks from today.
      Include standard sections: Job Title, Salary, Benefits (medical, dental, 401k), At-Will Employment statement, and sign-off blocks.`;
    } else {
      prompt = `Draft a company HR Policy regarding "${title}" for the "${department}" department / general company-wide policy.
      Key constraints/context: ${details || 'None'}.
      Include:
      - Policy Objective
      - Scope of Policy
      - Specific Rules & Guidelines
      - Compliance and Penalties.`;
    }
    prompt += "\nFormat the output in professional, highly structured, clean Markdown document layout. Direct response, do not include chatter or generic introduction.";
    const document = await gemini.generateResponse(prompt, "", "hr");
    return jsonResponse({ document });
  }

  if (path === '/api/hr/attendance') {
    if (method === 'GET') {
      const results = await db.select().from(attendance).where(eq(attendance.userId, userId)).orderBy(desc(attendance.date)).all();
      return jsonResponse(results);
    }
  }

  if (path === '/api/hr/attendance/clock-in' && method === 'POST') {
    const body = await getValidatedBody(request, decodeClockIn);
    const employee = await db.select().from(employees).where(
      and(eq(employees.id, body.employeeId), eq(employees.userId, userId))
    ).get();
    if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
    const formatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowStr = formatter.format(new Date());
    const newLog = {
      id: uuidv4(),
      userId,
      employeeId: body.employeeId,
      date: new Date(),
      status: body.status || 'present',
      clockIn: nowStr,
      clockOut: null,
      createdAt: new Date()
    };
    await db.insert(attendance).values(newLog).run();
    return jsonResponse(newLog, 201);
  }

  if (path === '/api/hr/attendance/clock-out' && method === 'POST') {
    const body = await getValidatedBody(request, decodeClockOut);
    const formatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowStr = formatter.format(new Date());
    const today = new Date();
    today.setHours(0,0,0,0);
    const existing = await db.select().from(attendance).where(
      and(eq(attendance.userId, userId), eq(attendance.employeeId, body.employeeId))
    ).all();
    
    const activeRecord = existing
      .filter((a: any) => new Date(a.date).getTime() >= today.getTime())
      .find((a: any) => !a.clockOut);
      
    if (activeRecord) {
      await db.update(attendance).set({ clockOut: nowStr }).where(eq(attendance.id, activeRecord.id)).run();
      return jsonResponse({ success: true });
    }
    return jsonResponse({ error: "No active clock-in log found for today." }, 400);
  }

  if (path === '/api/hr/leaves') {
    if (method === 'GET') {
      const results = await db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.createdAt)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeLeaveRequest);
      const employee = await db.select().from(employees).where(
        and(eq(employees.id, body.employeeId), eq(employees.userId, userId))
      ).get();
      if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
      const newLeave = {
        id: uuidv4(),
        userId,
        employeeId: body.employeeId,
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        status: 'pending',
        reason: body.reason || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(leaveRequests).values(newLeave).run();
      return jsonResponse(newLeave, 201);
    }
  }

  const leaveParams = matchRoute(path, '/api/hr/leaves/:id/status');
  if (leaveParams && method === 'PUT') {
    const id = leaveParams.id;
    const { status } = await getValidatedBody(request, decodeUpdateLeaveStatus);
    await db.update(leaveRequests).set({ status, updatedAt: new Date() }).where(and(eq(leaveRequests.id, id), eq(leaveRequests.userId, userId))).run();
    return jsonResponse({ success: true });
  }

  if (path === '/api/hr/expenses') {
    if (method === 'GET') {
      const results = await db.select().from(expenseClaims).where(eq(expenseClaims.userId, userId)).orderBy(desc(expenseClaims.date)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeExpenseClaim);
      const employee = await db.select().from(employees).where(
        and(eq(employees.id, body.employeeId), eq(employees.userId, userId))
      ).get();
      if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
      const newClaim = {
        id: uuidv4(),
        userId,
        employeeId: body.employeeId,
        title: body.title,
        amount: body.amount,
        category: body.category,
        status: 'pending',
        date: body.date ? new Date(body.date) : new Date(),
        createdAt: new Date()
      };
      await db.insert(expenseClaims).values(newClaim).run();
      return jsonResponse(newClaim, 201);
    }
  }

  const expenseParams = matchRoute(path, '/api/hr/expenses/:id/status');
  if (expenseParams && method === 'PUT') {
    const id = expenseParams.id;
    const { status } = await getValidatedBody(request, decodeUpdateExpenseStatus);
    await db.update(expenseClaims).set({ status }).where(and(eq(expenseClaims.id, id), eq(expenseClaims.userId, userId))).run();
    return jsonResponse({ success: true });
  }

  return null;
}
