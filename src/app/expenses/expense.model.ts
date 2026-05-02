export interface Expense {
  id?: number;
  description: string;
  amount: number;
  expense_date_time?: string;
  created_on?: string;
}

export interface ExpensePage {
  items: Expense[];
  total: number;
  page: number;
  page_size: number;
}
