import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-add-card-dialog',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule],
  templateUrl: './add-card-dialog.component.html',
  styleUrl: './add-card-dialog.component.scss',
})
export class AddCardDialogComponent {
  title = '';
  description = '';
  readonly isEdit: boolean;

  // Pass the current values to open the dialog in edit mode
  constructor(
    private dialogRef: MatDialogRef<AddCardDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: { title: string; description: string } | null,
  ) {
    this.isEdit = !!data;
    this.title = data?.title ?? '';
    this.description = data?.description ?? '';
  }

  submit(): void {
    if (!this.title.trim()) return;
    this.dialogRef.close({ title: this.title.trim(), description: this.description.trim() });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
