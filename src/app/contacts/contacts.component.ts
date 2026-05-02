import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Contact } from './contact.model';
import { ContactService } from './contact.service';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-contacts',
  imports: [ReactiveFormsModule, ConfirmationDialogComponent],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.css',
})
export class ContactsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);

  contacts = signal<Contact[]>([]);
  showModal = signal(false);
  editingId = signal<number | null>(null);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: [''],
    email: ['', Validators.email],
    mobile: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.contactService
      .getAll()
      .then((contacts) => this.contacts.set(contacts))
      .catch((err) => this.error.set(String(err)));
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showModal.set(true);
  }

  openEdit(contact: Contact): void {
    this.editingId.set(contact.id ?? null);
    this.form.reset({
      first_name: contact.first_name,
      last_name: contact.last_name ?? '',
      email: contact.email ?? '',
      mobile: contact.mobile ?? '',
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
    const contact: Contact = {
      ...(id !== null ? { id } : {}),
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim() || undefined,
      email: v.email.trim() || undefined,
      mobile: v.mobile.trim() || undefined,
    };

    const op =
      id !== null
        ? this.contactService.update(contact)
        : this.contactService.create(contact);

    op.then(() => {
      this.closeModal();
      this.load();
    }).catch((err) => this.error.set(String(err)));
  }

  pendingDeleteContact = signal<Contact | null>(null);

  requestDelete(contact: Contact): void {
    this.pendingDeleteContact.set(contact);
  }

  cancelDelete(): void {
    this.pendingDeleteContact.set(null);
  }

  confirmDelete(): void {
    const contact = this.pendingDeleteContact();
    if (!contact) return;
    this.pendingDeleteContact.set(null);
    this.contactService
      .delete(contact.id!)
      .then(() => this.load())
      .catch((err) => this.error.set(String(err)));
  }
}
