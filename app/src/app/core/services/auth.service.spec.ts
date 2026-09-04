/**
 * AuthService — Unit Tests
 *
 * Covers:
 *  - state initialization (in-memory signals)
 *  - ensures NO tokens are stored in localStorage or sessionStorage (Requirement 6)
 *  - login (success, 401, 500)
 *  - refreshSession (updates signals)
 *  - logout and logoutAll (clears signals and notifies backend)
 *  - handleSessionExpired (clears state, sets friendly alert, navigates to /login)
 *  - hasPermission per role
 *  - initSession & getMe
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { makeAdminUser, makeAgentUser, makeUser, DummyComponent } from '../../../testing/factories';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyComponent }, { path: '**', component: DummyComponent }])
      ]
    });
    service = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
    router  = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── Initialization & Security (Requirement 6) ───────────────────────────────

  it('should initialize with null user and token in memory', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isSessionExpired()).toBe(false);
  });

  it('must NEVER store access token or refresh token in localStorage or sessionStorage', () => {
    const user = makeUser();
    const token = 'super-secret-jwt-token';

    service.setSession(token, user);

    expect(localStorage.getItem('supportflow_token')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('supportflow_token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  // ── Login — happy path & error handling ────────────────────────────────────

  it('should update signals after successful login and never write tokens to web storage', () => {
    const user = makeUser();
    const token = 'jwt.token.here';
    const response = { user, token, sessionId: 'session-uuid', expiresAt: '2026-09-11T00:00:00Z' };

    let resolved = false;
    service.login({ email: user.email, password: 'password' }).subscribe(() => {
      resolved = true;
    });

    const req = http.expectOne('http://localhost:8000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(response);

    expect(resolved).toBe(true);
    expect(service.currentUser()?.id).toBe(user.id);
    expect(service.token()).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isSessionExpired()).toBe(false);

    // Verify localStorage remains clean
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('should propagate 401 error on invalid credentials', () => {
    let errorReceived = false;
    service.login({ email: 'x@x.com', password: 'wrong' }).subscribe({
      error: () => { errorReceived = true; }
    });

    http.expectOne('http://localhost:8000/api/auth/login').flush(
      { error: { code: 'UNAUTHORIZED', message: 'Credenciais inválidas.' } },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(errorReceived).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should propagate 500 server error', () => {
    let error: any;
    service.login({ email: 'a@a.com', password: '123456' }).subscribe({
      error: (e) => { error = e; }
    });

    http.expectOne('http://localhost:8000/api/auth/login').flush(
      'Internal Server Error',
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(error.status).toBe(500);
    expect(service.isAuthenticated()).toBe(false);
  });

  // ── Refresh Session ────────────────────────────────────────────────────────

  it('should call /auth/refresh and update currentUser signal', () => {
    const user = makeUser({ name: 'Renovado' });
    let resolved = false;

    service.refreshSession().subscribe((res) => {
      resolved = true;
      expect(res.user.name).toBe('Renovado');
    });

    const req = http.expectOne('http://localhost:8000/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush({ user, sessionId: 's-123' });

    expect(resolved).toBe(true);
    expect(service.currentUser()?.name).toBe('Renovado');
    expect(service.isAuthenticated()).toBe(true);
  });

  // ── Logout ──────────────────────────────────────────────────────────────────

  it('should immediately clear state and signals, call backend logout and redirect', () => {
    const user = makeUser();
    service.setSession('token', user);
    expect(service.isAuthenticated()).toBe(true);

    const navigateSpy = vi.spyOn(router, 'navigate');

    service.logout().subscribe();

    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);

    const req = http.expectOne('http://localhost:8000/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Logout realizado com sucesso.' });
  });

  it('should immediately clear state on logoutAll and call backend logout-all', () => {
    service.setSession('token', makeUser());
    expect(service.isAuthenticated()).toBe(true);

    service.logoutAll().subscribe();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);

    const req = http.expectOne('http://localhost:8000/api/auth/logout-all');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Todas as sessões encerradas.' });
  });

  // ── Session Expired (Requirement 8) ────────────────────────────────────────

  it('should handle session expired by clearing state, setting message and redirecting', () => {
    service.setSession('token', makeUser());
    const navigateSpy = vi.spyOn(router, 'navigate');

    service.handleSessionExpired('Sua sessão expirou. Faça login novamente para continuar.');

    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isSessionExpired()).toBe(true);
    expect(service.sessionExpiredMessage()).toBe('Sua sessão expirou. Faça login novamente para continuar.');
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { expired: '1' } });
  });

  // ── hasPermission ───────────────────────────────────────────────────────────

  it('should return false for all permissions when not authenticated', () => {
    expect(service.hasPermission('ticket.create')).toBe(false);
    expect(service.hasPermission('ROLE_ADMIN')).toBe(false);
  });

  it('should grant any permission to ROLE_ADMIN via hasPermission', () => {
    service.setSession('token', makeAdminUser());
    expect(service.hasPermission('ticket.create')).toBe(true);
    expect(service.hasPermission('user.manage')).toBe(true);
    expect(service.hasPermission('any.permission')).toBe(true);
  });

  it('should check specific roles in hasPermission for non-admin', () => {
    const agentUser = makeAgentUser({ roles: ['ROLE_AGENT', 'ticket.view_all'] });
    service.setSession('token', agentUser);
    expect(service.hasPermission('ticket.view_all')).toBe(true);
    expect(service.hasPermission('user.manage')).toBe(false);
  });

  // ── isAuthenticated as computed ─────────────────────────────────────────────

  it('should reflect authentication state reactively via computed signal', () => {
    expect(service.isAuthenticated()).toBe(false);
    service.setSession('token', makeUser());
    expect(service.isAuthenticated()).toBe(true);
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
  });

  // ── initSession ─────────────────────────────────────────────────────────────

  it('should restore session from /auth/me when valid cookie is present', () => {
    const user = makeUser({ name: 'Cookie Restored' });
    let resultUser: any = null;

    service.initSession().subscribe((u) => {
      resultUser = u;
    });

    http.expectOne('http://localhost:8000/api/auth/me').flush({ user });

    expect(resultUser?.name).toBe('Cookie Restored');
    expect(service.currentUser()?.name).toBe('Cookie Restored');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should handle unauthenticated session on initSession gracefully returning null', () => {
    let resultUser: any = undefined;

    service.initSession().subscribe((u) => {
      resultUser = u;
    });

    http.expectOne('http://localhost:8000/api/auth/me').flush(
      'Unauthorized',
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(resultUser).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
