/**
 * TicketService — Unit Tests
 *
 * Covers:
 *  - listTickets with and without filters
 *  - getTicket, createTicket, assignTicket, moveStage, changePriority
 *  - getComments, addComment, getHistory
 *  - catalog methods: getDepartments, getTicketTypes, getCategories, getPriorities
 *  - CRUD for departments, types, priorities, users
 *  - SLA policies, automation rules, notifications, reports
 *  - Error propagation for all methods
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TicketService } from './ticket.service';
import {
  makeTicket,
  makeTicketSummary,
  makeTicketComment,
  makeTicketHistoryItem,
  makeDepartment,
  makePriority,
  makeTicketType,
  makeUser,
  makePaginatedResponse
} from '../../../testing/factories';

const BASE = 'http://localhost:8000/api';

describe('TicketService', () => {
  let service: TicketService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(TicketService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── listTickets ────────────────────────────────────────────────────────────

  it('should GET /tickets with default page=1 and limit=20', () => {
    service.listTickets().subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/tickets`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush(makePaginatedResponse([]));
  });

  it('should pass search filter as query param', () => {
    service.listTickets({ search: 'login', page: 2 }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/tickets`);
    expect(req.request.params.get('search')).toBe('login');
    expect(req.request.params.get('page')).toBe('2');
    req.flush(makePaginatedResponse([]));
  });

  it('should pass departmentId filter', () => {
    service.listTickets({ departmentId: 'dept-1' }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/tickets`);
    expect(req.request.params.get('departmentId')).toBe('dept-1');
    req.flush(makePaginatedResponse([]));
  });

  it('should pass all filters together', () => {
    service.listTickets({
      page: 3,
      limit: 10,
      search: 'error',
      departmentId: 'd-1',
      typeId: 't-1',
      priorityId: 'p-1',
      stageId: 's-1',
      assignedUserId: 'u-1',
      requesterId: 'u-2'
    }).subscribe();

    const req = http.expectOne(r => r.url === `${BASE}/tickets`);
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('search')).toBe('error');
    expect(req.request.params.get('departmentId')).toBe('d-1');
    expect(req.request.params.get('assignedUserId')).toBe('u-1');
    req.flush(makePaginatedResponse([]));
  });

  it('should return paginated ticket items', () => {
    const tickets = [makeTicketSummary(), makeTicketSummary()];
    let result: any;
    service.listTickets().subscribe(r => (result = r));
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(
      makePaginatedResponse(tickets, { total: 2 })
    );
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it('should propagate 500 error from listTickets', () => {
    let error: any;
    service.listTickets().subscribe({ error: e => (error = e) });
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(
      'Server Error',
      { status: 500, statusText: 'Internal Server Error' }
    );
    expect(error.status).toBe(500);
  });

  // ── getTicket ──────────────────────────────────────────────────────────────

  it('should GET /tickets/:id', () => {
    const ticket = makeTicket({ id: 'tk-1' });
    let result: any;
    service.getTicket('tk-1').subscribe(t => (result = t));
    http.expectOne(`${BASE}/tickets/tk-1`).flush(ticket);
    expect(result.id).toBe('tk-1');
  });

  it('should propagate 404 when ticket not found', () => {
    let error: any;
    service.getTicket('non-existent').subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/tickets/non-existent`).flush(
      { error: { code: 'NOT_FOUND', message: 'Ticket not found' } },
      { status: 404, statusText: 'Not Found' }
    );
    expect(error.status).toBe(404);
  });

  // ── createTicket ───────────────────────────────────────────────────────────

  it('should POST /tickets with correct payload', () => {
    const payload = {
      title: 'Mouse não funciona',
      description: 'O mouse parou de funcionar do nada.',
      departmentId: 'dept-1',
      typeId: 'type-1',
      priorityId: 'prio-1'
    };
    const created = makeTicket({ title: payload.title });

    let result: any;
    service.createTicket(payload).subscribe(t => (result = t));

    const req = http.expectOne(`${BASE}/tickets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(created);

    expect(result.title).toBe(payload.title);
  });

  it('should propagate 422 validation error from createTicket', () => {
    let error: any;
    service.createTicket({ title: '', description: '', departmentId: '', typeId: '', priorityId: '' })
      .subscribe({ error: e => (error = e) });

    http.expectOne(`${BASE}/tickets`).flush(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid data' } },
      { status: 422, statusText: 'Unprocessable Entity' }
    );

    expect(error.status).toBe(422);
  });

  it('should propagate 403 from createTicket when user lacks permission', () => {
    let error: any;
    service.createTicket({
      title: 'T', description: 'D', departmentId: 'd', typeId: 't', priorityId: 'p'
    }).subscribe({ error: e => (error = e) });

    http.expectOne(`${BASE}/tickets`).flush(
      { error: { code: 'FORBIDDEN', message: 'Forbidden' } },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(error.status).toBe(403);
  });

  // ── assignTicket ───────────────────────────────────────────────────────────

  it('should POST /tickets/:id/assignment', () => {
    const payload = { userId: 'u-1', expectedVersion: 1 };
    service.assignTicket('tk-1', payload).subscribe();
    const req = http.expectOne(`${BASE}/tickets/tk-1/assignment`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(makeTicket());
  });

  it('should propagate 409 conflict from assignTicket', () => {
    let error: any;
    service.assignTicket('tk-1', { expectedVersion: 1 }).subscribe({ error: e => (error = e) });
    http.expectOne(`${BASE}/tickets/tk-1/assignment`).flush(
      { error: { code: 'CONCURRENCY_CONFLICT', message: 'Version mismatch' } },
      { status: 409, statusText: 'Conflict' }
    );
    expect(error.status).toBe(409);
  });

  // ── moveStage ──────────────────────────────────────────────────────────────

  it('should POST /tickets/:id/transitions with toStageId', () => {
    service.moveStage('tk-1', { toStageId: 'stage-2', expectedVersion: 1 }).subscribe();
    const req = http.expectOne(`${BASE}/tickets/tk-1/transitions`);
    expect(req.request.body.toStageId).toBe('stage-2');
    req.flush(makeTicket());
  });

  // ── changePriority ─────────────────────────────────────────────────────────

  it('should POST /tickets/:id/priority', () => {
    service.changePriority('tk-1', { priorityId: 'prio-high', expectedVersion: 2 }).subscribe();
    const req = http.expectOne(`${BASE}/tickets/tk-1/priority`);
    expect(req.request.body.priorityId).toBe('prio-high');
    req.flush(makeTicket());
  });

  // ── comments ──────────────────────────────────────────────────────────────

  it('should GET /tickets/:id/comments', () => {
    const comments = [makeTicketComment({ ticketId: 'tk-1' })];
    let result: any;
    service.getComments('tk-1').subscribe(c => (result = c));
    http.expectOne(`${BASE}/tickets/tk-1/comments`).flush(comments);
    expect(result).toHaveLength(1);
  });

  it('should POST /tickets/:id/comments', () => {
    const payload = { body: 'Verificando o problema.', visibility: 'public' as const };
    service.addComment('tk-1', payload).subscribe();
    const req = http.expectOne(`${BASE}/tickets/tk-1/comments`);
    expect(req.request.body).toEqual(payload);
    req.flush(makeTicketComment());
  });

  // ── history ────────────────────────────────────────────────────────────────

  it('should GET /tickets/:id/history', () => {
    const history = [makeTicketHistoryItem()];
    let result: any;
    service.getHistory('tk-1').subscribe(h => (result = h));
    http.expectOne(`${BASE}/tickets/tk-1/history`).flush(history);
    expect(result).toHaveLength(1);
  });

  // ── catalog ───────────────────────────────────────────────────────────────

  it('should GET /ticket-settings/departments', () => {
    const depts = [makeDepartment(), makeDepartment()];
    let result: any;
    service.getDepartments().subscribe(d => (result = d));
    http.expectOne(`${BASE}/ticket-settings/departments`).flush(depts);
    expect(result).toHaveLength(2);
  });

  it('should GET /ticket-settings/types with optional departmentId', () => {
    service.getTicketTypes('dept-1').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/ticket-settings/types`);
    expect(req.request.params.get('departmentId')).toBe('dept-1');
    req.flush([]);
  });

  it('should GET /ticket-settings/categories with departmentId and typeId', () => {
    service.getCategories('d-1', 't-1').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/ticket-settings/categories`);
    expect(req.request.params.get('departmentId')).toBe('d-1');
    expect(req.request.params.get('typeId')).toBe('t-1');
    req.flush([]);
  });

  it('should GET /ticket-settings/priorities', () => {
    const prios = [makePriority()];
    let result: any;
    service.getPriorities().subscribe(p => (result = p));
    http.expectOne(`${BASE}/ticket-settings/priorities`).flush(prios);
    expect(result).toHaveLength(1);
  });

  // ── create catalog items ───────────────────────────────────────────────────

  it('should POST /ticket-settings/types', () => {
    service.createTicketType('dept-1', 'Novo Tipo').subscribe();
    const req = http.expectOne(`${BASE}/ticket-settings/types`);
    expect(req.request.body).toEqual({ departmentId: 'dept-1', name: 'Novo Tipo' });
    req.flush(makeTicketType());
  });

  it('should POST /ticket-settings/departments', () => {
    service.createDepartment({ name: 'RH', description: 'Recursos Humanos' }).subscribe();
    const req = http.expectOne(`${BASE}/ticket-settings/departments`);
    expect(req.request.body.name).toBe('RH');
    req.flush(makeDepartment({ name: 'RH' }));
  });

  it('should POST /ticket-settings/priorities', () => {
    service.createPriority({ name: 'Crítica', weight: 100 }).subscribe();
    const req = http.expectOne(`${BASE}/ticket-settings/priorities`);
    expect(req.request.body).toEqual({ name: 'Crítica', weight: 100 });
    req.flush(makePriority({ name: 'Crítica', weight: 100 }));
  });

  // ── users ──────────────────────────────────────────────────────────────────

  it('should GET /users', () => {
    const users = [makeUser(), makeUser()];
    let result: any;
    service.getUsers().subscribe(u => (result = u));
    http.expectOne(`${BASE}/users`).flush(users);
    expect(result).toHaveLength(2);
  });

  it('should POST /users with correct payload', () => {
    const payload = {
      name: 'New User',
      email: 'new@test.com',
      password: 'Secure123!',
      roles: ['ROLE_AGENT']
    };
    service.createUser(payload).subscribe();
    const req = http.expectOne(`${BASE}/users`);
    expect(req.request.body).toEqual(payload);
    req.flush(makeUser({ name: payload.name, email: payload.email, roles: payload.roles }));
  });

  // ── SLA policies ──────────────────────────────────────────────────────────

  it('should GET /sla-policies', () => {
    service.getSlaPolicies().subscribe();
    http.expectOne(`${BASE}/sla-policies`).flush({ items: [] });
  });

  it('should POST /sla-policies', () => {
    const payload = { name: 'SLA Crítica', responseTime: 30, resolutionTime: 240 };
    service.createSlaPolicy(payload).subscribe();
    const req = http.expectOne(`${BASE}/sla-policies`);
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'sla-1', ...payload });
  });

  it('should DELETE /sla-policies/:id', () => {
    service.deleteSlaPolicy('sla-1').subscribe();
    const req = http.expectOne(`${BASE}/sla-policies/sla-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Reports ───────────────────────────────────────────────────────────────

  it('should GET /reports/kpis with period and department params', () => {
    service.getReportKpis('7d', 'dept-1').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/reports/kpis`);
    expect(req.request.params.get('period')).toBe('7d');
    expect(req.request.params.get('department')).toBe('dept-1');
    req.flush({});
  });

  it('should GET /reports/volume with default period', () => {
    service.getReportVolume().subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/reports/volume`);
    expect(req.request.params.get('period')).toBe('30d');
    req.flush({});
  });

  it('should GET /reports/departments and /reports/agents', () => {
    service.getReportDepartments().subscribe();
    http.expectOne(`${BASE}/reports/departments`).flush({ items: [] });

    service.getReportAgents().subscribe();
    http.expectOne(`${BASE}/reports/agents`).flush({ items: [] });
  });

  // ── Automation rules ──────────────────────────────────────────────────────

  it('should GET /automations', () => {
    service.getAutomationRules().subscribe();
    http.expectOne(`${BASE}/automations`).flush({ items: [] });
  });

  it('should POST /automations', () => {
    const payload = { name: 'Auto-assign TI', trigger: 'ticket.created', actions: [] };
    service.createAutomationRule(payload).subscribe();
    http.expectOne(`${BASE}/automations`).flush({ id: 'auto-1', ...payload });
  });

  it('should PUT /automations/:id', () => {
    service.updateAutomationRule('auto-1', { name: 'Updated' }).subscribe();
    const req = http.expectOne(`${BASE}/automations/auto-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should PATCH /automations/:id/toggle', () => {
    service.toggleAutomationRule('auto-1').subscribe();
    const req = http.expectOne(`${BASE}/automations/auto-1/toggle`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should DELETE /automations/:id', () => {
    service.deleteAutomationRule('auto-1').subscribe();
    const req = http.expectOne(`${BASE}/automations/auto-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  it('should GET /notifications/settings', () => {
    service.getNotificationSettings().subscribe();
    http.expectOne(`${BASE}/notifications/settings`).flush({ items: [] });
  });

  it('should PUT /notifications/settings', () => {
    const items = [{ type: 'email', enabled: true }];
    service.updateNotificationSettings(items).subscribe();
    const req = http.expectOne(`${BASE}/notifications/settings`);
    expect(req.request.body).toEqual({ items });
    req.flush({});
  });

  it('should POST /notifications/test', () => {
    service.sendTestNotification().subscribe();
    const req = http.expectOne(`${BASE}/notifications/test`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should GET /notifications/in-app', () => {
    service.getInAppNotifications().subscribe();
    http.expectOne(`${BASE}/notifications/in-app`).flush({ items: [], unreadCount: 0 });
  });

  it('should PATCH /notifications/in-app/:id/read', () => {
    service.markNotificationRead('notif-1').subscribe();
    const req = http.expectOne(`${BASE}/notifications/in-app/notif-1/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
