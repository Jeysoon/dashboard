import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { Card, CardHistory } from '../models/card.model';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-card-detail-dialog',
  imports: [MatDialogModule, MatButtonModule, TitleCasePipe, DatePipe],
  templateUrl: './card-detail-dialog.component.html',
  styleUrl: './card-detail-dialog.component.scss',
})
export class CardDetailDialogComponent implements OnInit {
  history: CardHistory[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public card: Card,
    private dialogRef: MatDialogRef<CardDetailDialogComponent>,
    private supabase: SupabaseService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.history = await this.supabase.getCardHistory(this.card.id);
  }

  close(): void {
    this.dialogRef.close();
  }
}
