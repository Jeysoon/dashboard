import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" cdkFocusInitial>Cancel</button>
      <button mat-flat-button class="danger" [mat-dialog-close]="true">
        {{ data.confirmLabel ?? 'Delete' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .message {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .danger {
      --mat-button-filled-container-color: #c62828;
      --mat-button-filled-label-text-color: #fff;
    }
  `,
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}
}

// Resolves true only when the user clicks the confirm button
export async function confirmDialog(dialog: MatDialog, data: ConfirmDialogData): Promise<boolean> {
  const ref = dialog.open(ConfirmDialogComponent, { data, width: '400px' });
  return (await firstValueFrom(ref.afterClosed())) === true;
}
