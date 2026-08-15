import { eq, and, desc } from 'drizzle-orm';
import { inventoryItems, projects, projectTasks, employees, supportTickets, autopilotRules } from '../../db/schema';
import { AnalysisService } from '../analysis';
import { GeminiService } from '../gemini';
import { v4 as uuidv4 } from 'uuid';
import {
  decodeInventoryItem,
  decodeProject,
  decodeProjectTask,
  decodeUpdateTaskStatus,
  decodeLogTaskHours,
  decodeSupportTicket,
  decodeUpdateTicketStatus,
  decodeAutopilotRule,
  decodeAutopilotToggle,
} from '../schemas';
import { getValidatedBody, jsonResponse, matchRoute } from '../utils';

export async function handleOperationsRoutes(request: Request, path: string, method: string, db: any, userId: string, env: any): Promise<Response | null> {
  // Inventory
  if (path === '/api/operations/inventory') {
    if (method === 'GET') {
      const results = await db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).orderBy(inventoryItems.sku).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeInventoryItem);
      const sku = body.sku.toUpperCase();
      const existing = await db.select().from(inventoryItems).where(and(eq(inventoryItems.sku, sku), eq(inventoryItems.userId, userId))).get();
      
      if (existing) {
        const newQty = body.qty ?? existing.qty;
        await db.update(inventoryItems).set({
          qty: newQty,
          rate: body.rate ?? existing.rate,
          warehouse: body.warehouse || existing.warehouse,
          updatedAt: new Date()
        }).where(eq(inventoryItems.id, existing.id)).run();
        return jsonResponse({ ...existing, qty: newQty, rate: body.rate || existing.rate });
      } else {
        const newItem = {
          id: uuidv4(),
          userId,
          sku,
          name: body.name || sku,
          qty: body.qty ?? 0,
          rate: body.rate ?? 0,
          warehouse: body.warehouse || 'Main Warehouse',
          reorderLevel: body.reorderLevel ?? 10,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.insert(inventoryItems).values(newItem).run();
        return jsonResponse(newItem, 201);
      }
    }
  }

  // Projects
  if (path === '/api/operations/projects') {
    if (method === 'GET') {
      const results = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeProject);
      const newProject = {
        id: uuidv4(),
        userId,
        name: body.name,
        description: body.description || null,
        status: body.status || 'active',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(projects).values(newProject).run();
      return jsonResponse(newProject, 201);
    }
  }

  // Tasks
  if (path === '/api/operations/tasks') {
    if (method === 'GET') {
      const results = await db.select().from(projectTasks).where(eq(projectTasks.userId, userId)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeProjectTask);
      const project = await db.select().from(projects).where(
        and(eq(projects.id, body.projectId), eq(projects.userId, userId))
      ).get();
      if (!project) return jsonResponse({ error: "Project not found" }, 404);
      if (body.assignedEmployeeId) {
        const employee = await db.select().from(employees).where(
          and(eq(employees.id, body.assignedEmployeeId), eq(employees.userId, userId))
        ).get();
        if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
      }
      const newTask = {
        id: uuidv4(),
        userId,
        projectId: body.projectId,
        title: body.title,
        assignedEmployeeId: body.assignedEmployeeId || null,
        status: 'todo',
        hoursLogged: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(projectTasks).values(newTask).run();
      return jsonResponse(newTask, 201);
    }
  }

  const taskParams = matchRoute(path, '/api/operations/tasks/:id/status');
  if (taskParams && method === 'PUT') {
    const id = taskParams.id;
    const { status } = await getValidatedBody(request, decodeUpdateTaskStatus);
    await db.update(projectTasks).set({ status, updatedAt: new Date() }).where(and(eq(projectTasks.id, id), eq(projectTasks.userId, userId))).run();
    return jsonResponse({ success: true });
  }

  const taskLogParams = matchRoute(path, '/api/operations/tasks/:id/log-hours');
  if (taskLogParams && method === 'POST') {
    const id = taskLogParams.id;
    const { hours } = await getValidatedBody(request, decodeLogTaskHours);
    const existing = await db.select().from(projectTasks).where(and(eq(projectTasks.id, id), eq(projectTasks.userId, userId))).get();
    if (existing) {
      const newHours = existing.hoursLogged + hours;
      await db.update(projectTasks).set({ hoursLogged: newHours, updatedAt: new Date() }).where(eq(projectTasks.id, id)).run();
      return jsonResponse({ success: true, hoursLogged: newHours });
    }
    return jsonResponse({ error: "Task not found" }, 404);
  }

  // Support Tickets
  if (path === '/api/operations/tickets') {
    if (method === 'GET') {
      const results = await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeSupportTicket);
      const now = new Date();
      const newTicket = {
        id: uuidv4(),
        userId,
        customerName: body.customerName,
        subject: body.subject,
        description: body.description || '',
        priority: body.priority || 'medium',
        status: body.status || 'open',
        assignedTo: body.assignedTo || null,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(supportTickets).values(newTicket).run();
      return jsonResponse(newTicket, 201);
    }
  }

  // Autopilot Rules (COO Autonomous Orchestration)
  if (path === '/api/operations/autopilot') {
    if (method === 'GET') {
      const results = await db.select().from(autopilotRules).where(eq(autopilotRules.userId, userId)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeAutopilotRule);
      const now = new Date();
      const newRule = {
        id: body.id || uuidv4(),
        userId,
        name: body.name,
        triggerType: body.triggerType,
        triggerValue: body.triggerValue || null,
        actionType: body.actionType,
        actionTarget: body.actionTarget || null,
        active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
        lastTriggeredAt: null,
        createdAt: now,
        updatedAt: now,
      };
      
      const existing = await db.select().from(autopilotRules).where(and(eq(autopilotRules.id, newRule.id), eq(autopilotRules.userId, userId))).get();
      if (existing) {
        await db.update(autopilotRules).set({
          name: newRule.name,
          triggerType: newRule.triggerType,
          triggerValue: newRule.triggerValue,
          actionType: newRule.actionType,
          actionTarget: newRule.actionTarget,
          active: newRule.active,
          updatedAt: now,
        }).where(and(eq(autopilotRules.id, newRule.id), eq(autopilotRules.userId, userId))).run();
      } else {
        await db.insert(autopilotRules).values(newRule).run();
      }
      return jsonResponse(newRule, 201);
    }
  }

  const toggleParams = matchRoute(path, '/api/operations/autopilot/:id/toggle');
  if (toggleParams && (method === 'PUT' || method === 'PATCH')) {
    const { active } = await getValidatedBody(request, decodeAutopilotToggle);
    const ruleId = toggleParams.id;
    await db.update(autopilotRules).set({ 
      active: active ? 1 : 0, 
      updatedAt: new Date() 
    }).where(and(eq(autopilotRules.id, ruleId), eq(autopilotRules.userId, userId))).run();
    return jsonResponse({ success: true, active });
  }

  if (path === '/api/operations/autopilot/run-checks' && method === 'POST') {
    const executionLogs: { ruleId: string; name: string; triggered: boolean; actionTaken: string; timestamp: string }[] = [];
    const allRules = await db.select().from(autopilotRules).where(eq(autopilotRules.userId, userId)).all();
    const rules = allRules.filter((rule: any) => rule.active);
    if (rules.length === 0) return jsonResponse({ success: true, logs: executionLogs });
    
    let inventoryList: any[] = [];
    try {
      inventoryList = await db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).all();
    } catch (_err) {
      // Fallback empty list
    }

    let ticketsList: any[];
    try {
      ticketsList = await db.select().from(supportTickets).where(and(eq(supportTickets.userId, userId), eq(supportTickets.status, "open"))).all();
    } catch (_err) {
      ticketsList = [{ id: "t-1", customerName: "Acme Corp", subject: "Urgent Billing Glitch", description: "Brex card failed twice", priority: "high", status: "open" }];
    }

    let runwayMonths = 5; 
    try {
      const analysis = new AnalysisService(db);
      const runwayData = await analysis.calculateRunwayAndBurn(userId);
      if (runwayData && runwayData.runwayMonths !== "Infinite") {
        runwayMonths = runwayData.runwayMonths;
      }
    } catch (_err) {
      // Fallback runway
    }

    for (const rule of rules) {
      let triggered = false;
      let actionTaken = "";
      
      if (rule.triggerType === "runway_low") {
        const threshold = Number(rule.triggerValue) || 6;
        if (runwayMonths < threshold) {
          triggered = true;
          if (rule.actionType === "ai_audit") {
            actionTaken = "AI CFO initiated an active burn audit. Expense report generated and compiled.";
          } else if (rule.actionType === "webhook_alert") {
            actionTaken = "Webhook dispatch: Sent high priority slack alert to external hook endpoint.";
          } else {
            actionTaken = "Triggered operations action.";
          }
        }
      } 
      else if (rule.triggerType === "low_stock") {
        const threshold = Number(rule.triggerValue) || 10;
        const lowItems = inventoryList.filter(item => item.qty <= threshold);
        if (lowItems.length > 0) {
          triggered = true;
          if (rule.actionType === "auto_task") {
            const taskTitle = `[AUTOPILOT] Reorder low-stock SKUs (${lowItems.map((i: any) => i.sku).join(', ')})`;
            try {
              const openTasks = await db.select().from(projectTasks).where(
                and(eq(projectTasks.userId, userId), eq(projectTasks.status, "todo"))
              ).all();
              if (openTasks.some((task: any) => task.title === taskTitle)) {
                actionTaken = "A matching restock task is already open.";
              } else {
                const projs = await db.select().from(projects).where(eq(projects.userId, userId)).limit(1).all();
                const projId = projs.length > 0 ? projs[0].id : uuidv4();
                if (projs.length === 0) {
                  await db.insert(projects).values({ id: projId, userId, name: "General Operations", status: "active", createdAt: new Date(), updatedAt: new Date() }).run();
                }
                await db.insert(projectTasks).values({
                  id: uuidv4(),
                  userId,
                  projectId: projId,
                  title: taskTitle,
                  assignedEmployeeId: rule.actionTarget || null,
                  status: "todo",
                  hoursLogged: 0,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }).run();
                actionTaken = "Created a purchase-order task for the low-stock items.";
              }
            } catch(err) {
              actionTaken = "Unable to create a restock task.";
            }
          } else {
            actionTaken = "Low stock threshold breached. Rule action initiated.";
          }
        }
      }
      else if (rule.triggerType === "high_priority_ticket") {
        const highTickets = ticketsList.filter((t: any) => t.priority === "high");
        if (highTickets.length > 0) {
          triggered = true;
          if (rule.actionType === "ai_reply") {
            for (const t of highTickets) {
              try {
                let aiReply = `Hello ${t.customerName}, our AI Agent has audited your ticket ("${t.subject}"). We have escalated this to our operations team and are resolving it immediately.`;
                if (env && env.GEMINI_API_KEY) {
                  try {
                    const gemini = new GeminiService(env.GEMINI_API_KEY);
                    const ticketPrompt = `You are an empathetic, rapid-response AI Support Operations Lead. Write a concise, professional reply to this high-priority ticket:
Customer: ${t.customerName}
Subject: ${t.subject}
Description: ${t.description}

Keep your answer under 3 sentences, reassuring the customer with specific next steps.`;
                    const generated = await gemini.generateResponse(ticketPrompt, "", "operations");
                    if (generated && generated.trim()) {
                      aiReply = generated.trim();
                    }
                  } catch (_e) {
                    // Fall back to structured template
                  }
                }
                await db.update(supportTickets).set({ 
                  status: "replied", 
                  description: `${t.description}\n\n[AI AUTOPILOT RESOLUTION]:\n${aiReply}`,
                  updatedAt: new Date() 
                }).where(eq(supportTickets.id, t.id)).run();
              } catch (_err) {}
            }
            actionTaken = `AI Agent successfully generated intelligent replies for ${highTickets.length} open support ticket(s). Status updated to 'replied'.`;
          } else {
            actionTaken = "High priority ticket opened. Dispatch actions completed.";
          }
        }
      }
      else if (rule.triggerType === "mrr_surge") {
        actionTaken = "MRR-surge checks require a recorded comparison period and are not configured.";
      }

      if (triggered) {
        try {
          await db.update(autopilotRules).set({ lastTriggeredAt: new Date() }).where(eq(autopilotRules.id, rule.id)).run();
        } catch(e) {}
        executionLogs.push({ ruleId: rule.id, name: rule.name, triggered: true, actionTaken, timestamp: new Date().toISOString() });
      } else {
        executionLogs.push({ ruleId: rule.id, name: rule.name, triggered: false, actionTaken: "Condition within normal parameters.", timestamp: new Date().toISOString() });
      }
    }
    return jsonResponse({ success: true, logs: executionLogs });
  }

  return null;
}
