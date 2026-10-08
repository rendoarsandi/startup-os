import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { AppEnv } from '../env';
import { eq, and, desc, sql } from 'drizzle-orm';
import { inventoryItems, projects, projectTasks, employees, supportTickets } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';
import {
  decodeInventoryItem,
  decodeProject,
  decodeProjectTask,
  decodeUpdateTaskStatus,
  decodeLogTaskHours,
  decodeSupportTicket,
  } from '../schemas';
import { getValidatedBody, jsonResponse, matchRoute } from '../utils';

export async function handleOperationsRoutes(request: Request, path: string, method: string, db: DrizzleD1Database, userId: string, _env: AppEnv): Promise<Response | null> {
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
          name: body.name ?? existing.name,
          reorderLevel: body.reorderLevel ?? existing.reorderLevel,
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
      const newProject: typeof projects.$inferInsert = {
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
      const newTask: typeof projectTasks.$inferInsert = {
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
      await db.update(projectTasks).set({ hoursLogged: sql`${projectTasks.hoursLogged} + ${hours}`, updatedAt: new Date() }).where(eq(projectTasks.id, id)).run();
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
      const newTicket: typeof supportTickets.$inferInsert = {
        id: uuidv4(),
        userId,
        customerName: body.customerName,
        subject: body.subject,
        description: body.description || '',
        priority: body.priority || 'medium',
        status: 'open',
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(supportTickets).values(newTicket).run();
      return jsonResponse(newTicket, 201);
    }
  }

  return null;
}
