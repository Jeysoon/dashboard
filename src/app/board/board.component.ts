import { Component, OnInit, signal } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Card, KanbanColumn } from './models/card.model';
import { COLUMNS } from './models/column.model';
import { SupabaseService } from './services/supabase.service';
import { CardDetailDialogComponent } from './card-detail-dialog/card-detail-dialog.component';
import { AddCardDialogComponent } from './add-card-dialog/add-card-dialog.component';

@Component({
  selector: 'app-board',
  imports: [
    CdkDrag,
    CdkDropList,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit {
  readonly columns = COLUMNS;
  readonly cards = signal<Record<KanbanColumn, Card[]>>({
    backlog: [],
    in_progress: [],
    testing: [],
    done: [],
  });

  constructor(
    private supabase: SupabaseService,
    private dialog: MatDialog,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCards();
  }

  private async loadCards(): Promise<void> {
    const allCards = await this.supabase.getCards();
    const grouped = { backlog: [] as Card[], in_progress: [] as Card[], testing: [] as Card[], done: [] as Card[] };
    for (const card of allCards) {
      grouped[card.column].push(card);
    }
    this.cards.set(grouped);
  }

  getColumnCards(columnId: KanbanColumn): Card[] {
    return this.cards()[columnId];
  }

  getConnectedLists(columnId: KanbanColumn): string[] {
    return COLUMNS.filter((c) => c.id !== columnId).map((c) => c.id);
  }

  async onDrop(event: CdkDragDrop<Card[]>): Promise<void> {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      await this.reorderCards(event.container.id as KanbanColumn);
    } else {
      const card = event.previousContainer.data[event.previousIndex];
      const fromColumn = event.previousContainer.id as KanbanColumn;
      const toColumn = event.container.id as KanbanColumn;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      await this.supabase.addHistoryEntry(card.id, fromColumn, toColumn);
      await this.reorderCards(fromColumn);
      await this.reorderCards(toColumn);
    }
  }

  private async reorderCards(columnId: KanbanColumn): Promise<void> {
    const columnCards = this.cards()[columnId];
    const updates = columnCards.map((card, index) => ({
      id: card.id,
      position: index,
    }));
    await this.supabase.updateCardPositions(updates);
  }

  openCardDetail(card: Card): void {
    this.dialog.open(CardDetailDialogComponent, {
      data: card,
      width: '480px',
    });
  }

  openAddCard(columnId: KanbanColumn): void {
    const dialogRef = this.dialog.open(AddCardDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;
      const position = this.cards()[columnId].length;
      await this.supabase.createCard({
        title: result.title,
        description: result.description,
        column: columnId,
        position,
      });
      await this.loadCards();
    });
  }

  async deleteCard(card: Card): Promise<void> {
    await this.supabase.deleteCard(card.id);
    await this.loadCards();
  }
}
