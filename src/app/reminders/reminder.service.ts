import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Reminder } from './reminder.model';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  getAll(): Promise<Reminder[]> {
    return invoke('get_reminders');
  }

  create(reminder: Reminder): Promise<Reminder> {
    return invoke('create_reminder', { reminder });
  }

  update(reminder: Reminder): Promise<void> {
    return invoke('update_reminder', { reminder });
  }

  delete(id: number): Promise<void> {
    return invoke('delete_reminder', { id });
  }
}
