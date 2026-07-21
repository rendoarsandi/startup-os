import { describe, test, expect, beforeEach } from 'vitest';
import { MockD1Database, ContractRecord } from './harness';

describe('MockD1Database Sanity Tests', () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  test('should insert contract records', async () => {
    const sql = 'INSERT INTO contract (id, user_id, name, type, parties, value, status, signature, signed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [
      'contract-uuid-1',
      'user-123',
      'Test Contract',
      'client_service',
      JSON.stringify({ client: 'Acme Corp', provider: 'Startup OS' }),
      100000,
      'draft',
      null,
      null,
      1716000000000,
      1716000000000
    ];

    const result = await db.prepare(sql).bind(...params).run();
    expect(result.success).toBe(true);
    expect(result.meta.changes).toBe(1);
    expect(db.store.length).toBe(1);
    expect(db.store[0].id).toBe('contract-uuid-1');
    expect(db.store[0].name).toBe('Test Contract');
  });

  test('should query contract records using all()', async () => {
    const mockRecord: ContractRecord = {
      id: 'contract-uuid-1',
      user_id: 'user-123',
      name: 'Test Contract',
      type: 'client_service',
      parties: JSON.stringify({ client: 'Acme Corp' }),
      value: 100000,
      status: 'draft',
      signature: null,
      signed_at: null,
      created_at: 1716000000000,
      updated_at: 1716000000000
    };
    db.store.push(mockRecord);

    const querySql1 = 'SELECT * FROM contract WHERE user_id = ?';
    const res1 = await db.prepare(querySql1).bind('user-123').all();
    expect(Array.isArray(res1)).toBe(true);
    expect(res1.length).toBe(1);
    expect(res1[0].id).toBe('contract-uuid-1');
    
    const resultObj = res1 as unknown as { results: ContractRecord[] };
    expect(resultObj.results).toBeDefined();
    expect(resultObj.results.length).toBe(1);
    expect(resultObj.results[0].id).toBe('contract-uuid-1');

    const res2 = await db.prepare(querySql1).bind('user-456').all();
    expect(res2.length).toBe(0);

    const querySql2 = 'SELECT * FROM contract WHERE contract.id = ? and contract.user_id = ?';
    const res3 = await db.prepare(querySql2).bind('contract-uuid-1', 'user-123').all();
    expect(res3.length).toBe(1);
    expect(res3[0].id).toBe('contract-uuid-1');
  });

  test('should query single record using get()', async () => {
    const mockRecord: ContractRecord = {
      id: 'contract-uuid-1',
      user_id: 'user-123',
      name: 'Test Contract',
      type: 'client_service',
      parties: JSON.stringify({ client: 'Acme Corp' }),
      value: 100000,
      status: 'draft',
      signature: null,
      signed_at: null,
      created_at: 1716000000000,
      updated_at: 1716000000000
    };
    db.store.push(mockRecord);

    const querySql = 'SELECT * FROM contract WHERE id = ? and user_id = ? LIMIT 1';
    const res = await db.prepare(querySql).bind('contract-uuid-1', 'user-123').get();
    expect(res).not.toBeNull();
    expect(res!.id).toBe('contract-uuid-1');
  });

  test('should update contract records using run()', async () => {
    const mockRecord: ContractRecord = {
      id: 'contract-uuid-1',
      user_id: 'user-123',
      name: 'Test Contract',
      type: 'client_service',
      parties: JSON.stringify({ client: 'Acme Corp' }),
      value: 100000,
      status: 'draft',
      signature: null,
      signed_at: null,
      created_at: 1716000000000,
      updated_at: 1716000000000
    };
    db.store.push(mockRecord);

    const updateSql = 'UPDATE contract SET status = ?, signature = ?, signed_at = ?, updated_at = ? WHERE contract.id = ? and contract.user_id = ?';
    const params = [
      'signed',
      'John Doe Signature',
      1716000100000,
      1716000100000,
      'contract-uuid-1',
      'user-123'
    ];

    const result = await db.prepare(updateSql).bind(...params).run();
    expect(result.success).toBe(true);
    expect(result.meta.changes).toBe(1);

    expect(db.store[0].status).toBe('signed');
    expect(db.store[0].signature).toBe('John Doe Signature');
    expect(db.store[0].signed_at).toBe(1716000100000);
  });
});
