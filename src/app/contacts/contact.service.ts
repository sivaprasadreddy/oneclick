import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Contact } from './contact.model';

@Injectable({ providedIn: 'root' })
export class ContactService {
  getAll(): Promise<Contact[]> {
    return invoke('get_contacts');
  }

  create(contact: Contact): Promise<Contact> {
    return invoke('create_contact', { contact });
  }

  update(contact: Contact): Promise<void> {
    return invoke('update_contact', { contact });
  }

  delete(id: number): Promise<void> {
    return invoke('delete_contact', { id });
  }
}
