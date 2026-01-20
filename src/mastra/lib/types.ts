// Expense categories - mirrors what enterprise expense systems use
export const CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'utilities',
  'shopping',
  'health',
  'travel',
  'subscriptions',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Core data models
export interface Expense {
  id: string;
  amount: number;
  vendor: string;
  description: string;
  category: Category;
  expenseDate: string; // ISO date string
  createdAt: string;
}

export interface Budget {
  id: string;
  category: Category;
  amountLimit: number;
  period: 'weekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
}

// Query filters for getExpenses
export interface ExpenseFilters {
  category?: Category;
  vendor?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Summary response shape
export interface SpendingSummary {
  groupBy: string;
  items: {
    name: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  grandTotal: number;
  period: string;
}

// Budget status response
export interface BudgetStatus {
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  period: 'weekly' | 'monthly';
}

// Parsed receipt data from image analysis (confidence is 0-1 where 1 = certain)
export interface ParsedReceipt {
  vendor: string;
  vendorConfidence: number;
  totalAmount: number;
  amountConfidence: number;
  date: string; // YYYY-MM-DD or empty if not found
  dateConfidence: number;
  category: Category;
  categoryConfidence: number;
  lineItems: Array<{ description: string; amount: number }>;
  rawText: string;
}
