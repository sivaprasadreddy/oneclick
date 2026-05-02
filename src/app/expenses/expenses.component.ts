import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Expense } from './expense.model';
import { ExpenseService } from './expense.service';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-expenses',
  imports: [ReactiveFormsModule, ConfirmationDialogComponent],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css',
})
export class ExpensesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);

  readonly pageSize = 10;

  expenses = signal<Expense[]>([]);
  total = signal(0);
  currentPage = signal(1);
  searchQuery = signal('');
  loading = signal(false);
  showModal = signal(false);
  editingId = signal<number | null>(null);
  error = signal<string | null>(null);
  pendingDeleteExpense = signal<Expense | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  rangeStart = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.total()),
  );

  form = this.fb.group({
    description: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    expense_date_time: [''],
  });

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.expenseService
      .getAll(this.currentPage(), this.pageSize, this.searchQuery())
      .then((result) => {
        this.expenses.set(result.items);
        this.total.set(result.total);
      })
      .catch((err) => this.error.set(String(err)))
      .finally(() => this.loading.set(false));
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(1);
      this.load();
    }, 300);
  }

  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    this.searchQuery.set('');
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showModal.set(true);
  }

  openEdit(expense: Expense): void {
    this.editingId.set(expense.id ?? null);
    this.form.reset({
      description: expense.description,
      amount: expense.amount,
      expense_date_time: this.toDateTimeLocal(expense.expense_date_time ?? ''),
    });
    this.error.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.error.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const id = this.editingId();
    const expense: Expense = {
      ...(id !== null ? { id } : {}),
      description: v.description!.trim(),
      amount: Number(v.amount),
      expense_date_time: v.expense_date_time || undefined,
    };

    const op =
      id !== null
        ? this.expenseService.update(expense)
        : this.expenseService.create(expense);

    op.then(() => {
      this.closeModal();
      this.load();
    }).catch((err) => this.error.set(String(err)));
  }

  requestDelete(expense: Expense): void {
    this.pendingDeleteExpense.set(expense);
  }

  cancelDelete(): void {
    this.pendingDeleteExpense.set(null);
  }

  confirmDelete(): void {
    const expense = this.pendingDeleteExpense();
    if (!expense) return;
    this.pendingDeleteExpense.set(null);
    this.expenseService
      .delete(expense.id!)
      .then(() => {
        // if we deleted the last item on the last page, step back one page
        if (this.expenses().length === 1 && this.currentPage() > 1) {
          this.currentPage.update((p) => p - 1);
        }
        this.load();
      })
      .catch((err) => this.error.set(String(err)));
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatDateTime(dateStr?: string): string {
    if (!dateStr) return '—';
    const normalized = dateStr.includes('T')
      ? dateStr
      : dateStr.replace(' ', 'T') + 'Z';
    return new Date(normalized).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private toDateTimeLocal(dateStr: string): string {
    if (!dateStr) return '';
    const normalized = dateStr.includes('T')
      ? dateStr
      : dateStr.replace(' ', 'T');
    return normalized.slice(0, 16); // "YYYY-MM-DDTHH:MM"
  }
}
