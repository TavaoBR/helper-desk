/**
 * AuthInterceptor — Unit Tests
 *
 * Covers:
 *  - sets withCredentials: true on all requests
 *  - attaches Authorization Bearer when token is in memory
 *  - passes through non-401 responses
 *  - intercepts 401, calls refresh and retries original request
 *  - CONCURRENCY: multiple simultaneous 401s trigger ONLY ONE refresh request
 *  - all queued requests retry after single refresh succeeds
 *  - when refresh fails, invokes handleSessionExpired and fails queued requests
 *  - does NOT attempt refresh on 401 from /auth/login or /auth/refresh
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
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { authInterceptor, resetRefreshState } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { makeUser, DummyComponent } from '../../../testing/factories';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let authService: AuthService;
  let httpClient: HttpClient;
  let router: Router;

  beforeEach(() => {
    resetRefreshState();
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
    router      = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    resetRefreshState();
  });

  it('should set withCredentials: true on requests', () => {
    httpClient.get('/api/test').subscribe();
    const req = http.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should add Authorization: Bearer <token> header when user has token in memory', () => {
    authService.setSession('my-jwt-token', makeUser());
    httpClient.get('/api/tickets').subscribe();
    const req = http.expectOne('/api/tickets');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('should pass through request unchanged without header after logout', () => {
    authService.setSession('token', makeUser());
    authService.logout();
    httpClient.get('/api/public').subscribe({ error: () => {} });
    const req = http.expectOne('/api/public');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should NOT intercept 401 on /auth/login or /auth/refresh', () => {
    const refreshSpy = vi.spyOn(authService, 'refreshSession');

    let error1: any;
    httpClient.post('/api/auth/login', { email: 'test@test.com', password: 'bad' }).subscribe({
      error: (e) => { error1 = e; }
    });

    const req1 = http.expectOne('/api/auth/login');
    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(error1.status).toBe(401);
  });

  it('should intercept 401, trigger refreshSession, and retry original request on success', () => {
    const refreshSpy = vi.spyOn(authService, 'refreshSession').mockReturnValue(
      of({ user: makeUser(), token: 'new-refreshed-token' })
    );

    let responseData: any = null;
    httpClient.get('/api/tickets').subscribe((data) => {
      responseData = data;
    });

    // 1. Initial request fails with 401
    const initialReq = http.expectOne('/api/tickets');
    initialReq.flush('Token expired', { status: 401, statusText: 'Unauthorized' });

    // Refresh should be triggered
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // 2. Original request should be retried automatically
    const retriedReq = http.expectOne('/api/tickets');
    expect(retriedReq.request.headers.get('Authorization')).toBe('Bearer new-refreshed-token');
    retriedReq.flush([{ id: 'ticket-1' }]);

    expect(responseData).toEqual([{ id: 'ticket-1' }]);
  });

  it('should CONCURRENTLY queue multiple 401 requests and trigger ONLY ONE refresh', () => {
    const refreshTrigger = new Subject<any>();
    const refreshSpy = vi.spyOn(authService, 'refreshSession').mockReturnValue(refreshTrigger.asObservable());

    let resA: any = null;
    let resB: any = null;
    let resC: any = null;

    // Dispatch 3 concurrent requests
    httpClient.get('/api/resource-a').subscribe((data) => { resA = data; });
    httpClient.get('/api/resource-b').subscribe((data) => { resB = data; });
    httpClient.get('/api/resource-c').subscribe((data) => { resC = data; });

    // All 3 receive 401 simultaneously while refresh is in-flight
    http.expectOne('/api/resource-a').flush('Expired', { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/resource-b').flush('Expired', { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/resource-c').flush('Expired', { status: 401, statusText: 'Unauthorized' });

    // Crucial requirement 10: ONLY ONE refresh request must be executed!
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // Now resolve the refresh successfully
    refreshTrigger.next({ user: makeUser(), token: 'concurrent-refreshed-token' });
    refreshTrigger.complete();

    // All 3 requests should be retried with the new token
    const retryA = http.expectOne('/api/resource-a');
    const retryB = http.expectOne('/api/resource-b');
    const retryC = http.expectOne('/api/resource-c');

    expect(retryA.request.headers.get('Authorization')).toBe('Bearer concurrent-refreshed-token');
    expect(retryB.request.headers.get('Authorization')).toBe('Bearer concurrent-refreshed-token');
    expect(retryC.request.headers.get('Authorization')).toBe('Bearer concurrent-refreshed-token');

    retryA.flush({ data: 'A' });
    retryB.flush({ data: 'B' });
    retryC.flush({ data: 'C' });

    expect(resA).toEqual({ data: 'A' });
    expect(resB).toEqual({ data: 'B' });
    expect(resC).toEqual({ data: 'C' });
  });

  it('should handle refresh failure by invoking handleSessionExpired and rejecting queued requests', () => {
    const refreshTrigger = new Subject<any>();
    vi.spyOn(authService, 'refreshSession').mockReturnValue(refreshTrigger.asObservable());
    const expiredSpy = vi.spyOn(authService, 'handleSessionExpired');

    let errorA: any;
    let errorB: any;

    httpClient.get('/api/resource-a').subscribe({ error: (e) => { errorA = e; } });
    httpClient.get('/api/resource-b').subscribe({ error: (e) => { errorB = e; } });

    http.expectOne('/api/resource-a').flush('Expired', { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/resource-b').flush('Expired', { status: 401, statusText: 'Unauthorized' });

    // Fail the in-flight refresh
    refreshTrigger.error({ status: 401, message: 'Session expired' });

    expect(expiredSpy).toHaveBeenCalledTimes(1);
    expect(errorA).toBeDefined();
    expect(errorB).toBeDefined();
  });
});
