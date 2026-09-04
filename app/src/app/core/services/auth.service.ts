import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { ApiService } from './api.service';
import { User, LoginRequest, LoginResponse, UserResponse, ActiveSession } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(null);
  private readonly sessionExpiredSignal = signal<boolean>(false);
  private readonly sessionExpiredMessageSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly token = this.tokenSignal.asReadonly();
  readonly isSessionExpired = this.sessionExpiredSignal.asReadonly();
  readonly sessionExpiredMessage = this.sessionExpiredMessageSignal.asReadonly();

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((res) => {
        this.sessionExpiredSignal.set(false);
        this.sessionExpiredMessageSignal.set(null);
        this.currentUserSignal.set(res.user);
        if (res.token) {
          this.tokenSignal.set(res.token);
        }
      })
    );
  }

  refreshSession(): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/refresh', {}).pipe(
      tap((res) => {
        this.currentUserSignal.set(res.user);
        if (res.token) {
          this.tokenSignal.set(res.token);
        }
      })
    );
  }

  logout(): Observable<void> {
    this.clearSession();
    this.router.navigate(['/login']);
    return this.api.post<void>('/auth/logout', {}).pipe(
      catchError(() => of(void 0))
    );
  }

  logoutAll(): Observable<void> {
    this.clearSession();
    this.router.navigate(['/login']);
    return this.api.post<void>('/auth/logout-all', {}).pipe(
      catchError(() => of(void 0))
    );
  }

  getMe(): Observable<UserResponse> {
    return this.api.get<UserResponse>('/auth/me').pipe(
      tap((res) => {
        this.currentUserSignal.set(res.user);
      })
    );
  }

  initSession(): Observable<User | null> {
    return this.getMe().pipe(
      map((res) => res.user),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  handleSessionExpired(message: string = 'Sua sessão expirou. Faça login novamente para continuar.'): void {
    this.clearSession();
    this.sessionExpiredSignal.set(true);
    this.sessionExpiredMessageSignal.set(message);
    this.router.navigate(['/login'], { queryParams: { expired: '1' } });
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    return user.roles.includes('ROLE_ADMIN') || user.roles.includes(permission);
  }

  setSession(tokenOrUser: string | User, user?: User): void {
    if (typeof tokenOrUser === 'string') {
      this.tokenSignal.set(tokenOrUser);
      if (user) {
        this.currentUserSignal.set(user);
      }
    } else {
      this.currentUserSignal.set(tokenOrUser);
    }
  }

  clearSession(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
  }

  getActiveSessions(): Observable<ActiveSession[]> {
    return this.api.get<ActiveSession[]>('/auth/sessions');
  }

  revokeSession(sessionId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
  }
}
