import { Routes } from '@angular/router';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: 'board',
        loadComponent: () => import('./board/board.component').then((m) => m.BoardComponent),
      },
      {
        path: 'extra-hours',
        loadComponent: () =>
          import('./extra-hours/extra-hours.component').then((m) => m.ExtraHoursComponent),
      },
      { path: '', redirectTo: 'board', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
