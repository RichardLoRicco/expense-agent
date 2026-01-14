import pg from 'pg';
import type { Expense, Budget, ExpenseFilters, Category } from './types.js';

const { Pool } = pg;

// Connection pool - reused across requests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize tables on startup
export async function initDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      amount DECIMAL(10,2) NOT NULL,
      vendor VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category VARCHAR(50) UNIQUE NOT NULL,
      amount_limit DECIMAL(10,2) NOT NULL,
      period VARCHAR(20) NOT NULL DEFAULT 'monthly',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// ============ EXPENSE OPERATIONS ============

export async function addExpense(expense: {
  amount: number;
  vendor: string;
  description: string;
  category: Category;
  expenseDate?: string;
}): Promise<Expense> {
  const result = await pool.query(
    `INSERT INTO expenses (amount, vendor, description, category, expense_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, amount, vendor, description, category,
               expense_date as "expenseDate", created_at as "createdAt"`,
    [
      expense.amount,
      expense.vendor,
      expense.description,
      expense.category,
      expense.expenseDate || new Date().toISOString().split('T')[0],
    ]
  );
  return mapExpenseRow(result.rows[0]);
}

export async function getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.category) {
    conditions.push(`category = $${paramIndex++}`);
    params.push(filters.category);
  }
  if (filters.vendor) {
    conditions.push(`vendor ILIKE $${paramIndex++}`);
    params.push(`%${filters.vendor}%`);
  }
  if (filters.startDate) {
    conditions.push(`expense_date >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`expense_date <= $${paramIndex++}`);
    params.push(filters.endDate);
  }
  if (filters.minAmount !== undefined) {
    conditions.push(`amount >= $${paramIndex++}`);
    params.push(filters.minAmount);
  }
  if (filters.maxAmount !== undefined) {
    conditions.push(`amount <= $${paramIndex++}`);
    params.push(filters.maxAmount);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT id, amount, vendor, description, category,
            expense_date as "expenseDate", created_at as "createdAt"
     FROM expenses
     ${whereClause}
     ORDER BY expense_date DESC, created_at DESC`,
    params
  );

  return result.rows.map(mapExpenseRow);
}

export async function getExpenseSummary(
  period: 'week' | 'month' | 'year',
  groupBy: 'category' | 'vendor'
): Promise<{ name: string; total: number; count: number }[]> {
  const dateFilter = getDateFilterForPeriod(period);

  const result = await pool.query(
    `SELECT ${groupBy} as name,
            SUM(amount)::numeric as total,
            COUNT(*)::int as count
     FROM expenses
     WHERE expense_date >= $1
     GROUP BY ${groupBy}
     ORDER BY total DESC`,
    [dateFilter]
  );

  return result.rows.map(row => ({
    name: row.name,
    total: parseFloat(row.total),
    count: row.count,
  }));
}

// ============ BUDGET OPERATIONS ============

export async function setBudget(budget: {
  category: Category;
  amountLimit: number;
  period: 'weekly' | 'monthly';
}): Promise<Budget> {
  const result = await pool.query(
    `INSERT INTO budgets (category, amount_limit, period)
     VALUES ($1, $2, $3)
     ON CONFLICT (category)
     DO UPDATE SET amount_limit = $2, period = $3, updated_at = NOW()
     RETURNING id, category, amount_limit as "amountLimit", period,
               created_at as "createdAt", updated_at as "updatedAt"`,
    [budget.category, budget.amountLimit, budget.period]
  );
  return mapBudgetRow(result.rows[0]);
}

export async function getBudgets(): Promise<Budget[]> {
  const result = await pool.query(
    `SELECT id, category, amount_limit as "amountLimit", period,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM budgets`
  );
  return result.rows.map(mapBudgetRow);
}

export async function getSpentInPeriod(
  category: Category,
  period: 'weekly' | 'monthly'
): Promise<number> {
  const dateFilter = getDateFilterForPeriod(period === 'weekly' ? 'week' : 'month');

  const result = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric as total
     FROM expenses
     WHERE category = $1 AND expense_date >= $2`,
    [category, dateFilter]
  );

  return parseFloat(result.rows[0].total);
}

// ============ HELPERS ============

function getDateFilterForPeriod(period: 'week' | 'month' | 'year'): string {
  const now = new Date();
  switch (period) {
    case 'week':
      now.setDate(now.getDate() - 7);
      break;
    case 'month':
      now.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now.toISOString().split('T')[0];
}

function mapExpenseRow(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    amount: parseFloat(String(row.amount)),
    vendor: String(row.vendor),
    description: String(row.description || ''),
    category: String(row.category) as Category,
    expenseDate: row.expenseDate instanceof Date
      ? row.expenseDate.toISOString().split('T')[0]
      : String(row.expenseDate),
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt),
  };
}

function mapBudgetRow(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    category: String(row.category) as Category,
    amountLimit: parseFloat(String(row.amountLimit)),
    period: String(row.period) as 'weekly' | 'monthly',
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : String(row.updatedAt),
  };
}
