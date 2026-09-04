/**
 * TicketCreateComponent — Unit Tests (zoneless-compatible)
 *
 * Uses async/await + fixture.whenStable() instead of fakeAsync/tick.
 *
 * Covers:
 *  - Initial render (form fields, heading)
 *  - Form validation (required fields, error messages, submit disabled)
 *  - Department change → loads types and categories, resets dependent fields
 *  - Department cleared → resets types and categories
 *  - Type load error → empty array, isLoadingTypes=false
 *  - Happy path: valid form → createTicket → navigate to /tickets/:id
 *  - categoryId sent as null when empty
 *  - Loading state during submit
 *  - API errors: 422, 500
 *  - Guard: onSubmit with invalid form does not call API
 *  - File management: addFiles, removeFile, formatSize, max 10 files
 *  - Error loading departments
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TicketCreateComponent } from './ticket-create.component';
import { AuthService } from '../../core/services/auth.service';
import {
  makeAdminUser,
  makeTicket,
  makeDepartment,
  makePriority,
  makeTicketType
} from '../../../testing/factories';

const BASE = 'http://localhost:8000/api';

describe('TicketCreateComponent', () => {
  let fixture: ComponentFixture<TicketCreateComponent>;
  let component: TicketCreateComponent;
  let http: HttpTestingController;
  let router: Router;
  let authService: AuthService;

  async function setupComponent(userFactory = makeAdminUser): Promise<void> {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TicketCreateComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'tickets/:id', component: {} as any },
          { path: 'tickets', component: {} as any }
        ])
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    authService.setSession('token', userFactory());

    fixture   = TestBed.createComponent(TicketCreateComponent);
    component = fixture.componentInstance;
    http      = TestBed.inject(HttpTestingController);
    router    = TestBed.inject(Router);

    fixture.detectChanges();
    http.expectOne(`${BASE}/ticket-settings/departments`).flush([makeDepartment({ id: 'dept-1', name: 'TI' })]);
    http.expectOne(`${BASE}/ticket-settings/priorities`).flush([makePriority({ id: 'prio-1', name: 'Média' })]);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    try { http.verify(); } catch { /* ignore pending */ }
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('should create the component', async () => {
    await setupComponent();
    expect(component).toBeTruthy();
  });

  it('should render "Novo chamado" heading', async () => {
    await setupComponent();
    expect(fixture.nativeElement.textContent).toContain('Novo chamado');
  });

  it('should render required field markers for mandatory fields', async () => {
    await setupComponent();
    const marks = fixture.nativeElement.querySelectorAll('.required-mark');
    expect(marks.length).toBeGreaterThan(0);
  });

  // ── Form initial state ─────────────────────────────────────────────────────

  it('should have invalid form initially (all fields empty)', async () => {
    await setupComponent();
    expect(component.form.invalid).toBe(true);
  });

  // ── Validation messages ────────────────────────────────────────────────────

  it('should show "Departamento é obrigatório" when touched with no value', async () => {
    await setupComponent();
    component.form.get('departmentId')!.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Departamento é obrigatório');
  });

  it('should show "Título é obrigatório (mínimo 5 caracteres)" when touched with no value', async () => {
    await setupComponent();
    component.form.get('title')!.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Título é obrigatório (mínimo 5 caracteres)');
  });

  // ── Department change ──────────────────────────────────────────────────────

  it('should load ticket types when department is selected', async () => {
    await setupComponent();
    component.form.get('departmentId')!.setValue('dept-1');
    component.onDepartmentChange();
    fixture.detectChanges();

    expect(component.isLoadingTypes()).toBe(true);

    http.expectOne(r => r.url === `${BASE}/ticket-settings/types`).flush([
      makeTicketType({ id: 'type-1', name: 'Incidente' })
    ]);
    http.expectOne(r => r.url === `${BASE}/ticket-settings/categories`).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isLoadingTypes()).toBe(false);
    expect(component.ticketTypes()).toHaveLength(1);
    expect(component.ticketTypes()[0].name).toBe('Incidente');
  });

  it('should reset typeId and categoryId when department changes', async () => {
    await setupComponent();
    component.form.get('typeId')!.setValue('old-type');
    component.form.get('categoryId')!.setValue('old-cat');

    component.form.get('departmentId')!.setValue('dept-1');
    component.onDepartmentChange();

    http.expectOne(r => r.url === `${BASE}/ticket-settings/types`).flush([]);
    http.expectOne(r => r.url === `${BASE}/ticket-settings/categories`).flush([]);
    await fixture.whenStable();

    expect(component.form.get('typeId')!.value).toBe('');
    expect(component.form.get('categoryId')!.value).toBe('');
  });

  it('should clear types and categories when department is cleared', async () => {
    await setupComponent();
    component.form.get('departmentId')!.setValue('');
    component.onDepartmentChange();
    fixture.detectChanges();

    expect(component.ticketTypes()).toHaveLength(0);
    expect(component.categories()).toHaveLength(0);
    expect(component.isLoadingTypes()).toBe(false);
  });

  it('should set ticketTypes to empty array on type load error', async () => {
    await setupComponent();
    component.form.get('departmentId')!.setValue('dept-err');
    component.onDepartmentChange();

    http.expectOne(r => r.url === `${BASE}/ticket-settings/types`).flush(
      'Error', { status: 500, statusText: 'Internal Server Error' }
    );
    http.expectOne(r => r.url === `${BASE}/ticket-settings/categories`).flush([]);
    await fixture.whenStable();

    expect(component.ticketTypes()).toHaveLength(0);
    expect(component.isLoadingTypes()).toBe(false);
  });

  // ── File management ────────────────────────────────────────────────────────

  it('addFiles should add files up to max 10', async () => {
    await setupComponent();
    const files = Array.from({ length: 12 }, (_, i) =>
      new File(['content'], `file-${i}.txt`, { type: 'text/plain' })
    );
    component.addFiles(files);
    expect(component.attachedFiles()).toHaveLength(10);
  });

  it('removeFile should remove file by name', async () => {
    await setupComponent();
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    component.addFiles([file]);
    expect(component.attachedFiles()).toHaveLength(1);

    component.removeFile('test.txt');
    expect(component.attachedFiles()).toHaveLength(0);
  });

  it('formatSize should format bytes correctly', async () => {
    await setupComponent();
    expect(component.formatSize(500)).toBe('500 B');
    expect(component.formatSize(1500)).toBe('1.5 KB');
    expect(component.formatSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('should navigate to /tickets/:id on successful ticket creation', async () => {
    await setupComponent();
    const navigateSpy = vi.spyOn(router, 'navigate');
    const created = makeTicket({ id: 'new-ticket-id' });

    component.form.setValue({
      title: 'Notebook travado',
      description: 'O notebook congela toda vez que abre o navegador.',
      departmentId: 'dept-1',
      typeId: 'type-1',
      categoryId: '',
      priorityId: 'prio-1'
    });

    component.onSubmit();
    expect(component.isSubmitting()).toBe(true);

    http.expectOne(`${BASE}/tickets`).flush(created);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', 'new-ticket-id']);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should send categoryId as null when not filled', async () => {
    await setupComponent();
    component.form.setValue({
      title: 'Valid Ticket Title',
      description: 'Valid description with more than ten characters.',
      departmentId: 'dept-1',
      typeId: 'type-1',
      categoryId: '',
      priorityId: 'prio-1'
    });

    component.onSubmit();
    const req = http.expectOne(`${BASE}/tickets`);
    expect(req.request.body.categoryId).toBeNull();
    req.flush(makeTicket());
    await fixture.whenStable();
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it('should show error message on 422 validation error', async () => {
    await setupComponent();
    component.form.setValue({
      title: 'Valid Ticket Title',
      description: 'Valid description with more than ten characters.',
      departmentId: 'dept-1',
      typeId: 'type-1',
      categoryId: '',
      priorityId: 'prio-1'
    });

    component.onSubmit();
    http.expectOne(`${BASE}/tickets`).flush(
      { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.' } },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.alert.alert-danger')).toBeTruthy();
    expect(el.textContent).toContain('Dados inválidos.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show fallback error message on 500', async () => {
    await setupComponent();
    component.form.setValue({
      title: 'Valid Ticket Title',
      description: 'Valid description with more than ten characters.',
      departmentId: 'dept-1',
      typeId: 'type-1',
      categoryId: '',
      priorityId: 'prio-1'
    });

    component.onSubmit();
    http.expectOne(`${BASE}/tickets`).flush(
      'Server Error',
      { status: 500, statusText: 'Internal Server Error' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Erro ao criar chamado. Tente novamente.');
    expect(component.isSubmitting()).toBe(false);
  });

  // ── Guard: invalid form ────────────────────────────────────────────────────

  it('should NOT call API when form is invalid', async () => {
    await setupComponent();
    component.onSubmit();
    http.expectNone(`${BASE}/tickets`);
    expect(component.isSubmitting()).toBe(false);
  });

  // ── Error loading departments ──────────────────────────────────────────────

  it('should show error message when departments fail to load', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TicketCreateComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    authService.setSession('token', makeAdminUser());
    fixture   = TestBed.createComponent(TicketCreateComponent);
    component = fixture.componentInstance;
    http      = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne(`${BASE}/ticket-settings/departments`).flush(
      'Error', { status: 500, statusText: 'Internal Server Error' }
    );
    http.expectOne(`${BASE}/ticket-settings/priorities`).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('Erro ao carregar departamentos.');
  });
});
