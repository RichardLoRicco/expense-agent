# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start the Mastra development server (runs the agent with playground UI)
npm run dev

# Install dependencies
npm install
```

## Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (used for both app data and Mastra internal state)

## Architecture Overview

This is a **Mastra AI agent** for personal expense tracking, built with the Mastra framework and Google's Gemini 2.0 Flash model.

### Core Structure

```
src/mastra/
├── index.ts           # Mastra instance setup, initializes DB and registers agent
├── agents/
│   └── expense-agent.ts   # Agent definition with instructions and tool bindings
├── tools/             # Individual tool implementations (one file per tool)
│   ├── add-expense.ts
│   ├── get-expenses.ts
│   ├── get-summary.ts
│   ├── set-budget.ts
│   └── check-budget.ts
└── lib/
    ├── types.ts       # TypeScript interfaces and the CATEGORIES constant
    └── db.ts          # PostgreSQL operations and table initialization
```

### Key Patterns

**Agent Instructions**: Always list available tools explicitly in the agent's `instructions` with trigger conditions. This helps the LLM decide when to call each tool. See `expense-agent.ts` for the pattern:
```
## Available Tools
- toolName: Use when [trigger condition]
```

**Tool Structure**: Each tool uses `createTool()` from `@mastra/core/tools` with:
- `inputSchema` / `outputSchema` defined with Zod
- `execute` function receiving `{ context }` with validated input

**Database**: Direct PostgreSQL via `pg` Pool (not an ORM). Tables auto-created on startup via `initDatabase()`. Two tables: `expenses` and `budgets`.

**Dual Database Usage**: The same PostgreSQL database serves two purposes:
1. **Application data**: `expenses` and `budgets` tables (managed by `lib/db.ts`)
2. **Mastra state**: threads and messages (managed by `PostgresStore` in `index.ts`)

### Expense Categories

Defined in `lib/types.ts`: `food`, `transport`, `entertainment`, `utilities`, `shopping`, `health`, `travel`, `subscriptions`, `other`
