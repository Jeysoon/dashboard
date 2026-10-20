import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    if (await auth.isAdmin()) return true;
  } catch {
    // treat lookup failures as signed out
  }
  return router.parseUrl('/login');
};
