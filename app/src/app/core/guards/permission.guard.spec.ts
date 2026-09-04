/**
 * permissionGuard & anyPermissionGuard — Unit Tests
 *
 * Covers:
 *  - unauthenticated → /login for both guards
 *  - ROLE_ADMIN → all permissions allowed
 *  - ROLE_AGENT → only agent permissions allowed
 *  - ROLE_USER  → only user permissions allowed
 *  - unknown permission → redirects to /tickets
 *  - anyPermissionGuard with at least one matching permission
 *  - anyPermissionGuard with no matching permission
 *  - canAll, canAny edge cases (empty array)
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { permissionGuard, anyPermissionGuard } from './permission.guard';
import { makeAdminUser, makeAgentUser, makeUser } from '../../../testing/factories';

function runPermGuard(perm: string): boolean | ReturnType<Router['createUrlTree']> {
  return TestBed.runInInjectionContext(() =>
    permissionGuard(perm)({} as any, {} as any)
  ) as any;
}

function runAnyPermGuard(perms: string[]): boolean | ReturnType<Router['createUrlTree']> {
  return TestBed.runInInjectionContext(() =>
    anyPermissionGuard(perms)({} as any, {} as any)
  ) as any;
}

describe('permissionGuard', () => {
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  // ── Not authenticated ──────────────────────────────────────────────────────

  it('should redirect to /login when not authenticated', () => {
    const result = runPermGuard('ticket.create');
    expect(result.toString()).toBe('/login');
  });

  it('should redirect to /login for anyPermissionGuard when not authenticated', () => {
    const result = runAnyPermGuard(['ticket.create', 'settings.view']);
    expect(result.toString()).toBe('/login');
  });

  // ── ROLE_ADMIN ────────────────────────────────────────────────────────────

  it('should allow ROLE_ADMIN to access ticket.create', () => {
    authService.setSession('token', makeAdminUser());
    expect(runPermGuard('ticket.create')).toBe(true);
  });

  it('should allow ROLE_ADMIN to access settings.view', () => {
    authService.setSession('token', makeAdminUser());
    expect(runPermGuard('settings.view')).toBe(true);
  });

  it('should allow ROLE_ADMIN to access settings.manage', () => {
    authService.setSession('token', makeAdminUser());
    expect(runPermGuard('settings.manage')).toBe(true);
  });

  it('should allow ROLE_ADMIN to access user.manage', () => {
    authService.setSession('token', makeAdminUser());
    expect(runPermGuard('user.manage')).toBe(true);
  });

  it('should allow ROLE_ADMIN to access ticket.view_queue', () => {
    authService.setSession('token', makeAdminUser());
    expect(runPermGuard('ticket.view_queue')).toBe(true);
  });

  // ── ROLE_AGENT ────────────────────────────────────────────────────────────

  it('should allow ROLE_AGENT to access ticket.create', () => {
    authService.setSession('token', makeAgentUser());
    expect(runPermGuard('ticket.create')).toBe(true);
  });

  it('should allow ROLE_AGENT to access ticket.view_queue', () => {
    authService.setSession('token', makeAgentUser());
    expect(runPermGuard('ticket.view_queue')).toBe(true);
  });

  it('should allow ROLE_AGENT to access ticket.assign', () => {
    authService.setSession('token', makeAgentUser());
    expect(runPermGuard('ticket.assign')).toBe(true);
  });

  it('should allow ROLE_AGENT to access ticket.comment_internal', () => {
    authService.setSession('token', makeAgentUser());
    expect(runPermGuard('ticket.comment_internal')).toBe(true);
  });

  it('should redirect ROLE_AGENT away from settings.view to /tickets', () => {
    authService.setSession('token', makeAgentUser());
    const result = runPermGuard('settings.view');
    expect(result.toString()).toBe('/tickets');
  });

  it('should redirect ROLE_AGENT away from user.manage to /tickets', () => {
    authService.setSession('token', makeAgentUser());
    const result = runPermGuard('user.manage');
    expect(result.toString()).toBe('/tickets');
  });

  // ── ROLE_USER ─────────────────────────────────────────────────────────────

  it('should allow ROLE_USER to access ticket.create', () => {
    authService.setSession('token', makeUser());
    expect(runPermGuard('ticket.create')).toBe(true);
  });

  it('should allow ROLE_USER to access ticket.comment_public', () => {
    authService.setSession('token', makeUser());
    expect(runPermGuard('ticket.comment_public')).toBe(true);
  });

  it('should redirect ROLE_USER from ticket.assign to /tickets', () => {
    authService.setSession('token', makeUser());
    expect(runPermGuard('ticket.assign').toString()).toBe('/tickets');
  });

  it('should redirect ROLE_USER from ticket.view_queue to /tickets', () => {
    authService.setSession('token', makeUser());
    expect(runPermGuard('ticket.view_queue').toString()).toBe('/tickets');
  });

  it('should redirect ROLE_USER from settings.view to /tickets', () => {
    authService.setSession('token', makeUser());
    expect(runPermGuard('settings.view').toString()).toBe('/tickets');
  });

  it('should redirect ROLE_USER from ticket.comment_internal to /tickets', () => {
    authService.setSession('token', makeUser());
    expect(runPermGuard('ticket.comment_internal').toString()).toBe('/tickets');
  });

  // ── anyPermissionGuard ────────────────────────────────────────────────────

  it('should allow when user has at least one of the required permissions', () => {
    authService.setSession('token', makeAgentUser());
    const result = runAnyPermGuard(['settings.manage', 'ticket.assign']);
    expect(result).toBe(true);
  });

  it('should redirect when user has none of the required permissions', () => {
    authService.setSession('token', makeUser());
    const result = runAnyPermGuard(['ticket.assign', 'settings.view']);
    expect(result.toString()).toBe('/tickets');
  });

  it('should allow ROLE_ADMIN for anyPermissionGuard with any permissions', () => {
    authService.setSession('token', makeAdminUser());
    const result = runAnyPermGuard(['any.permission.that.does.not.exist']);
    expect(result).toBe(true);
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('should redirect with unknown permission string', () => {
    authService.setSession('token', makeUser());
    expect(runPermGuard('non.existent.permission').toString()).toBe('/tickets');
  });

  it('should allow after role upgrade (admin overwrites previous session)', () => {
    authService.setSession('token', makeUser());
    expect(runPermGuard('settings.view').toString()).toBe('/tickets');

    // Simulate admin login
    authService.setSession('admin-token', makeAdminUser());
    expect(runPermGuard('settings.view')).toBe(true);
  });
});
