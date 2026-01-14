import { Mastra } from '@mastra/core/mastra';
import { PostgresStore } from '@mastra/pg';

import { expenseAgent } from './agents/expense-agent.js';
import { initDatabase } from './lib/db.js';

// Initialize our custom expense/budget tables
await initDatabase();

// Mastra instance with Postgres storage for internal state (threads, messages)
export const mastra = new Mastra({
  agents: { expenseAgent },
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL!,
  }),
});
