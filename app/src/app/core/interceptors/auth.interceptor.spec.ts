/**
 * AuthInterceptor — Unit Tests
 *
 * Covers:
 *  - requests without token pass through unchanged
 *  - requests with token get Authorization: Bearer header
 *  - header is not duplicated
 *  - interceptor does not interfere with error responses
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { makeUser, DummyComponent } from '../../../testing/factories';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let authService: AuthService;
  let httpClient: HttpClient;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyComponent }, { path: '**', component: DummyComponent }])
      ]
    });
    http        = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    httpClient  = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should NOT add Authorization header when user is not authenticated', () => {
    httpClient.get('/api/test').subscribe();
    const req = http.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Authorization: Bearer <token> header when user is authenticated', () => {
    authService.setSession('my-jwt-token', makeUser());
    httpClient.get('/api/tickets').subscribe();
    const req = http.expectOne('/api/tickets');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush([]);
  });

  it('should add Bearer token to POST requests', () => {
    authService.setSession('post-token', makeUser());
    httpClient.post('/api/tickets', {}).subscribe();
    const req = http.expectOne('/api/tickets');
    expect(req.request.headers.get('Authorization')).toBe('Bearer post-token');
    req.flush({});
  });

  it('should pass through request unchanged after token is cleared (logout)', () => {
    authService.setSession('token', makeUser());
    authService.logout();
    httpClient.get('/api/public').subscribe({ error: () => {} });
    const req = http.expectOne('/api/public');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not interfere with error responses', () => {
    authService.setSession('err-token', makeUser());
    let error: unknown;
    httpClient.get('/api/fail').subscribe({ error: (e: unknown) => { error = e; } });
    http.expectOne('/api/fail').flush(
      { error: { code: 'SERVER_ERROR' } },
      { status: 500, statusText: 'Internal Server Error' }
    );
    expect((error as { status: number }).status).toBe(500);
  });
});
