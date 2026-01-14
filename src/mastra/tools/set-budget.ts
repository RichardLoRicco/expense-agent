import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { setBudget } from '../lib/db.js';
import { CATEGORIES } from '../lib/types.js';

export const setBudgetTool = createTool({
  id: 'set-budget',
  description: `Set or update a budget limit for a spending category.
    Use this when the user wants to create a budget, set spending limits,
    or update an existing budget. Each category can only have one budget.`,
  inputSchema: z.object({
    category: z.enum(CATEGORIES).describe('The expense category to set a budget for'),
    amountLimit: z.number().positive().describe('The maximum amount to spend in this period'),
    period: z.enum(['weekly', 'monthly']).describe('Budget period - weekly or monthly'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    budget: z.object({
      category: z.string(),
      amountLimit: z.number(),
      period: z.string(),
    }),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const budget = await setBudget({
      category: context.category,
      amountLimit: context.amountLimit,
      period: context.period,
    });

    return {
      success: true,
      budget: {
        category: budget.category,
        amountLimit: budget.amountLimit,
        period: budget.period,
      },
      message: `Set ${context.period} budget of $${context.amountLimit.toFixed(2)} for ${context.category}`,
    };
  },
});
