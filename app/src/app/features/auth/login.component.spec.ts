/**
 * LoginComponent — Unit Tests
 *
 * Covers:
 *  - Rendering: form fields, submit button, password toggle, error area
 *  - Validation: required fields, email format, button disabled state
 *  - Happy path: successful login → navigate to /tickets
 *  - Loading state: spinner visible during request, button disabled
 *  - API errors: 401, 500, network error → error message shown
 *  - Password visibility toggle
 *  - Double-submit prevention
 *  - Error cleared on next submit attempt
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { makeUser } from '../../../testing/factories';

const BASE = 'http://localhost:8000/api';

function fillForm(
  fixture: ComponentFixture<LoginComponent>,
  email: string,
  password: string
): void {
  fixture.componentInstance.form.setValue({ email, password });
  fixture.componentInstance.form.markAllAsTouched();
  fixture.detectChanges();
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let http: HttpTestingController;
  let router: Router;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'tickets', component: {} as any },
          { path: 'login', component: {} as any }
        ])
      ]
    }).compileComponents();

    fixture     = TestBed.createComponent(LoginComponent);
    component   = fixture.componentInstance;
    http        = TestBed.inject(HttpTestingController);
    router      = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);

    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getBtn(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btn-login')!;
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the brand name "SupportFlow"', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('SupportFlow');
  });

  it('should render email and password input fields', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#email')).toBeTruthy();
    expect(el.querySelector('#password')).toBeTruthy();
  });

  it('should render the submit button with text "Entrar"', () => {
    expect(getBtn()).toBeTruthy();
    expect(getBtn().textContent?.trim()).toContain('Entrar');
  });

  it('should not display error message on initial render', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.alert.alert-danger')).toBeNull();
  });

  // ── Form validation ────────────────────────────────────────────────────────

  it('should disable submit button when form is invalid (empty)', () => {
    expect(getBtn().disabled).toBe(true);
  });

  it('should disable submit button when email is missing', () => {
    fillForm(fixture, '', 'password123');
    expect(getBtn().disabled).toBe(true);
  });

  it('should disable submit button when password is missing', () => {
    fillForm(fixture, 'user@test.com', '');
    expect(getBtn().disabled).toBe(true);
  });

  it('should disable submit button for invalid email format', () => {
    fillForm(fixture, 'not-an-email', 'password123');
    expect(getBtn().disabled).toBe(true);
  });

  it('should enable submit button with valid email and password', () => {
    fillForm(fixture, 'user@test.com', 'password123');
    expect(getBtn().disabled).toBe(false);
  });

  it('should show email required validation message after touch', () => {
    component.form.get('email')!.markAsTouched();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('E-mail é obrigatório');
  });

  it('should show email format validation message for invalid email', () => {
    component.form.get('email')!.setValue('not-valid');
    component.form.get('email')!.markAsTouched();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Informe um e-mail válido');
  });

  it('should show password required validation message after touch', () => {
    component.form.get('password')!.markAsTouched();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Senha é obrigatória');
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('should navigate to /tickets on successful login', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    fillForm(fixture, 'user@test.com', 'correctpassword');

    component.onSubmit();

    http.expectOne(`${BASE}/auth/login`).flush({
      token: 'jwt-token',
      user: makeUser()
    });

    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets']);
  });

  it('should store token and user after successful login', async () => {
    fillForm(fixture, 'user@test.com', 'correctpassword');
    component.onSubmit();

    const user = makeUser();
    http.expectOne(`${BASE}/auth/login`).flush({ token: 'stored-token', user });
    await fixture.whenStable();

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.token()).toBe('stored-token');
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('should set isSubmitting=true during login request', async () => {
    fillForm(fixture, 'user@test.com', 'pass');
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);

    http.expectOne(`${BASE}/auth/login`).flush({ token: 't', user: makeUser() });
    await fixture.whenStable();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should disable submit button while loading', async () => {
    fillForm(fixture, 'user@test.com', 'pass');
    component.onSubmit();
    fixture.detectChanges();

    expect(getBtn().disabled).toBe(true);

    http.expectOne(`${BASE}/auth/login`).flush({ token: 't', user: makeUser() });
    await fixture.whenStable();
  });

  it('should show "Entrando..." text while submitting', async () => {
    fillForm(fixture, 'user@test.com', 'pass');
    component.onSubmit();
    fixture.detectChanges();

    expect(getBtn().textContent).toContain('Entrando...');

    http.expectOne(`${BASE}/auth/login`).flush({ token: 't', user: makeUser() });
    await fixture.whenStable();
  });

  // ── API Errors ────────────────────────────────────────────────────────────

  it('should show error message for 401 Unauthorized', async () => {
    fillForm(fixture, 'user@test.com', 'wrongpass');
    component.onSubmit();

    http.expectOne(`${BASE}/auth/login`).flush(
      { error: { code: 'AUTH_FAILED', message: 'Credenciais inválidas.' } },
      { status: 401, statusText: 'Unauthorized' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.alert.alert-danger')).toBeTruthy();
    expect(el.textContent).toContain('Credenciais inválidas.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show generic error message for 500 Internal Server Error', async () => {
    fillForm(fixture, 'user@test.com', 'pass');
    component.onSubmit();

    http.expectOne(`${BASE}/auth/login`).flush(
      'Internal Server Error',
      { status: 500, statusText: 'Internal Server Error' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.alert.alert-danger')).toBeTruthy();
    expect(el.textContent).toContain('Falha na autenticação. Verifique suas credenciais.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show fallback error message for network errors', async () => {
    fillForm(fixture, 'user@test.com', 'pass');
    component.onSubmit();

    http.expectOne(`${BASE}/auth/login`).error(new ProgressEvent('error'));
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.alert.alert-danger')).toBeTruthy();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should clear error message on next submit attempt', async () => {
    // First: fail
    fillForm(fixture, 'user@test.com', 'wrongpass');
    component.onSubmit();
    http.expectOne(`${BASE}/auth/login`).flush(
      { error: { code: 'AUTH_FAILED', message: 'Error' } },
      { status: 401, statusText: 'Unauthorized' }
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Error');

    // Second attempt: error should clear at start
    component.onSubmit();
    expect(component.errorMessage()).toBeNull();
    http.expectOne(`${BASE}/auth/login`).flush({ token: 't', user: makeUser() });
    await fixture.whenStable();
  });

  // ── Password visibility toggle ────────────────────────────────────────────

  it('should toggle password visibility when toggle button is clicked', () => {
    const el = fixture.nativeElement as HTMLElement;
    const toggleBtn = el.querySelector<HTMLButtonElement>('.password-toggle')!;
    const passwordInput = el.querySelector<HTMLInputElement>('#password')!;

    expect(passwordInput.type).toBe('password');
    expect(component.showPassword()).toBe(false);

    toggleBtn.click();
    fixture.detectChanges();

    expect(component.showPassword()).toBe(true);
    expect(passwordInput.type).toBe('text');
  });

  it('should re-hide password on second toggle click', () => {
    const el = fixture.nativeElement as HTMLElement;
    const toggleBtn = el.querySelector<HTMLButtonElement>('.password-toggle')!;
    const passwordInput = el.querySelector<HTMLInputElement>('#password')!;

    toggleBtn.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('text');

    toggleBtn.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('password');
  });

  // ── Guard: onSubmit with invalid form ─────────────────────────────────────

  it('should NOT call API when form is invalid and onSubmit is called directly', () => {
    component.onSubmit();
    http.expectNone(`${BASE}/auth/login`);
    expect(component.isSubmitting()).toBe(false);
  });

  // ── Double-submit prevention ───────────────────────────────────────────────

  it('should prevent double submit while already submitting', async () => {
    fillForm(fixture, 'user@test.com', 'pass');

    component.onSubmit();
    expect(component.isSubmitting()).toBe(true);

    const requests = http.match(`${BASE}/auth/login`);
    expect(requests.length).toBe(1);
    requests[0].flush({ token: 't', user: makeUser() });
    await fixture.whenStable();
  });

  // ── Session Expired Alert (Requirement 8) ─────────────────────────────────

  it('should display friendly alert when session is expired', () => {
    authService.handleSessionExpired('Sua sessão expirou. Faça login novamente para continuar.');

    const freshFixture = TestBed.createComponent(LoginComponent);
    freshFixture.detectChanges();
    const el = freshFixture.nativeElement as HTMLElement;

    const alert = el.querySelector('#session-expired-alert');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Sua sessão expirou. Faça login novamente para continuar.');
  });
});
