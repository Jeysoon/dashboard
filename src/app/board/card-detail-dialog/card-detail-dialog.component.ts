import { Component, Inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { Card, CardHistory, KanbanColumn } from '../models/card.model';
import { COLUMNS } from '../models/column.model';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-card-detail-dialog',
  imports: [MatDialogModule, MatButtonModule, DatePipe],
  templateUrl: './card-detail-dialog.component.html',
  styleUrl: './card-detail-dialog.component.scss',
})
export class CardDetailDialogComponent implements OnInit {
  readonly history = signal<CardHistory[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public card: Card,
    private dialogRef: MatDialogRef<CardDetailDialogComponent>,
    private supabase: SupabaseService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.history.set(await this.supabase.getCardHistory(this.card.id));
  }

  columnTitle(column: KanbanColumn): string {
    return COLUMNS.find((c) => c.id === column)?.title ?? column;
  }

  close(): void {
    this.dialogRef.close();
  }
}
