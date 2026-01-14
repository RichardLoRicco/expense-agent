import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getExpenses } from '../lib/db.js';
import { CATEGORIES } from '../lib/types.js';

export const getExpensesTool = createTool({
  id: 'get-expenses',
  description: `Query and list expenses with optional filters. Use this when the user wants to see their expense history,
    find specific transactions, or review spending at a particular vendor.`,
  inputSchema: z.object({
    category: z.enum(CATEGORIES).optional().describe('Filter by expense category'),
    vendor: z.string().optional().describe('Filter by vendor name (partial match)'),
    startDate: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
    minAmount: z.number().optional().describe('Minimum expense amount'),
    maxAmount: z.number().optional().describe('Maximum expense amount'),
  }),
  outputSchema: z.object({
    expenses: z.array(z.object({
      id: z.string(),
      amount: z.number(),
      vendor: z.string(),
      description: z.string(),
      category: z.string(),
      expenseDate: z.string(),
    })),
    count: z.number(),
    totalAmount: z.number(),
  }),
  execute: async ({ context }) => {
    const expenses = await getExpenses({
      category: context.category,
      vendor: context.vendor,
      startDate: context.startDate,
      endDate: context.endDate,
      minAmount: context.minAmount,
      maxAmount: context.maxAmount,
    });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      expenses: expenses.map(e => ({
        id: e.id,
        amount: e.amount,
        vendor: e.vendor,
        description: e.description,
        category: e.category,
        expenseDate: e.expenseDate,
      })),
      count: expenses.length,
      totalAmount,
    };
  },
});
