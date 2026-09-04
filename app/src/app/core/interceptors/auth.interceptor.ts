import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

interface RefreshResult {
  success: boolean;
  token?: string;
}

let isRefreshing = false;
let refreshSubject = new BehaviorSubject<RefreshResult | null>(null);

/**
 * Reset refresh state (useful for test isolation)
 */
export function resetRefreshState(): void {
  isRefreshing = false;
  refreshSubject = new BehaviorSubject<RefreshResult | null>(null);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  // 1. Prepare cloned request with credentials and optional bearer token
  const headersToSet: Record<string, string> = {};
  if (token && !req.headers.has('Authorization')) {
    headersToSet['Authorization'] = `Bearer ${token}`;
  }

  const authenticatedReq = req.clone({
    withCredentials: true,
    setHeaders: headersToSet
  });

  return next(authenticatedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // 2. Do NOT attempt refresh for authentication endpoints to prevent infinite loops
      const url = req.url.toLowerCase();
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/logout')
      ) {
        return throwError(() => error);
      }

      // 3. Handle 401 with strict concurrency control (single refresh for simultaneous calls)
      if (!isRefreshing) {
        isRefreshing = true;
        refreshSubject.next(null);

        return authService.refreshSession().pipe(
          switchMap((res) => {
            isRefreshing = false;
            const retryToken = res?.token || authService.token();
            refreshSubject.next({ success: true, token: retryToken || undefined });

            // Replay original request with updated credentials
            const retryHeaders: Record<string, string> = {};
            if (retryToken) {
              retryHeaders['Authorization'] = `Bearer ${retryToken}`;
            }

            return next(
              req.clone({
                withCredentials: true,
                setHeaders: retryHeaders
              })
            );
          }),
          catchError((refreshErr) => {
            isRefreshing = false;
            refreshSubject.next({ success: false });
            authService.handleSessionExpired('Sua sessão expirou. Faça login novamente para continuar.');
            return throwError(() => refreshErr);
          })
        );
      } else {
        // A refresh request is already in-flight! Queue this request and retry once resolved
        return refreshSubject.pipe(
          filter((status): status is RefreshResult => status !== null),
          take(1),
          switchMap((status) => {
            if (status.success) {
              const retryToken = status.token || authService.token();
              const retryHeaders: Record<string, string> = {};
              if (retryToken) {
                retryHeaders['Authorization'] = `Bearer ${retryToken}`;
              }

              return next(
                req.clone({
                  withCredentials: true,
                  setHeaders: retryHeaders
                })
              );
            }

            return throwError(() => error);
          })
        );
      }
    })
  );
};
