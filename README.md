# Expense Agent 💰

A personal expense management assistant built with the [Mastra](https://mastra.ai/) framework and Google Gemini 3.0 Flash. This agent helps you track spending, manage budgets, and gain insights into your financial habits using natural language.

## Features

- **Natural Language Tracking**: Just tell the agent what you spent (e.g., "I spent $12 on lunch at Chipotle") and it will log it.
- **Auto-Categorization**: Automatically assigns categories (food, transport, subscriptions, etc.) based on the vendor and description.
- **Budget Management**: Set monthly or weekly limits for specific categories.
- **Proactive Alerts**: Notifies you when you are approaching or exceeding your budget.
- **Spending Summaries**: Get breakdowns of your spending by category or vendor over different time periods.

## Tech Stack

- **Framework**: [Mastra](https://mastra.ai/)
- **LLM**: Google Gemini 3.0 Flash
- **Database**: PostgreSQL (via `pg`)
- **Runtime**: Node.js / TypeScript

## Prerequisites

- **Node.js**: v20 or later
- **PostgreSQL**: A running instance (local or hosted)
- **Google AI API Key**: Get one from [Google AI Studio](https://aistudio.google.com/)

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd expense-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/expense_db
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
   ```

## Usage

Start the development server with the Mastra playground:

```bash
npm run dev
```

The playground UI will be available (usually at `http://localhost:4000`). You can interact with the **Expense Agent** using natural language:

### Example Prompts

- "I spent $45 on gas at Shell today."
- "Set a monthly food budget of $400."
- "How much have I spent on subscriptions this month?"
- "Show me a summary of my spending for the last week."
- "Check my budget status."

## Project Structure

- `src/mastra/agents/`: Agent definitions and instructions.
- `src/mastra/tools/`: Custom tools for DB operations (adding expenses, checking budgets).
- `src/mastra/lib/`: Database schema, initialization, and types.
- `src/mastra/index.ts`: Main entry point for the Mastra instance.

## License

MIT
