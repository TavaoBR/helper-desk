/**
 * ApiService — Unit Tests
 *
 * Covers:
 *  - GET with no params
 *  - GET with partial params (undefined/null/empty values filtered)
 *  - POST, PUT, PATCH, DELETE
 *  - upload (FormData)
 *  - baseUrl composition
 *  - HTTP error propagation
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

const BASE = 'http://localhost:8000/api';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ApiService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── GET ────────────────────────────────────────────────────────────────────

  it('should make a GET request to the correct URL with no params', () => {
    service.get('/tickets').subscribe();
    const req = http.expectOne(`${BASE}/tickets`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toHaveLength(0);
    req.flush([]);
  });

  it('should append defined query params and skip undefined/null/empty ones', () => {
    service.get('/tickets', {
      page: 1,
      limit: 20,
      search: undefined,
      departmentId: '',
      priorityId: 'p-1'
    }).subscribe();

    const req = http.expectOne(r => r.url === `${BASE}/tickets`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('search')).toBe(false);
    expect(req.request.params.has('departmentId')).toBe(false);
    expect(req.request.params.get('priorityId')).toBe('p-1');
    req.flush([]);
  });

  it('should handle boolean param values', () => {
    service.get('/users', { isActive: true }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/users`);
    expect(req.request.params.get('isActive')).toBe('true');
    req.flush([]);
  });

  it('should return data from GET response', () => {
    const expected = [{ id: '1' }];
    let result: any;
    service.get<typeof expected>('/items').subscribe(d => (result = d));
    http.expectOne(`${BASE}/items`).flush(expected);
    expect(result).toEqual(expected);
  });

  // ── POST ───────────────────────────────────────────────────────────────────

  it('should make a POST request with the correct body', () => {
    const body = { title: 'Test', description: 'Desc' };
    service.post('/tickets', body).subscribe();
    const req = http.expectOne(`${BASE}/tickets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'new-id', ...body });
  });

  it('should propagate POST 422 validation errors', () => {
    let error: any;
    service.post('/tickets', {}).subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/tickets`).flush(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: {} } },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
    expect(error.status).toBe(422);
  });

  // ── PUT ────────────────────────────────────────────────────────────────────

  it('should make a PUT request to the correct endpoint', () => {
    const body = { items: [] };
    service.put('/notifications/settings', body).subscribe();
    const req = http.expectOne(`${BASE}/notifications/settings`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  // ── PATCH ──────────────────────────────────────────────────────────────────

  it('should make a PATCH request', () => {
    service.patch('/notifications/in-app/n-1/read', {}).subscribe();
    const req = http.expectOne(`${BASE}/notifications/in-app/n-1/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  it('should make a DELETE request', () => {
    service.delete('/sla-policies/sla-1').subscribe();
    const req = http.expectOne(`${BASE}/sla-policies/sla-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should propagate DELETE 404 error', () => {
    let error: any;
    service.delete('/sla-policies/non-existent').subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/sla-policies/non-existent`).flush(
      { error: { code: 'NOT_FOUND', message: 'Not found' } },
      { status: 404, statusText: 'Not Found' }
    );
    expect(error.status).toBe(404);
  });

  // ── upload ─────────────────────────────────────────────────────────────────

  it('should POST FormData via upload method', () => {
    const fd = new FormData();
    fd.append('file', new Blob(['content']), 'file.txt');
    service.upload('/attachments', fd).subscribe();
    const req = http.expectOne(`${BASE}/attachments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush({ id: 'att-1' });
  });

  // ── Error propagation ──────────────────────────────────────────────────────

  it('should propagate network errors', () => {
    let error: any;
    service.get('/any').subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/any`).error(new ProgressEvent('error'));
    expect(error).toBeTruthy();
  });

  it('should propagate 401 error correctly', () => {
    let error: any;
    service.get('/protected').subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/protected`).flush(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401, statusText: 'Unauthorized' }
    );
    expect(error.status).toBe(401);
  });

  it('should propagate 403 Forbidden error', () => {
    let error: any;
    service.get('/admin-only').subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/admin-only`).flush(
      { error: { code: 'FORBIDDEN', message: 'Forbidden' } },
      { status: 403, statusText: 'Forbidden' }
    );
    expect(error.status).toBe(403);
  });

  it('should propagate 500 Internal Server Error', () => {
    let error: any;
    service.get('/broken').subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/broken`).flush(
      'Internal Server Error',
      { status: 500, statusText: 'Internal Server Error' }
    );
    expect(error.status).toBe(500);
  });

  it('should propagate 503 Service Unavailable', () => {
    let error: any;
    service.post('/tickets', {}).subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/tickets`).flush(
      'Service Unavailable',
      { status: 503, statusText: 'Service Unavailable' }
    );
    expect(error.status).toBe(503);
  });

  it('should propagate 409 Conflict', () => {
    let error: any;
    service.post('/users', { email: 'dup@test.com' }).subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/users`).flush(
      { error: { code: 'CONFLICT', message: 'User already exists' } },
      { status: 409, statusText: 'Conflict' }
    );
    expect(error.status).toBe(409);
  });

  it('should propagate 429 Too Many Requests', () => {
    let error: any;
    service.post('/auth/login', {}).subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/auth/login`).flush(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { status: 429, statusText: 'Too Many Requests' }
    );
    expect(error.status).toBe(429);
  });
});
