import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  toastService.warning('Administrator privileges are required to access this resource.');
  return router.createUrlTree(['/dashboard']);
};
