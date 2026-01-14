import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { addExpense } from '../lib/db.js';
import { CATEGORIES } from '../lib/types.js';

export const addExpenseTool = createTool({
  id: 'add-expense',
  description: `Add a new expense record. Use this when the user mentions spending money, buying something, or paying for a service.
    You should infer the category from the vendor/description when not explicitly provided.
    Common mappings: restaurants/groceries -> food, Uber/Lyft/gas -> transport, Netflix/Spotify -> subscriptions`,
  inputSchema: z.object({
    amount: z.number().positive().describe('The expense amount in dollars'),
    vendor: z.string().describe('The merchant or vendor name (e.g., "Starbucks", "Amazon")'),
    description: z.string().describe('Brief description of what was purchased'),
    category: z.enum(CATEGORIES).describe('Expense category - infer from vendor/description if not specified'),
    expenseDate: z.string().optional().describe('Date of expense in YYYY-MM-DD format. Defaults to today.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    expense: z.object({
      id: z.string(),
      amount: z.number(),
      vendor: z.string(),
      category: z.string(),
      expenseDate: z.string(),
    }),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const expense = await addExpense({
      amount: context.amount,
      vendor: context.vendor,
      description: context.description,
      category: context.category,
      expenseDate: context.expenseDate,
    });

    return {
      success: true,
      expense: {
        id: expense.id,
        amount: expense.amount,
        vendor: expense.vendor,
        category: expense.category,
        expenseDate: expense.expenseDate,
      },
      message: `Added $${expense.amount.toFixed(2)} expense at ${expense.vendor} (${expense.category})`,
    };
  },
});
