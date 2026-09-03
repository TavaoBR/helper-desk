import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile overlay -->
    @if (mobileOpen()) {
      <div class="sidebar-overlay" (click)="mobileOpen.set(false)"></div>
    }

    <aside class="app-sidebar" [class.mobile-open]="mobileOpen()">

      <!-- Logo / Brand -->
      <div class="sidebar-brand">
        <div class="brand-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L28.7 9V23L16 30L3.3 23V9L16 2Z" fill="#FFC107"/>
            <path d="M11 16.5C11 14.015 13.015 12 15.5 12C17.985 12 20 14.015 20 16.5C20 18.985 17.985 21 15.5 21" stroke="#082B55" stroke-width="2" stroke-linecap="round"/>
            <circle cx="22" cy="12" r="2.5" fill="#082B55"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">SupportFlow</span>
          <span class="brand-desc">Plataforma de Help Desk</span>
        </div>
      </div>

      <nav class="sidebar-nav-wrapper">

        <!-- PRINCIPAL -->
        <div class="nav-section">
          <span class="section-label">PRINCIPAL</span>

          <a routerLink="/dashboard" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
            </svg>
            <span class="nav-label">Dashboard</span>
          </a>

          <div class="nav-group">
            <button class="nav-item nav-group-trigger" (click)="toggleTickets()">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 6H3a1 1 0 00-1 1v9a1 1 0 001 1h14a1 1 0 001-1V7a1 1 0 00-1-1z" stroke="currentColor" stroke-width="1.6"/>
                <path d="M13 6V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1" stroke="currentColor" stroke-width="1.6"/>
                <path d="M7 11h6M7 14h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <span class="nav-label">Meus chamados</span>
              <svg class="nav-chevron" [class.rotated]="ticketsOpen()" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            @if (ticketsOpen()) {
              <div class="nav-sub">
                <a routerLink="/tickets" [queryParams]="{ scope: 'mine' }" routerLinkActive="active-sub"
                   [routerLinkActiveOptions]="{ matrixParams: 'ignored', queryParams: 'exact', paths: 'exact', fragment: 'ignored' }"
                   class="nav-sub-item">
                  Abertos por mim
                </a>
                @if (perm.can('ticket.view_all')) {
                  <a routerLink="/tickets" [queryParams]="{ scope: 'all' }" routerLinkActive="active-sub"
                     [routerLinkActiveOptions]="{ matrixParams: 'ignored', queryParams: 'exact', paths: 'exact', fragment: 'ignored' }"
                     class="nav-sub-item">
                    Todos os chamados
                  </a>
                }
              </div>
            }
          </div>

          @if (perm.can('ticket.view_queue')) {
            <a routerLink="/queues" routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <span class="nav-label">Filas</span>
            </a>
          }

          <a routerLink="/tickets" [queryParams]="{ scope: 'attending' }" routerLinkActive="active"
             [routerLinkActiveOptions]="{ matrixParams: 'ignored', queryParams: 'exact', paths: 'exact', fragment: 'ignored' }"
             class="nav-item">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
              <path d="M10 6v4l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <span class="nav-label">Atendimentos</span>
          </a>
        </div>

        <!-- CONFIGURAÇÕES -->
        @if (perm.can('settings.view')) {
          <div class="nav-section">
            <span class="section-label">CONFIGURAÇÕES</span>

            <a routerLink="/settings" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6h12M4 10h12M4 14h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <span class="nav-label">Cadastros</span>
            </a>

            <a routerLink="/settings/automations" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6l3 3 4-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11 9h6M11 13h6M3 13l2 2 2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="nav-label">Regras de automação</span>
            </a>

            <a routerLink="/settings/sla" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
                <path d="M10 5v5.5l3.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <span class="nav-label">SLA</span>
            </a>

            <a routerLink="/settings/notifications" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="currentColor" stroke-width="1.6"/>
                <path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <span class="nav-label">Notificações</span>
            </a>

            <a routerLink="/settings/reports" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
                <path d="M6 9h8M6 12h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <span class="nav-label">Relatórios</span>
            </a>
          </div>

          <!-- ADMINISTRAÇÃO -->
          <div class="nav-section">
            <span class="section-label">ADMINISTRAÇÃO</span>

            <a routerLink="/settings/users" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="1.6"/>
                <path d="M2 17c0-3.314 2.686-6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M14 12l1.5 1.5L18 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="15" cy="14" r="4" stroke="currentColor" stroke-width="1.6"/>
              </svg>
              <span class="nav-label">Usuários</span>
            </a>

            <a routerLink="/settings/permissions" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" stroke="currentColor" stroke-width="1.6"/>
                <path d="M14 2l4 4-7 7H7v-4l7-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              </svg>
              <span class="nav-label">Permissões</span>
            </a>

            <a routerLink="/settings/general" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.6"/>
                <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span class="nav-label">Configurações</span>
            </a>
          </div>
        }

      </nav>

      <!-- Footer sidebar -->
      <div class="sidebar-footer">
        <button class="sidebar-collapse-btn" (click)="mobileOpen.set(false)">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Recolher menu
        </button>
      </div>

    </aside>
  `,
  styles: [`
    /* ── Overlay mobile ─────────────────────────────────────────── */
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(8, 43, 85, 0.45);
      z-index: 199;
      display: none;
    }
    @media (max-width: 1024px) {
      .sidebar-overlay { display: block; }
    }

    /* ── Sidebar principal ───────────────────────────────────────── */
    .app-sidebar {
      width: 240px;
      min-width: 240px;
      background-color: #082B55;
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
      z-index: 200;
      flex-shrink: 0;
    }

    .app-sidebar::-webkit-scrollbar { width: 4px; }
    .app-sidebar::-webkit-scrollbar-track { background: transparent; }
    .app-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

    /* Mobile: sidebar fora da tela até .mobile-open */
    @media (max-width: 1024px) {
      .app-sidebar {
        position: fixed;
        left: -260px;
        top: 0;
        transition: left 0.25s ease;
      }
      .app-sidebar.mobile-open {
        left: 0;
      }
    }

    /* ── Brand / Logo ──────────────────────────────────────────── */
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .brand-logo {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .brand-name {
      font-size: 15px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .brand-desc {
      font-size: 10px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.45);
      letter-spacing: 0.02em;
      line-height: 1;
    }

    /* ── Nav wrapper ─────────────────────────────────────────────── */
    .sidebar-nav-wrapper {
      flex: 1;
      padding: 12px 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* ── Seções ──────────────────────────────────────────────────── */
    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 1px;
      margin-bottom: 20px;
    }

    .section-label {
      font-size: 10px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 0 10px;
      margin-bottom: 4px;
      margin-top: 2px;
    }

    /* ── Nav items ───────────────────────────────────────────────── */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.72);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.12s ease;
      text-decoration: none;
      border: none;
      background: none;
      font-family: inherit;
      width: 100%;
      text-align: left;
    }

    .nav-item:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.95);
    }

    .nav-item.active {
      background-color: #FFC107;
      color: #082B55;
      font-weight: 600;
    }

    .nav-item.active .nav-icon {
      color: #082B55;
    }

    /* ── Nav icon ────────────────────────────────────────────────── */
    .nav-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: inherit;
    }

    .nav-label {
      flex: 1;
      line-height: 1;
    }

    /* ── Chevron (sub-menu trigger) ──────────────────────────────── */
    .nav-chevron {
      width: 14px;
      height: 14px;
      transition: transform 0.15s ease;
      color: inherit;
      opacity: 0.6;
    }

    .nav-chevron.rotated {
      transform: rotate(180deg);
    }

    .nav-group-trigger {
      cursor: pointer;
    }

    /* ── Sub-itens ───────────────────────────────────────────────── */
    .nav-sub {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding-left: 36px;
      margin-top: 1px;
    }

    .nav-sub-item {
      display: flex;
      align-items: center;
      padding: 7px 10px;
      border-radius: 5px;
      color: rgba(255, 255, 255, 0.55);
      font-size: 12.5px;
      font-weight: 400;
      cursor: pointer;
      transition: all 0.12s ease;
      text-decoration: none;
    }

    .nav-sub-item:hover {
      background-color: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.88);
    }

    .nav-sub-item.active-sub {
      color: #FFC107;
      font-weight: 600;
      background-color: rgba(255, 193, 7, 0.12);
    }

    /* ── Footer sidebar ──────────────────────────────────────────── */
    .sidebar-footer {
      padding: 10px 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .sidebar-collapse-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.12s ease;
      background: none;
      border: none;
      font-family: inherit;
      width: 100%;
      text-align: left;
    }

    .sidebar-collapse-btn:hover {
      background-color: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.65);
    }
  `]
})
export class SidebarComponent {
  readonly perm = inject(PermissionService);
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);
  readonly ticketsOpen = signal(false);

  constructor() {
    this.checkTicketsOpen(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e) => {
      this.checkTicketsOpen((e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url);
    });
  }

  toggleTickets(): void {
    this.ticketsOpen.update(v => !v);
  }

  private checkTicketsOpen(url: string): void {
    if (url.includes('scope=mine') || url.includes('scope=all')) {
      this.ticketsOpen.set(true);
    }
  }
}
