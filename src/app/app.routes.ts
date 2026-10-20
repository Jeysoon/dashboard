import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'board',
    loadComponent: () => import('./board/board.component').then((m) => m.BoardComponent),
  },
  {
    path: 'extra-hours',
    loadComponent: () =>
      import('./extra-hours/extra-hours.component').then((m) => m.ExtraHoursComponent),
  },
  { path: '', redirectTo: '/board', pathMatch: 'full' },
];
