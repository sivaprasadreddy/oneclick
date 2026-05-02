import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  navItems = [
    { path: '/home', label: 'Home', icon: 'home' },
    { path: '/contacts', label: 'Contacts', icon: 'contacts' },
    { path: '/expenses', label: 'Expenses', icon: 'expenses' },
    { path: '/reminders', label: 'Reminders', icon: 'reminders' },
    { path: '/notes', label: 'Notes', icon: 'notes' },
  ];
}
