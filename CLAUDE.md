# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start the Mastra development server (runs the agent with playground UI)
npm run dev

# Install dependencies
npm install
```

## Git Workflow

**Branching**: Create a feature branch before making changes. Use descriptive branch names:
- `feature/add-expense-tags`
- `fix/budget-calculation`
- `refactor/tool-structure`

**Commits**: Use conventional commits format. Write concise, direct messages in imperative mood.

Format:
```text
<type>: <title summarizing changes>

<body with details about what changed and why>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Examples:
```text
feat: Add expense tagging feature

Allow users to add custom tags to expenses for better categorization.
Tags are stored as an array and searchable via get-expenses tool.
```

```text
fix: Correct budget overflow calculation

Budget percentage was exceeding 100% when expenses surpassed the limit.
Now caps display at 100% and shows overage amount separately.
```

If unsure about commit scope or message, ask the user.

**Workflow**:
1. Create branch from main: `git checkout -b feature/your-feature`
2. Make focused commits as you complete logical units of work
3. Prompt the user asking to push changes after committing

**Pull Requests**: Use `gh pr create --web` to open the PR in the browser so the user can edit the title/description if needed.

Title: Use conventional commits format (e.g., `fix: Correct budget calculation` or `feat(tools): Add expense tagging`).

Description: Keep it concise, casual, and to the point. No flowery language, lists, or headings. Show simple before/after code examples for fixes, or just after examples for new features.

Example PR description:
```text
Fixed an issue where budget percentages could exceed 100%.

Before:
`Budget used: 150%`

After:
`Budget used: 100% (exceeded by $50)`
```

## Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (used for both app data and Mastra internal state)
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key for Gemini model (agent chat and receipt parsing)

## Architecture Overview

This is a **Mastra AI agent** for personal expense tracking, built with the Mastra framework and Google's Gemini 2.5 Flash model.

### Core Structure

```text
src/mastra/
├── index.ts           # Mastra instance setup, initializes DB and registers agent
├── agents/
│   └── expense-agent.ts   # Agent definition with instructions, memory config, and tool bindings
├── tools/             # Individual tool implementations (one file per tool)
│   ├── add-expense.ts
│   ├── get-expenses.ts
│   ├── get-summary.ts
│   ├── set-budget.ts
│   ├── check-budget.ts
│   └── parse-receipt.ts   # Image analysis using Gemini vision
└── lib/
    ├── types.ts       # TypeScript interfaces and the CATEGORIES constant
    └── db.ts          # PostgreSQL operations and table initialization
```

### Key Patterns

**Agent Instructions**: Always list available tools explicitly in the agent's `instructions` with trigger conditions. This helps the LLM decide when to call each tool. See `expense-agent.ts` for the pattern:
```text
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

**Memory**: The agent uses `@mastra/memory` to maintain conversation context. Configured in `expense-agent.ts` with `lastMessages: 10` to keep recent context without excessive token usage.

**Receipt Parsing**: The `parseReceipt` tool uses Gemini's vision capability via `generateObject()` from the Vercel AI SDK. It returns structured data with confidence scores (0-1) so the agent can decide when to ask for user verification.

### Expense Categories

Defined in `lib/types.ts`: `food`, `transport`, `entertainment`, `utilities`, `shopping`, `health`, `travel`, `subscriptions`, `other`
