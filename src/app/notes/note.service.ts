import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Note } from './note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  getAll(): Promise<Note[]> {
    return invoke('get_notes');
  }

  create(note: Note): Promise<Note> {
    return invoke('create_note', { note });
  }

  update(note: Note): Promise<void> {
    return invoke('update_note', { note });
  }

  delete(id: number): Promise<void> {
    return invoke('delete_note', { id });
  }
}
