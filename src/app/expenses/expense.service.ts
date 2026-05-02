import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Expense, ExpensePage } from './expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  getAll(page: number, pageSize: number, search: string): Promise<ExpensePage> {
    return invoke('get_expenses', {
      page,
      pageSize,
      search: search.trim() || null,
    });
  }

  create(expense: Expense): Promise<Expense> {
    return invoke('create_expense', { expense });
  }

  update(expense: Expense): Promise<void> {
    return invoke('update_expense', { expense });
  }

  delete(id: number): Promise<void> {
    return invoke('delete_expense', { id });
  }
}
