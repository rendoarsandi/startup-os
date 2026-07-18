import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

describe('API Input Validation Tests via @effect/schema', () => {
  describe('POST /api/accounts', () => {
    test('should succeed with valid payload', async () => {
      const res = await handleApiRequest(
        new Request('http://localhost/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Checking Account',
            type: 'checking',
            balance: 5000,
            currency: 'USD',
          }),
        }),
        {
          DB: {
            prepare: vi.fn().mockReturnValue({
              bind: vi.fn().mockReturnThis(),
              run: vi.fn().mockResolvedValue({ success: true }),
            }),
          },
        } as any
      );

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.name).toBe('Checking Account');
      expect(data.balance).toBe(5000);
    });

    test('should fail with missing required fields (name, type)', async () => {
      const res = await handleApiRequest(
        new Request('http://localhost/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            balance: 5000,
          }),
        }),
        {
          DB: {},
        } as any
      );

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toBeDefined();
      expect(data.error).toContain('is missing');
    });

    test('should fail with invalid type format', async () => {
      const res = await handleApiRequest(
        new Request('http://localhost/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 12345, // Should be string
            type: 'checking',
          }),
        }),
        {
          DB: {},
        } as any
      );

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toBeDefined();
      expect(data.error).toContain('Expected string');
    });
  });

  describe('POST /api/cfo/saas-config', () => {
    test('should reject numeric strings', async () => {
      const res = await handleApiRequest(
        new Request('http://localhost/api/cfo/saas-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startingMrr: 10000,
            churnRate: '0.05',
            cac: 150,
            arpu: '50',
          }),
        }),
        {
          DB: {
            prepare: vi.fn().mockReturnValue({
              bind: vi.fn().mockReturnThis(),
              raw: vi.fn().mockResolvedValue([
                ["config-123", "test-user", 10000, 0.05, 150, 50, new Date().toISOString(), new Date().toISOString()]
              ]),
              run: vi.fn().mockResolvedValue({ success: true }),
            }),
          },
        } as any
      );

      expect(res.status).toBe(400);
    });

    test('should fail with missing config values', async () => {
      const res = await handleApiRequest(
        new Request('http://localhost/api/cfo/saas-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startingMrr: 10000,
            churnRate: 0.05,
          }),
        }),
        {
          DB: {},
        } as any
      );

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain('is missing');
    });
  });

  describe('POST /api/transactions', () => {
    test('should fail if accountId is missing', async () => {
      const res = await handleApiRequest(
        new Request('http://localhost/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 500,
            merchant: 'Vendors',
          }),
        }),
        {
          DB: {},
        } as any
      );

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain('is missing');
    });
  });
});
