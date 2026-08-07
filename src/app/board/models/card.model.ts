export type KanbanColumn = 'backlog' | 'in_progress' | 'testing' | 'done';

export interface Card {
  id: string;
  title: string;
  description: string;
  column: KanbanColumn;
  position: number;
  created_at: string;
}

export interface CardHistory {
  id: string;
  card_id: string;
  from_column: KanbanColumn;
  to_column: KanbanColumn;
  moved_at: string;
}
