import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.error) {
        if (error.error.message) {
          errorMessage = error.error.message;
        } else if (Array.isArray(error.error.errors) && error.error.errors.length > 0) {
          errorMessage = error.error.errors.join(', ');
        }
      }

      if (error.status === 401) {
        // Do not toast for failed login attempt (handled by component), only for session expiration
        if (!req.url.includes('/auth/login')) {
          toastService.error('Session expired or unauthorized. Please sign in again.');
          authService.logout();
        }
      } else if (error.status === 403) {
        toastService.error('You do not have permission to perform this action.');
      } else if (error.status === 0) {
        toastService.error('Unable to connect to backend server. Ensure API is running on port 5000.');
      }

      return throwError(() => error);
    })
  );
};
