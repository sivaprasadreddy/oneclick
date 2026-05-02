import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Reminder } from './reminder.model';
import { ReminderService } from './reminder.service';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-reminders',
  imports: [ReactiveFormsModule, ConfirmationDialogComponent],
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.css',
})
export class RemindersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reminderService = inject(ReminderService);

  reminders = signal<Reminder[]>([]);
  searchQuery = signal('');

  filteredReminders = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.reminders();
    return this.reminders().filter((r) =>
      [r.title, r.content].some((field) => field?.toLowerCase().includes(q)),
    );
  });

  showModal = signal(false);
  editingId = signal<number | null>(null);
  error = signal<string | null>(null);
  pendingDeleteReminder = signal<Reminder | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: [''],
    scheduled_on: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.reminderService
      .getAll()
      .then((reminders) => this.reminders.set(reminders))
      .catch((err) => this.error.set(String(err)));
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showModal.set(true);
  }

  openEdit(reminder: Reminder): void {
    this.editingId.set(reminder.id ?? null);
    this.form.reset({
      title: reminder.title,
      content: reminder.content ?? '',
      scheduled_on: reminder.scheduled_on,
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
    const reminder: Reminder = {
      ...(id !== null ? { id } : {}),
      title: v.title.trim(),
      content: v.content.trim() || undefined,
      scheduled_on: v.scheduled_on,
    };

    const op =
      id !== null
        ? this.reminderService.update(reminder)
        : this.reminderService.create(reminder);

    op.then(() => {
      this.closeModal();
      this.load();
    }).catch((err) => this.error.set(String(err)));
  }

  requestDelete(reminder: Reminder): void {
    this.pendingDeleteReminder.set(reminder);
  }

  cancelDelete(): void {
    this.pendingDeleteReminder.set(null);
  }

  confirmDelete(): void {
    const reminder = this.pendingDeleteReminder();
    if (!reminder) return;
    this.pendingDeleteReminder.set(null);
    this.reminderService
      .delete(reminder.id!)
      .then(() => this.load())
      .catch((err) => this.error.set(String(err)));
  }

  isOverdue(scheduledOn: string): boolean {
    return new Date(scheduledOn) < new Date();
  }

  truncate(text: string | undefined, max = 20): string {
    if (!text) return '—';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
