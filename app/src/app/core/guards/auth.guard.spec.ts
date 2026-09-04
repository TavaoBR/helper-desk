/**
 * authGuard — Unit Tests
 *
 * Covers:
 *  - authenticated user → returns true
 *  - unauthenticated user → redirects to /login
 *  - reactive state: guard runs fresh per call (signal-based)
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { makeUser, DummyComponent } from '../../../testing/factories';

// Helper to invoke the guard function through Angular's DI context
function runGuard(): boolean | ReturnType<Router['createUrlTree']> {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as any, {} as any)
  ) as any;
}

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyComponent }, { path: '**', component: DummyComponent }])
      ]
    });
    authService = TestBed.inject(AuthService);
    router      = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  it('should return true when user is authenticated', () => {
    authService.setSession('token', makeUser());
    const result = runGuard();
    expect(result).toBe(true);
  });

  it('should redirect to /login when user is NOT authenticated', () => {
    const result = runGuard();
    // Guard returns a UrlTree pointing to /login
    expect(result).not.toBe(true);
    expect(result.toString()).toBe('/login');
  });

  it('should redirect after logout', () => {
    authService.setSession('token', makeUser());
    expect(runGuard()).toBe(true);

    authService.logout();
    const result = runGuard();
    expect(result).not.toBe(true);
    expect(result.toString()).toBe('/login');
  });
});
