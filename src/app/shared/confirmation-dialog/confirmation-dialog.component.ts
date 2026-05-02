import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.css',
})
export class ConfirmationDialogComponent {
  title = input('Confirm');
  message = input('Are you sure?');
  confirmLabel = input('Confirm');
  cancelLabel = input('Cancel');

  confirmed = output<void>();
  cancelled = output<void>();
}
