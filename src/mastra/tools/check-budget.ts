import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getBudgets, getSpentInPeriod } from '../lib/db.js';
import { CATEGORIES } from '../lib/types.js';
import type { BudgetStatus } from '../lib/types.js';

export const checkBudgetTool = createTool({
  id: 'check-budget',
  description: `Check budget status for one or all categories. Shows how much has been spent vs the limit.
    Use this when the user asks about budget status, remaining budget, or if they're over budget.`,
  inputSchema: z.object({
    category: z.enum(CATEGORIES).optional().describe('Check specific category, or omit to check all budgets'),
  }),
  outputSchema: z.object({
    budgets: z.array(z.object({
      category: z.string(),
      limit: z.number(),
      spent: z.number(),
      remaining: z.number(),
      percentUsed: z.number(),
      isOverBudget: z.boolean(),
      period: z.string(),
    })),
    summary: z.object({
      totalBudgeted: z.number(),
      totalSpent: z.number(),
      overBudgetCount: z.number(),
    }),
  }),
  execute: async ({ context }) => {
    const allBudgets = await getBudgets();

    // Filter to specific category if provided
    const budgetsToCheck = context.category
      ? allBudgets.filter(b => b.category === context.category)
      : allBudgets;

    if (budgetsToCheck.length === 0) {
      return {
        budgets: [],
        summary: { totalBudgeted: 0, totalSpent: 0, overBudgetCount: 0 },
      };
    }

    // Calculate status for each budget
    const statuses: BudgetStatus[] = await Promise.all(
      budgetsToCheck.map(async budget => {
        const spent = await getSpentInPeriod(budget.category, budget.period);
        const remaining = budget.amountLimit - spent;
        const percentUsed = Math.round((spent / budget.amountLimit) * 100);

        return {
          category: budget.category,
          limit: budget.amountLimit,
          spent,
          remaining,
          percentUsed,
          isOverBudget: spent > budget.amountLimit,
          period: budget.period,
        };
      })
    );

    const totalBudgeted = statuses.reduce((sum, s) => sum + s.limit, 0);
    const totalSpent = statuses.reduce((sum, s) => sum + s.spent, 0);
    const overBudgetCount = statuses.filter(s => s.isOverBudget).length;

    return {
      budgets: statuses,
      summary: { totalBudgeted, totalSpent, overBudgetCount },
    };
  },
});
