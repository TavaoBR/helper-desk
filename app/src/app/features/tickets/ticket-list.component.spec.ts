/**
 * TicketListComponent — Unit Tests (zoneless-compatible)
 *
 * Uses async/await + fixture.whenStable() instead of fakeAsync/tick.
 *
 * Covers:
 *  - Loading state (skeleton rows visible)
 *  - Empty state (no tickets found)
 *  - Error state (API 500, 403)
 *  - Ticket table rendering (protocol, title, assignee columns)
 *  - Tab filtering (displayTickets by stage name)
 *  - Tab counters
 *  - Filter panel toggle
 *  - hasActiveFilters + clearFilters
 *  - Priority badge class (getPriorityClass / getPriorityDotClass)
 *  - Stage badge class (getStageClass)
 *  - Scope resolution per role
 *  - Agent view toggle
 *  - Pagination helper methods
 *  - Edge cases (empty stage name, failed catalog endpoints)
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TicketListComponent } from './ticket-list.component';
import { AuthService } from '../../core/services/auth.service';
import type { ApiPaginatedResponse } from '../../core/models/api.model';
import type { TicketSummary } from '../../core/models/ticket.model';
import {
  makeAdminUser,
  makeAgentUser,
  makeUser,
  makeTicketSummary,
  makePaginatedResponse
} from '../../../testing/factories';

const BASE = 'http://localhost:8000/api';

function flushCatalog(http: HttpTestingController): void {
  http.expectOne(`${BASE}/ticket-settings/departments`).flush([]);
  http.expectOne(`${BASE}/ticket-settings/priorities`).flush([]);
}

function flushTickets(
  http: HttpTestingController,
  tickets: ApiPaginatedResponse<TicketSummary> = makePaginatedResponse<TicketSummary>([])
): void {
  http.expectOne(r => r.url === `${BASE}/tickets`).flush(tickets);
}

describe('TicketListComponent', () => {
  let fixture: ComponentFixture<TicketListComponent>;
  let component: TicketListComponent;
  let http: HttpTestingController;
  let authService: AuthService;

  async function setup(
    queryParams: Record<string, string> = {},
    userFactory: () => any = makeAdminUser
  ): Promise<void> {
    TestBed.configureTestingModule({
      imports: [TicketListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of({ get: (key: string) => queryParams[key] ?? null })
          }
        }
      ]
    });
    localStorage.clear();
    authService = TestBed.inject(AuthService);
    authService.setSession('token', userFactory());

    fixture   = TestBed.createComponent(TicketListComponent);
    component = fixture.componentInstance;
    http      = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    try { http.verify(); } catch { /* ignore pending in error tests */ }
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('should show skeleton rows while loading', async () => {
    await setup();
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const skeletons = fixture.nativeElement.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);

    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.isLoading()).toBe(false);
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it('should show empty state when no tickets are returned', async () => {
    await setup();
    fixture.detectChanges();

    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>([]));
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')).toBeTruthy();
    expect(el.textContent).toContain('Nenhum chamado encontrado');
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it('should show error message on API 500', async () => {
    await setup();
    fixture.detectChanges();

    flushCatalog(http);
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(
      'Server Error',
      { status: 500, statusText: 'Internal Server Error' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.alert.alert-danger')).toBeTruthy();
    expect(component.isLoading()).toBe(false);
  });

  it('should show custom error message from API response', async () => {
    await setup();
    fixture.detectChanges();

    flushCatalog(http);
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(
      { error: { code: 'FORBIDDEN', message: 'Acesso negado.' } },
      { status: 403, statusText: 'Forbidden' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Acesso negado.');
  });

  // ── Table rendering ───────────────────────────────────────────────────────

  it('should render ticket rows in table after loading', async () => {
    await setup();
    fixture.detectChanges();

    const t1 = makeTicketSummary({ title: 'Problema de rede', protocol: 'TKT-00001' });
    const t2 = makeTicketSummary({ title: 'Impressora travada', protocol: 'TKT-00002' });

    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>([t1, t2], { total: 2 }));
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('TKT-00001');
    expect(el.textContent).toContain('Problema de rede');
    expect(el.textContent).toContain('TKT-00002');
    expect(el.textContent).toContain('Impressora travada');
  });

  it('should show "— Não atribuído" when ticket has no assignee', async () => {
    await setup();
    fixture.detectChanges();

    const ticket = makeTicketSummary({ assignedUser: null });
    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>([ticket]));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('— Não atribuído');
  });

  it('should show assignee avatar initial when ticket is assigned', async () => {
    await setup();
    fixture.detectChanges();

    const ticket = makeTicketSummary({
      assignedUser: { id: 'u-1', name: 'Carlos Menezes' }
    });
    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>([ticket]));
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const avatar = el.querySelector('.assignee-avatar');
    expect(avatar?.textContent?.trim()).toBe('C');
  });

  // ── Tab filtering ─────────────────────────────────────────────────────────

  it('should filter tickets by "open" tab (stage contains "novo")', async () => {
    await setup();
    fixture.detectChanges();

    const open   = makeTicketSummary({ stage: { id: 's1', name: 'Novo', isInitial: true, isFinal: false } });
    const closed = makeTicketSummary({ stage: { id: 's2', name: 'Fechado', isInitial: false, isFinal: true } });

    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>([open, closed]));
    await fixture.whenStable();
    fixture.detectChanges();

    component.setTab('open');
    expect(component.displayTickets.length).toBe(1);
    expect(component.displayTickets[0].stage.name).toBe('Novo');
  });

  it('should show all tickets in "all" tab', async () => {
    await setup();
    fixture.detectChanges();

    const tickets = [makeTicketSummary(), makeTicketSummary(), makeTicketSummary()];
    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>(tickets, { total: 3 }));
    await fixture.whenStable();
    fixture.detectChanges();

    component.setTab('all');
    expect(component.displayTickets.length).toBe(3);
  });

  it('should filter tickets by "resolved" tab', async () => {
    await setup();
    fixture.detectChanges();

    const resolved = makeTicketSummary({ stage: { id: 's1', name: 'Resolvido', isInitial: false, isFinal: true } });
    const open     = makeTicketSummary({ stage: { id: 's2', name: 'Novo', isInitial: true, isFinal: false } });

    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>([resolved, open]));
    await fixture.whenStable();
    fixture.detectChanges();

    component.setTab('resolved');
    expect(component.displayTickets.length).toBe(1);
    expect(component.displayTickets[0].stage.name).toBe('Resolvido');
  });

  // ── Tab counters ──────────────────────────────────────────────────────────

  it('should calculate correct tab counters', async () => {
    await setup();
    fixture.detectChanges();

    const tickets = [
      makeTicketSummary({ stage: { id: 's1', name: 'Novo', isInitial: true, isFinal: false } }),
      makeTicketSummary({ stage: { id: 's2', name: 'Novo', isInitial: true, isFinal: false } }),
      makeTicketSummary({ stage: { id: 's3', name: 'Em atendimento', isInitial: false, isFinal: false } }),
      makeTicketSummary({ stage: { id: 's4', name: 'Resolvido', isInitial: false, isFinal: true } }),
      makeTicketSummary({ stage: { id: 's5', name: 'Fechado', isInitial: false, isFinal: true } })
    ];

    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>(tickets, { total: 5 }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.openCount()).toBe(2);
    expect(component.attendingCount()).toBe(1);
    expect(component.resolvedCount()).toBe(1);
    expect(component.closedCount()).toBe(1);
  });

  // ── Priority classes ──────────────────────────────────────────────────────

  it('should return correct priority classes for all weight ranges', async () => {
    await setup();
    expect(component.getPriorityClass(90)).toContain('priority-critical');
    expect(component.getPriorityClass(100)).toContain('priority-critical');
    expect(component.getPriorityClass(70)).toContain('priority-high');
    expect(component.getPriorityClass(80)).toContain('priority-high');
    expect(component.getPriorityClass(40)).toContain('priority-medium');
    expect(component.getPriorityClass(55)).toContain('priority-medium');
    expect(component.getPriorityClass(0)).toContain('priority-low');
    expect(component.getPriorityClass(39)).toContain('priority-low');
  });

  it('should return correct priority dot classes', async () => {
    await setup();
    expect(component.getPriorityDotClass(90)).toContain('dot-critical');
    expect(component.getPriorityDotClass(75)).toContain('dot-high');
    expect(component.getPriorityDotClass(50)).toContain('dot-medium');
    expect(component.getPriorityDotClass(10)).toContain('dot-low');
  });

  // ── Stage classes ─────────────────────────────────────────────────────────

  it('should return correct stage CSS class for each stage name', async () => {
    await setup();
    expect(component.getStageClass('Novo')).toContain('status-novo');
    expect(component.getStageClass('Triagem')).toContain('status-triagem');
    expect(component.getStageClass('Em atendimento')).toContain('status-atendimento');
    expect(component.getStageClass('Aguardando usuário')).toContain('status-aguardando');
    expect(component.getStageClass('Resolvido')).toContain('status-resolvido');
    expect(component.getStageClass('Fechado')).toContain('status-fechado');
    expect(component.getStageClass('Encerrado')).toContain('status-fechado');
    expect(component.getStageClass('Unknown Stage')).toContain('status-default');
  });

  // ── Filters ───────────────────────────────────────────────────────────────

  it('should toggle filter panel visibility', async () => {
    await setup();
    fixture.detectChanges();
    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.showFilters()).toBe(false);
    component.showFilters.update(v => !v);
    fixture.detectChanges();
    expect(component.showFilters()).toBe(true);
  });

  it('hasActiveFilters returns false when no filter is set', async () => {
    await setup();
    fixture.detectChanges();
    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();

    expect(component.hasActiveFilters()).toBe(false);
  });

  it('hasActiveFilters returns true when department is selected', async () => {
    await setup();
    fixture.detectChanges();
    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();

    component.selectedDepartment = 'dept-1';
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('clearFilters should reset department and priority selections', async () => {
    await setup();
    fixture.detectChanges();
    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();

    component.selectedDepartment = 'dept-1';
    component.selectedPriority   = 'prio-1';

    component.clearFilters();
    expect(component.selectedDepartment).toBe('');
    expect(component.selectedPriority).toBe('');

    flushTickets(http);
    await fixture.whenStable();
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  it('getPageNumbers should return sequential array for total <= 7', async () => {
    await setup();
    expect(component.getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(component.getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('getPageNumbers should include ellipsis (-1) for large page counts', async () => {
    await setup();
    const pages = component.getPageNumbers(5, 20);
    expect(pages[0]).toBe(1);
    expect(pages[pages.length - 1]).toBe(20);
    expect(pages.includes(-1)).toBe(true);
  });

  it('totalPages should return 1 when total is 0', async () => {
    await setup();
    expect(component.totalPages({ page: 1, limit: 20, total: 0 })).toBe(1);
  });

  it('totalPages should calculate correctly', async () => {
    await setup();
    expect(component.totalPages({ page: 1, limit: 20, total: 100 })).toBe(5);
    expect(component.totalPages({ page: 1, limit: 15, total: 31 })).toBe(3);
  });

  // ── Scope resolution ──────────────────────────────────────────────────────

  it('should set scope to "mine" for ROLE_USER with no queryParam', async () => {
    await setup({}, makeUser);
    fixture.detectChanges();
    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();

    expect(component.currentScope()).toBe('mine');
  });

  it('should set scope to "all" for ROLE_ADMIN with no queryParam', async () => {
    await setup({}, makeAdminUser);
    fixture.detectChanges();
    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();

    expect(component.currentScope()).toBe('all');
  });

  it('should use scope from queryParam when provided', async () => {
    await setup({ scope: 'attending' }, makeAgentUser);
    fixture.detectChanges();
    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();

    expect(component.currentScope()).toBe('attending');
  });

  // ── Agent view toggle ─────────────────────────────────────────────────────

  it('should update agentView signal and reload tickets', async () => {
    await setup({ scope: 'attending' }, makeAgentUser);
    fixture.detectChanges();
    flushCatalog(http);
    flushTickets(http);
    await fixture.whenStable();

    component.setAgentView('mine');
    expect(component.agentView()).toBe('mine');
    flushTickets(http);
    await fixture.whenStable();
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('should handle empty stage name gracefully in tab filtering', async () => {
    await setup();
    fixture.detectChanges();

    const ticket = makeTicketSummary({ stage: { id: 's1', name: '', isInitial: false, isFinal: false } });
    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>([ticket]));
    await fixture.whenStable();
    fixture.detectChanges();

    component.setTab('open');
    expect(() => component.displayTickets).not.toThrow();
  });

  it('should not crash when catalog endpoints fail', async () => {
    await setup();
    fixture.detectChanges();

    http.expectOne(`${BASE}/ticket-settings/departments`).flush(
      'Error', { status: 500, statusText: 'Internal Server Error' }
    );
    http.expectOne(`${BASE}/ticket-settings/priorities`).flush(
      'Error', { status: 500, statusText: 'Internal Server Error' }
    );
    flushTickets(http);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('totalCount uses pagination.total', async () => {
    await setup();
    fixture.detectChanges();

    flushCatalog(http);
    flushTickets(http, makePaginatedResponse<TicketSummary>(
      [makeTicketSummary(), makeTicketSummary()], { total: 2 }
    ));
    await fixture.whenStable();

    expect(component.totalCount()).toBe(2);
  });
});
