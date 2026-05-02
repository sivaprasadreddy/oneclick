import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ContactsComponent } from './contacts/contacts.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { RemindersComponent } from './reminders/reminders.component';
import { NotesComponent } from './notes/notes.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'contacts', component: ContactsComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'reminders', component: RemindersComponent },
  { path: 'notes', component: NotesComponent },
];
