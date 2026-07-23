import { eq, and, desc, asc } from 'drizzle-orm';
import { contracts } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { decodeCreateContract, decodeUpdateContract } from '../schemas';
import { getValidatedBody, jsonResponse, matchRoute } from '../utils';

export async function handleContractsRoutes(request: Request, path: string, method: string, db: any, userId: string, url: URL): Promise<Response | null> {
  if (path === '/api/contracts') {
    if (method === 'GET') {
      const statusFilter = url.searchParams.get('status');
      const clientIdFilter = url.searchParams.get('clientId');
      const sortBy = url.searchParams.get('sortBy') || 'createdAt';
      const sortOrder = url.searchParams.get('sortOrder') || 'desc';
      const rawLimit = parseInt(url.searchParams.get('limit') || '100', 10);
      const rawOffset = parseInt(url.searchParams.get('offset') || '0', 10);
      const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 100 : rawLimit;
      const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

      const conditions = [eq(contracts.userId, userId)];
      if (statusFilter) {
        conditions.push(eq(contracts.status, statusFilter));
      }
      if (clientIdFilter) {
        conditions.push(eq(contracts.clientId, clientIdFilter));
      }

      const columnMap: Record<string, any> = {
        createdAt: contracts.createdAt,
        updatedAt: contracts.updatedAt,
        value: contracts.value,
        title: contracts.title,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
      };
      const column = columnMap[sortBy] || contracts.createdAt;
      const orderByClause = sortOrder.toLowerCase() === 'asc' ? asc(column) : desc(column);

      const results = await db.select()
        .from(contracts)
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset)
        .all();

      return jsonResponse(results);
    }

    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeCreateContract);
      const newContract = {
        id: uuidv4(),
        userId,
        title: body.title,
        description: body.description || null,
        status: body.status || 'draft',
        value: body.value || 0,
        clientId: body.clientId || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(contracts).values(newContract).run();
      return jsonResponse(newContract, 201);
    }
  }

  const contractParams = matchRoute(path, '/api/contracts/:id');
  if (contractParams) {
    const id = contractParams.id;

    if (method === 'GET') {
      const contract = await db.select()
        .from(contracts)
        .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
        .get();
      if (!contract) {
        return jsonResponse({ error: "Contract not found" }, 404);
      }
      return jsonResponse(contract);
    }

    if (method === 'PUT') {
      const body = await getValidatedBody(request, decodeUpdateContract);
      const existing = await db.select()
        .from(contracts)
        .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
        .get();
      if (!existing) {
        return jsonResponse({ error: "Contract not found" }, 404);
      }

      const updateData: Partial<typeof contracts.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.value !== undefined) updateData.value = body.value;
      if (body.clientId !== undefined) updateData.clientId = body.clientId;
      if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
      if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;

      await db.update(contracts)
        .set(updateData)
        .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
        .run();

      const updated = await db.select()
        .from(contracts)
        .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
        .get();
      return jsonResponse(updated);
    }
  }

  return null;
}
