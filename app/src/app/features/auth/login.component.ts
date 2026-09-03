import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">

      <!-- ═══ Lado esquerdo (institucional) ═══════════════════════════════ -->
      <div class="login-left">
        <div class="login-left-inner">

          <!-- Logo -->
          <div class="login-brand">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28.7 9V23L16 30L3.3 23V9L16 2Z" fill="#FFC107"/>
              <path d="M11 16.5C11 14.015 13.015 12 15.5 12C17.985 12 20 14.015 20 16.5C20 18.985 17.985 21 15.5 21" stroke="#082B55" stroke-width="2" stroke-linecap="round"/>
              <circle cx="22" cy="12" r="2.5" fill="#082B55"/>
            </svg>
            <div class="login-brand-text">
              <span class="login-brand-name">SupportFlow</span>
              <span class="login-brand-tag">Plataforma de Help Desk</span>
            </div>
          </div>

          <!-- Tagline -->
          <div class="login-pitch">
            <h1>Gerencie chamados de forma inteligente, rápida e eficiente.</h1>
            <p>Centralize o suporte da sua empresa em uma única plataforma corporativa.</p>
          </div>

          <!-- Ilustração SVG -->
          <div class="login-illustration" aria-hidden="true">
            <svg viewBox="0 0 340 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Tela principal / dashboard -->
              <rect x="40" y="20" width="200" height="140" rx="10" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
              <rect x="40" y="20" width="200" height="28" rx="10" fill="rgba(255,255,255,0.1)"/>
              <rect x="48" y="30" width="60" height="8" rx="4" fill="rgba(255,255,255,0.5)"/>
              <circle cx="224" cy="34" r="5" fill="rgba(255,193,7,0.6)"/>
              <circle cx="212" cy="34" r="5" fill="rgba(255,255,255,0.2)"/>
              <!-- Cards indicadores -->
              <rect x="52" y="60" width="44" height="32" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)"/>
              <rect x="57" y="66" width="20" height="5" rx="2.5" fill="rgba(255,255,255,0.3)"/>
              <rect x="57" y="74" width="30" height="10" rx="3" fill="#FFC107" opacity="0.8"/>
              <rect x="102" y="60" width="44" height="32" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)"/>
              <rect x="107" y="66" width="24" height="5" rx="2.5" fill="rgba(255,255,255,0.3)"/>
              <rect x="107" y="74" width="20" height="10" rx="3" fill="rgba(47,128,237,0.8)"/>
              <rect x="152" y="60" width="44" height="32" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)"/>
              <rect x="157" y="66" width="16" height="5" rx="2.5" fill="rgba(255,255,255,0.3)"/>
              <rect x="157" y="74" width="24" height="10" rx="3" fill="rgba(22,163,74,0.7)"/>
              <!-- Gráfico de linha -->
              <rect x="52" y="100" width="144" height="50" rx="5" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
              <polyline points="62,138 77,125 92,132 107,118 122,122 137,110 152,114 167,105 182,115" stroke="#2F80ED" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="62,138 77,125 92,132 107,118 122,122 137,110 152,114 167,105 182,115" stroke="rgba(47,128,237,0.1)" stroke-width="0" fill="url(#grad1)"/>
              <!-- Donut chart mini -->
              <circle cx="290" cy="80" r="35" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
              <circle cx="290" cy="80" r="22" fill="none" stroke="#FFC107" stroke-width="8" stroke-dasharray="55 84" stroke-dashoffset="21" opacity="0.8"/>
              <circle cx="290" cy="80" r="22" fill="none" stroke="#2F80ED" stroke-width="8" stroke-dasharray="30 109" stroke-dashoffset="-34" opacity="0.7"/>
              <circle cx="290" cy="80" r="22" fill="none" stroke="#16A34A" stroke-width="8" stroke-dasharray="20 119" stroke-dashoffset="-64" opacity="0.6"/>
              <circle cx="290" cy="80" r="10" fill="#082B55"/>
              <!-- Ticket list -->
              <rect x="240" y="130" width="84" height="10" rx="3" fill="rgba(255,255,255,0.08)"/>
              <circle cx="248" cy="135" r="3" fill="#FFC107" opacity="0.7"/>
              <rect x="255" y="133" width="44" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>
              <rect x="240" y="147" width="84" height="10" rx="3" fill="rgba(255,255,255,0.05)"/>
              <circle cx="248" cy="152" r="3" fill="#2F80ED" opacity="0.7"/>
              <rect x="255" y="150" width="36" height="4" rx="2" fill="rgba(255,255,255,0.18)"/>
              <rect x="240" y="164" width="84" height="10" rx="3" fill="rgba(255,255,255,0.05)"/>
              <circle cx="248" cy="169" r="3" fill="#16A34A" opacity="0.7"/>
              <rect x="255" y="167" width="50" height="4" rx="2" fill="rgba(255,255,255,0.18)"/>
              <!-- Agente / headset -->
              <circle cx="290" cy="185" r="14" fill="rgba(255,193,7,0.12)" stroke="#FFC107" stroke-width="1.5" opacity="0.8"/>
              <path d="M285 183a5 5 0 0110 0" stroke="#FFC107" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="284" cy="185" r="2" fill="#FFC107" opacity="0.7"/>
              <circle cx="296" cy="185" r="2" fill="#FFC107" opacity="0.7"/>
              <path d="M290 189v3" stroke="#FFC107" stroke-width="1.5" stroke-linecap="round"/>
              <!-- Defs -->
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2F80ED" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#2F80ED" stop-opacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <!-- Stats highlight -->
          <div class="login-stats">
            <div class="login-stat">
              <span class="login-stat-value">99.9%</span>
              <span class="login-stat-label">Uptime</span>
            </div>
            <div class="login-stat-divider"></div>
            <div class="login-stat">
              <span class="login-stat-value">2.4s</span>
              <span class="login-stat-label">Resposta média</span>
            </div>
            <div class="login-stat-divider"></div>
            <div class="login-stat">
              <span class="login-stat-value">4.8★</span>
              <span class="login-stat-label">Satisfação</span>
            </div>
          </div>
        </div>

        <!-- Footer esq -->
        <div class="login-left-footer">
          © 2025 SupportFlow. Todos os direitos reservados.
        </div>
      </div>

      <!-- ═══ Lado direito (formulário) ════════════════════════════════════ -->
      <div class="login-right">
        <div class="login-form-wrap">

          <!-- Cabeçalho do form -->
          <div class="form-header">
            <h2>Bem-vindo de volta! 👋</h2>
            <p>Acesse sua conta para continuar.</p>
          </div>

          <!-- Alerta de erro -->
          @if (errorMessage()) {
            <div class="alert alert-danger" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 5v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              {{ errorMessage() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- E-mail -->
            <div class="form-group">
              <label class="form-label" for="email">E-mail</label>
              <input
                id="email"
                type="email"
                class="form-input"
                formControlName="email"
                placeholder="seu.email@empresa.com"
                autocomplete="email"
              />
              @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
                <span class="form-error">E-mail é obrigatório</span>
              }
              @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
                <span class="form-error">Informe um e-mail válido</span>
              }
            </div>

            <!-- Senha -->
            <div class="form-group">
              <div class="password-label-row">
                <label class="form-label" for="password">Senha</label>
                <a href="#" class="forgot-link" tabindex="-1">Esqueci minha senha</a>
              </div>
              <div class="password-wrap">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-input password-input"
                  formControlName="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  (click)="showPassword.update(v => !v)"
                  [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
                >
                  @if (showPassword()) {
                    <!-- Olho fechado -->
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 2l12 12M6.88 6.93A2 2 0 0010.07 10.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      <path d="M4.4 4.4A7.5 7.5 0 001 8s2.5 5 7 5a7.2 7.2 0 004.6-1.6M6.5 3.1A7 7 0 0115 8s-.7 1.9-2 3.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    </svg>
                  } @else {
                    <!-- Olho aberto -->
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.4"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
                    </svg>
                  }
                </button>
              </div>
              @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
                <span class="form-error">Senha é obrigatória</span>
              }
            </div>

            <!-- Lembrar-me -->
            <div class="remember-row">
              <label class="checkbox-label">
                <input type="checkbox" id="remember-me" class="checkbox-input" />
                <span class="checkbox-text">Lembrar-me</span>
              </label>
            </div>

            <!-- Botão entrar -->
            <button
              type="submit"
              id="btn-login"
              class="btn-login"
              [disabled]="form.invalid || isSubmitting()"
            >
              @if (isSubmitting()) {
                <svg class="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="rgba(8,43,85,0.3)" stroke-width="2"/>
                  <path d="M14 8a6 6 0 00-6-6" stroke="#082B55" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Entrando...
              } @else {
                Entrar
              }
            </button>

            <!-- Divider -->
            <div class="divider">
              <span>ou entre com</span>
            </div>

            <!-- Google -->
            <button type="button" id="btn-google" class="btn-google">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </button>

          </form>

          <!-- Rodapé do formulário -->
          <p class="form-footer-note">
            Ainda não possui uma conta?
            <a href="#">Fale com o administrador</a>.
          </p>

        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Página de login ─────────────────────────────────── */
    .login-page {
      display: flex;
      min-height: 100vh;
    }

    /* ══ Esquerda ══════════════════════════════════════════ */
    .login-left {
      width: 45%;
      min-width: 380px;
      background-color: #082B55;
      display: flex;
      flex-direction: column;
      padding: 0;
      position: relative;
      overflow: hidden;
    }

    .login-left-inner {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 40px 48px;
      gap: 32px;
    }

    /* Fundo decorativo */
    .login-left::before {
      content: '';
      position: absolute;
      top: -120px;
      right: -80px;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(25,118,210,0.18) 0%, transparent 70%);
      pointer-events: none;
    }

    .login-left::after {
      content: '';
      position: absolute;
      bottom: -100px;
      left: -60px;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,193,7,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    /* Brand */
    .login-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      position: relative;
      z-index: 1;
    }

    .login-brand-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .login-brand-name {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }

    .login-brand-tag {
      font-size: 12px;
      color: rgba(255,255,255,0.45);
      font-weight: 400;
    }

    /* Pitch */
    .login-pitch {
      position: relative;
      z-index: 1;
    }

    .login-pitch h1 {
      font-size: 26px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.3;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }

    .login-pitch p {
      font-size: 14px;
      color: rgba(255,255,255,0.55);
      line-height: 1.6;
    }

    /* Ilustração */
    .login-illustration {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .login-illustration svg {
      width: 100%;
      height: auto;
      max-height: 220px;
    }

    /* Stats */
    .login-stats {
      display: flex;
      align-items: center;
      gap: 24px;
      position: relative;
      z-index: 1;
      padding: 20px 24px;
      background: rgba(255,255,255,0.06);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .login-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      text-align: center;
    }

    .login-stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #FFC107;
      letter-spacing: -0.02em;
    }

    .login-stat-label {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      font-weight: 400;
    }

    .login-stat-divider {
      width: 1px;
      height: 36px;
      background: rgba(255,255,255,0.1);
      flex-shrink: 0;
    }

    .login-left-footer {
      padding: 16px 48px;
      font-size: 11px;
      color: rgba(255,255,255,0.25);
      border-top: 1px solid rgba(255,255,255,0.06);
      position: relative;
      z-index: 1;
    }

    /* ══ Direita ═══════════════════════════════════════════ */
    .login-right {
      flex: 1;
      background-color: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
    }

    .login-form-wrap {
      width: 100%;
      max-width: 420px;
      background-color: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 36px 36px 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    }

    .form-header {
      margin-bottom: 28px;
    }

    .form-header h2 {
      font-size: 22px;
      font-weight: 700;
      color: #14213D;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }

    .form-header p {
      font-size: 14px;
      color: #667085;
      margin: 0;
    }

    /* Password field */
    .password-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .forgot-link {
      font-size: 12px;
      color: #1976D2;
      font-weight: 500;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .password-wrap {
      position: relative;
    }

    .password-input {
      padding-right: 42px;
    }

    .password-toggle {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: #9CA3AF;
      cursor: pointer;
      border-radius: 4px;
      transition: color 0.12s ease;
    }

    .password-toggle:hover {
      color: #667085;
    }

    /* Lembrar-me */
    .remember-row {
      margin-bottom: 20px;
    }

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .checkbox-input {
      width: 15px;
      height: 15px;
      accent-color: #FFC107;
      cursor: pointer;
    }

    .checkbox-text {
      font-size: 13px;
      color: #667085;
      font-weight: 400;
    }

    /* Botão Entrar */
    .btn-login {
      width: 100%;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background-color: #FFC107;
      color: #082B55;
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.12s ease;
      letter-spacing: 0.01em;
    }

    .btn-login:hover:not(:disabled) {
      background-color: #FFBF00;
    }

    .btn-login:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Spinner */
    .spinner {
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Divider */
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 20px 0;
      color: #9CA3AF;
      font-size: 12px;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: #E5E7EB;
    }

    /* Botão Google */
    .btn-google {
      width: 100%;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background-color: #FFFFFF;
      color: #14213D;
      font-family: inherit;
      font-size: 13.5px;
      font-weight: 600;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.12s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .btn-google:hover {
      background-color: #F8FAFC;
      border-color: #D1D5DB;
    }

    /* Rodapé */
    .form-footer-note {
      margin-top: 22px;
      text-align: center;
      font-size: 12.5px;
      color: #9CA3AF;
    }

    .form-footer-note a {
      color: #1976D2;
      font-weight: 500;
    }

    /* ── Responsivo ────────────────────────────────────────── */
    @media (max-width: 900px) {
      .login-left {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .login-form-wrap {
        padding: 28px 20px 24px;
        border-radius: 8px;
      }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const credentials = this.form.getRawValue() as { email: string; password: string };

    this.auth.login(credentials).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/tickets']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.error?.message || 'Falha na autenticação. Verifique suas credenciais.';
        this.errorMessage.set(msg);
      }
    });
  }
}
