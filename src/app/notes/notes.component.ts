import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Note } from './note.model';
import { NoteService } from './note.service';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-notes',
  imports: [ReactiveFormsModule, ConfirmationDialogComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css',
})
export class NotesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private noteService = inject(NoteService);

  notes = signal<Note[]>([]);
  searchQuery = signal('');

  filteredNotes = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.notes();
    return this.notes().filter((n) =>
      [n.title, n.content].some((field) => field?.toLowerCase().includes(q)),
    );
  });

  showModal = signal(false);
  editingId = signal<number | null>(null);
  error = signal<string | null>(null);
  pendingDeleteNote = signal<Note | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.noteService
      .getAll()
      .then((notes) => this.notes.set(notes))
      .catch((err) => this.error.set(String(err)));
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showModal.set(true);
  }

  openEdit(note: Note): void {
    this.editingId.set(note.id ?? null);
    this.form.reset({ title: note.title, content: note.content });
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
    const note: Note = {
      ...(id !== null ? { id } : {}),
      title: v.title.trim(),
      content: v.content.trim(),
    };

    const op =
      id !== null
        ? this.noteService.update(note)
        : this.noteService.create(note);

    op.then(() => {
      this.closeModal();
      this.load();
    }).catch((err) => this.error.set(String(err)));
  }

  requestDelete(note: Note): void {
    this.pendingDeleteNote.set(note);
  }

  cancelDelete(): void {
    this.pendingDeleteNote.set(null);
  }

  confirmDelete(): void {
    const note = this.pendingDeleteNote();
    if (!note) return;
    this.pendingDeleteNote.set(null);
    this.noteService
      .delete(note.id!)
      .then(() => this.load())
      .catch((err) => this.error.set(String(err)));
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
