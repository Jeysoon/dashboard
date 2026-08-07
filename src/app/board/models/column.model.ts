import { KanbanColumn } from './card.model';

export interface ColumnDef {
  id: KanbanColumn;
  title: string;
}

export const COLUMNS: ColumnDef[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'testing', title: 'Testing' },
  { id: 'done', title: 'Done' },
];
