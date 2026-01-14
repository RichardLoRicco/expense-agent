import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getExpenseSummary } from '../lib/db.js';
import type { SpendingSummary } from '../lib/types.js';

export const getSummaryTool = createTool({
  id: 'get-summary',
  description: `Get a spending summary grouped by category or vendor for a time period.
    Use this when the user asks about spending patterns, wants to see where their money goes,
    or asks questions like "how much did I spend on X this month?"`,
  inputSchema: z.object({
    period: z.enum(['week', 'month', 'year']).describe('Time period to summarize'),
    groupBy: z.enum(['category', 'vendor']).describe('How to group the summary'),
  }),
  outputSchema: z.object({
    summary: z.object({
      groupBy: z.string(),
      period: z.string(),
      grandTotal: z.number(),
      items: z.array(z.object({
        name: z.string(),
        total: z.number(),
        count: z.number(),
        percentage: z.number(),
      })),
    }),
  }),
  execute: async ({ context }) => {
    const items = await getExpenseSummary(context.period, context.groupBy);
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    const summary: SpendingSummary = {
      groupBy: context.groupBy,
      period: context.period,
      grandTotal,
      items: items.map(item => ({
        name: item.name,
        total: item.total,
        count: item.count,
        percentage: grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0,
      })),
    };

    return { summary };
  },
});
