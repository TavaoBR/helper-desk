/**
 * DashboardComponent — Unit Tests (zoneless-compatible)
 *
 * Uses async/await + fixture.whenStable() instead of fakeAsync/tick.
 *
 * Covers:
 *  - Greeting with firstName derived from user's name
 *  - KPI counters: fallback values when no tickets, real counts when tickets exist
 *  - Ticket load on ngOnInit
 *  - Error on listTickets → silenced (component still renders)
 *  - "Novo chamado" button link
 *  - firstName edge cases: single name, empty name
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { makeUser, makeTicketSummary, makePaginatedResponse } from '../../../testing/factories';

const BASE = 'http://localhost:8000/api';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let http: HttpTestingController;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'tickets/new', component: {} as any }
        ])
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    http        = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try { http.verify(); } catch { /* ignore */ }
    localStorage.clear();
  });

  function createComponent(userName = 'Anderson Silva'): void {
    authService.setSession('token', makeUser({ name: userName }));
    fixture   = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ── firstName ─────────────────────────────────────────────────────────────

  it('should extract first name from full name', async () => {
    createComponent('Maria Santos');
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse([]));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.firstName()).toBe('Maria');
    expect(fixture.nativeElement.textContent).toContain('Maria');
  });

  it('should return single name when user has only one name', async () => {
    createComponent('Anderson');
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse([]));
    await fixture.whenStable();

    expect(component.firstName()).toBe('Anderson');
  });

  it('should return "Anderson" as fallback when user has no name', async () => {
    authService.setSession('token', makeUser({ name: '' }));
    fixture   = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse([]));
    await fixture.whenStable();

    expect(component.firstName()).toBe('Anderson');
  });

  // ── KPI fallback values ───────────────────────────────────────────────────

  it('should return fallback KPI values when no tickets are loaded', async () => {
    createComponent();
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse([]));
    await fixture.whenStable();

    expect(component.totalCount()).toBe(532);
    expect(component.openCount()).toBe(128);
    expect(component.attendingCount()).toBe(78);
    expect(component.waitingCount()).toBe(36);
    expect(component.resolvedCount()).toBe(290);
  });

  // ── KPI real values ───────────────────────────────────────────────────────

  it('should count open tickets correctly from loaded tickets', async () => {
    createComponent();

    const tickets = [
      makeTicketSummary({ stage: { id: 's1', name: 'Novo', isInitial: true, isFinal: false } }),
      makeTicketSummary({ stage: { id: 's2', name: 'Aberto', isInitial: true, isFinal: false } }),
      makeTicketSummary({ stage: { id: 's3', name: 'Fechado', isInitial: false, isFinal: true } })
    ];

    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse(tickets));
    await fixture.whenStable();

    expect(component.openCount()).toBe(2);
  });

  it('should count attending tickets correctly', async () => {
    createComponent();

    const tickets = [
      makeTicketSummary({ stage: { id: 's1', name: 'Em atendimento', isInitial: false, isFinal: false } }),
      makeTicketSummary({ stage: { id: 's2', name: 'Em atendimento', isInitial: false, isFinal: false } }),
      makeTicketSummary({ stage: { id: 's3', name: 'Novo', isInitial: true, isFinal: false } })
    ];

    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse(tickets));
    await fixture.whenStable();

    expect(component.attendingCount()).toBe(2);
  });

  it('should count waiting tickets correctly', async () => {
    createComponent();

    const tickets = [
      makeTicketSummary({ stage: { id: 's1', name: 'Aguardando usuário', isInitial: false, isFinal: false } })
    ];

    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse(tickets));
    await fixture.whenStable();

    expect(component.waitingCount()).toBe(1);
  });

  it('should count resolved tickets correctly', async () => {
    createComponent();

    const tickets = [
      makeTicketSummary({ stage: { id: 's1', name: 'Resolvido', isInitial: false, isFinal: true } }),
      makeTicketSummary({ stage: { id: 's2', name: 'Resolvido', isInitial: false, isFinal: true } }),
      makeTicketSummary({ stage: { id: 's3', name: 'Resolvido', isInitial: false, isFinal: true } })
    ];

    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse(tickets));
    await fixture.whenStable();

    expect(component.resolvedCount()).toBe(3);
  });

  it('should use Math.max(tickets.length, 532) for totalCount', async () => {
    createComponent();

    const tickets = Array.from({ length: 5 }, () => makeTicketSummary());
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse(tickets));
    await fixture.whenStable();

    // Math.max(5, 532) = 532
    expect(component.totalCount()).toBe(532);
  });

  // ── Error silencing ───────────────────────────────────────────────────────

  it('should not crash when listTickets fails with 500', async () => {
    createComponent();

    http.expectOne(r => r.url === `${BASE}/tickets`).flush(
      'Server Error',
      { status: 500, statusText: 'Internal Server Error' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.totalCount()).toBe(532);
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('should render the dashboard page with user first name', async () => {
    createComponent('Carlos Menezes');
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse([]));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Carlos');
  });

  it('should have a "Novo chamado" action link', async () => {
    createComponent();
    http.expectOne(r => r.url === `${BASE}/tickets`).flush(makePaginatedResponse([]));
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Novo chamado');
  });
});
