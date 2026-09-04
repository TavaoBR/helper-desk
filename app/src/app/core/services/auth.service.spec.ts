/**
 * AuthService — Unit Tests
 *
 * Covers:
 *  - state initialization from localStorage
 *  - login (success, 401, 500)
 *  - logout side-effects
 *  - hasPermission per role
 *  - setSession / token signal
 *  - loadStoredUser with invalid JSON
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { makeAdminUser, makeAgentUser, makeUser, DummyComponent } from '../../../testing/factories';

const TOKEN_KEY = 'supportflow_token';
const USER_KEY  = 'supportflow_user';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyComponent }, { path: '**', component: DummyComponent }])
      ]
    });
    service = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  // ── Initialization ──────────────────────────────────────────────────────────

  it('should initialize with null user and token when localStorage is empty', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should restore user and token from localStorage on initialization', () => {
    // Arrange — pre-populate storage before service is created
    const user  = makeUser();
    const token = 'stored-jwt-token';
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // Re-create service after storage is populated
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    const freshService = TestBed.inject(AuthService);
    const freshHttp    = TestBed.inject(HttpTestingController);

    expect(freshService.currentUser()?.id).toBe(user.id);
    expect(freshService.token()).toBe(token);
    expect(freshService.isAuthenticated()).toBe(true);

    freshHttp.verify();
  });

  it('should handle corrupted JSON in localStorage gracefully', () => {
    localStorage.setItem(USER_KEY, 'INVALID_JSON{{{{');
    localStorage.setItem(TOKEN_KEY, 'some-token');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    const freshService = TestBed.inject(AuthService);
    TestBed.inject(HttpTestingController).verify();

    // user is null but token is still present (corrupted user ≠ bad token)
    expect(freshService.currentUser()).toBeNull();
  });

  // ── Login — happy path ──────────────────────────────────────────────────────

  it('should set session and update signals after successful login', () => {
    const user     = makeUser();
    const token    = 'jwt.token.here';
    const response = { token, user };

    let resolved = false;
    service.login({ email: user.email, password: 'password' }).subscribe(() => {
      resolved = true;
    });

    http.expectOne('http://localhost:8000/api/auth/login').flush(response);

    expect(resolved).toBe(true);
    expect(service.currentUser()?.id).toBe(user.id);
    expect(service.token()).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(JSON.parse(localStorage.getItem(USER_KEY)!).id).toBe(user.id);
  });

  it('should propagate 401 error on invalid credentials', () => {
    let errorReceived = false;
    service.login({ email: 'x@x.com', password: 'wrong' }).subscribe({
      error: () => { errorReceived = true; }
    });

    http.expectOne('http://localhost:8000/api/auth/login').flush(
      { error: { code: 'AUTH_FAILED', message: 'Credenciais inválidas' } },
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

  // ── Logout ──────────────────────────────────────────────────────────────────

  it('should clear storage and signals on logout', () => {
    const user = makeUser();
    service.setSession('my-token', user);
    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  // ── setSession ──────────────────────────────────────────────────────────────

  it('should persist session data to localStorage via setSession', () => {
    const user  = makeAdminUser();
    const token = 'admin-jwt';
    service.setSession(token, user);

    expect(service.token()).toBe(token);
    expect(service.currentUser()?.roles).toContain('ROLE_ADMIN');
    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
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
});
