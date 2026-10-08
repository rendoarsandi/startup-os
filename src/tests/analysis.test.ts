// @vitest-environment node
import { expect, test } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import { createRealSqliteD1 } from "./mocks/d1Simulator";
import { AnalysisService } from "../server/analysis";
import * as tables from "../db/schema";

test("runway excludes non-cash holdings, counts payroll once, and does not invent MRR from deposits", async () => {
  const DB = await createRealSqliteD1();
  const db = drizzle(DB);
  const now = new Date();
  await db
    .insert(tables.users)
    .values({
      id: "founder",
      name: "Founder",
      email: "founder@test.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  for (const [id, type, balance] of [
    ["cash", "checking", 10000000],
    ["credit", "credit", 90000000],
    ["investment", "investment", 90000000],
  ] as const)
    await db
      .insert(tables.financialAccounts)
      .values({
        id,
        userId: "founder",
        name: id,
        type,
        balance,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  await db
    .insert(tables.employees)
    .values({
      id: "employee",
      userId: "founder",
      name: "Team member",
      role: "Engineer",
      department: "Engineering",
      salary: 12000000,
      status: "active",
      startDate: now,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  for (const [id, amount, category, merchant] of [
    ["payroll", -1000000, "Payroll", "Salary"],
    ["subscription", -100000, "Software", "GitHub"],
    ["deposit", 2000000, "Revenue", "Stripe"],
  ] as const)
    await db
      .insert(tables.transactions)
      .values({
        id,
        userId: "founder",
        accountId: "cash",
        amount,
        category,
        merchant,
        date: now,
        createdAt: now,
      })
      .run();
  const result = await new AnalysisService(db).calculateRunwayAndBurn(
    "founder",
  );
  expect(result.cashBalance).toBe(10000000);
  expect(result.fixedCosts.payroll).toBe(1000000);
  expect(result.variableExpenses).toBe(0);
  expect(result.fixedCosts.subscriptions).toBe(100000);
  expect(result.startingMrr).toBe(0);
  expect(result.dataQuality).toBe("limited");
  expect(result.netBurn).toBe(-900000);
});
