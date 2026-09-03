import { Component, inject, signal, ElementRef, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <header class="app-header">

      <!-- ── Esquerda: Brand (visível em mobile) + Busca ────────── -->
      <div class="header-left">
        <div class="header-brand-mobile">
          <button class="mobile-menu-btn" aria-label="Abrir Menu">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="brand-logo-sm">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28.7 9V23L16 30L3.3 23V9L16 2Z" fill="#FFC107"/>
              <path d="M11 16.5C11 14.015 13.015 12 15.5 12C17.985 12 20 14.015 20 16.5C20 18.985 17.985 21 15.5 21" stroke="#082B55" stroke-width="2" stroke-linecap="round"/>
              <circle cx="22" cy="12" r="2.5" fill="#082B55"/>
            </svg>
          </div>
          <span class="brand-label-sm">SupportFlow</span>
        </div>

        <!-- Campo de busca global -->
        <div class="header-search">
          <div class="search-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              id="global-search"
              type="text"
              class="search-input"
              placeholder="Buscar chamados, usuários, configurações..."
              aria-label="Busca global"
            />
            <div class="search-shortcut">
              <span>Ctrl</span><span>K</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Direita: Ações e perfil ───────────────────────────── -->
      <div class="header-actions">

        <!-- Notificações Dropdown -->
        <div class="notif-dropdown-container">
          <button
            class="header-icon-btn"
            aria-label="Notificações"
            title="Notificações"
            (click)="toggleNotifMenu($event)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5a5.5 5.5 0 00-5.5 5.5v2.5L2 11v1h14v-1l-1.5-1.5V7A5.5 5.5 0 009 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M7 13.5a2 2 0 004 0" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            @if (unreadCount() > 0) {
              <span class="notification-dot"></span>
            }
          </button>

          @if (notifMenuOpen()) {
            <div class="notif-dropdown-menu">
              <div class="notif-dropdown-header">
                <span class="notif-title">Notificações</span>
                @if (unreadCount() > 0) {
                  <span class="notif-badge">{{ unreadCount() }} novas</span>
                }
              </div>

              <div class="notif-items-list">
                @for (n of inAppNotifs(); track n.id) {
                  <div
                    class="notif-item"
                    [class.unread]="!n.isRead"
                    (click)="onNotificationClick(n)"
                  >
                    <div class="notif-item-top">
                      <strong class="notif-item-title">{{ n.title }}</strong>
                      <span class="notif-time">{{ n.createdAt | date:'HH:mm' }}</span>
                    </div>
                    <p class="notif-item-msg">{{ n.message }}</p>
                  </div>
                } @empty {
                  <div class="notif-empty">
                    <p>Nenhuma notificação no momento.</p>
                  </div>
                }
              </div>

              <div class="notif-dropdown-footer">
                <a routerLink="/settings/notifications" (click)="closeAllMenus()">
                  Configurar preferências de alerta
                </a>
              </div>
            </div>
          }
        </div>

        <!-- Ajuda / Suporte -->
        <button class="header-icon-btn" aria-label="Ajuda" title="Central de ajuda">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6.5 6.75a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="9" cy="13" r="1" fill="currentColor"/>
          </svg>
        </button>

        <!-- Perfil do usuário (Dropdown) -->
        @if (auth.currentUser(); as user) {
          <div class="user-dropdown-container">
            <button
              class="user-profile-trigger"
              [class.open]="userMenuOpen()"
              (click)="toggleUserMenu($event)"
              aria-label="Menu do usuário"
              id="user-profile-btn"
            >
              <div class="user-avatar">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-role">{{ perm.roleLabel() }}</span>
              </div>
              <svg class="user-chevron" [class.rotated]="userMenuOpen()" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3.5 5.25L7 8.75l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            @if (userMenuOpen()) {
              <div class="user-dropdown-menu">
                <div class="dropdown-header">
                  <div class="dropdown-user-name">{{ user.name }}</div>
                  <div class="dropdown-user-email">{{ user.email }}</div>
                  <span class="badge badge-primary" style="margin-top: 6px; font-size: 11px;">
                    {{ perm.roleLabel() }}
                  </span>
                </div>
                <div class="dropdown-divider"></div>
                <a routerLink="/tickets" class="dropdown-item" (click)="closeUserMenu()">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                    <rect x="8" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                    <rect x="2" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                    <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                  </svg>
                  Meus chamados
                </a>
                @if (perm.can('settings.view')) {
                  <a routerLink="/settings" class="dropdown-item" (click)="closeUserMenu()">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.3"/>
                      <path d="M7.5 1.5v1.5M7.5 12v1.5M1.5 7.5H3M12 7.5h1.5M3.25 3.25l1.06 1.06M10.69 10.69l1.06 1.06M3.25 11.75l1.06-1.06M10.69 4.31l1.06-1.06" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    </svg>
                    Configurações
                  </a>
                }
                <div class="dropdown-divider"></div>
                <button class="dropdown-item logout-item" (click)="logout()">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M5.5 12.5H3a1 1 0 01-1-1v-8a1 1 0 011-1h2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    <path d="M9.5 10.5L12.5 7.5l-3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12.5 7.5H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                  Sair do sistema
                </button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/login" class="btn btn-yellow btn-sm">Entrar</a>
        }
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 60px;
      background-color: #FFFFFF;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      gap: 20px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    /* ── Esquerda: Brand (mobile) + Busca ─────────────── */
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      max-width: 540px;
    }

    .header-brand-mobile {
      display: none;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    @media (max-width: 1024px) {
      .header-brand-mobile { display: flex; }
    }

    .mobile-menu-btn {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      border: 1px solid #E5E7EB;
      background: transparent;
      color: #667085;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .mobile-menu-btn:hover {
      background: #F6F8FB;
      color: #14213D;
    }

    .brand-logo-sm {
      display: flex;
      align-items: center;
    }

    .brand-label-sm {
      font-size: 14px;
      font-weight: 700;
      color: #082B55;
      letter-spacing: -0.01em;
    }

    /* ── Search ───────────────────────────────────────── */
    .header-search {
      width: 100%;
      max-width: 440px;
    }

    .search-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #9CA3AF;
      flex-shrink: 0;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      height: 38px;
      padding: 0 84px 0 36px;
      background-color: #F8FAFC;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      color: #14213D;
      outline: none;
      transition: all 0.15s ease;
    }

    .search-input::placeholder {
      color: #9CA3AF;
    }

    .search-input:focus {
      background-color: #FFFFFF;
      border-color: #1976D2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.08);
    }

    .search-shortcut {
      position: absolute;
      right: 10px;
      display: flex;
      align-items: center;
      gap: 2px;
      pointer-events: none;
    }

    .search-shortcut span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1px 5px;
      background-color: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      color: #9CA3AF;
      line-height: 16px;
    }

    @media (max-width: 768px) {
      .header-search { display: none; }
    }

    /* ── Ações e perfil ───────────────────────────────── */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .header-icon-btn {
      position: relative;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
      color: #667085;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .header-icon-btn:hover {
      background-color: #F8FAFC;
      border-color: #D1D5DB;
      color: #14213D;
    }

    .notification-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #EF4444;
      border: 1.5px solid #FFFFFF;
    }

    /* ── User Dropdown ────────────────────────────────── */
    .user-dropdown-container {
      position: relative;
    }

    .user-profile-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px 4px 5px;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
      cursor: pointer;
      transition: all 0.12s ease;
      font-family: inherit;
    }

    .user-profile-trigger:hover,
    .user-profile-trigger.open {
      background-color: #F8FAFC;
      border-color: #D1D5DB;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #082B55, #1976D2);
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      text-align: left;
      gap: 1px;
      min-width: 0;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: #14213D;
      white-space: nowrap;
      line-height: 1.2;
    }

    .user-role {
      font-size: 11px;
      font-weight: 400;
      color: #667085;
      white-space: nowrap;
      line-height: 1.1;
    }

    .user-chevron {
      color: #9CA3AF;
      flex-shrink: 0;
      transition: transform 0.15s ease;
    }

    .user-chevron.rotated {
      transform: rotate(180deg);
    }

    @media (max-width: 640px) {
      .user-info { display: none; }
      .user-profile-trigger { padding: 4px; }
      .user-chevron { display: none; }
    }

    /* ── Dropdown Menu Popup ──────────────────────────── */
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      width: 220px;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
      padding: 6px;
      z-index: 210;
      animation: dropdownFadeIn 0.12s ease-out;
    }

    @keyframes dropdownFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dropdown-header {
      padding: 10px 10px 8px;
    }

    .dropdown-user-name {
      font-size: 13px;
      font-weight: 600;
      color: #14213D;
    }

    .dropdown-user-email {
      font-size: 11.5px;
      color: #9CA3AF;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 1px;
    }

    .dropdown-divider {
      height: 1px;
      background-color: #E5E7EB;
      margin: 4px 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #14213D;
      text-decoration: none;
      background: transparent;
      border: none;
      cursor: pointer;
      width: 100%;
      text-align: left;
      font-family: inherit;
      transition: background-color 0.1s ease;
    }

    .dropdown-item:hover {
      background-color: #F8FAFC;
      color: #1976D2;
    }

    .dropdown-item svg {
      color: #667085;
      flex-shrink: 0;
    }

    .dropdown-item:hover svg {
      color: #1976D2;
    }

    .logout-item {
      color: #DC2626;
    }

    .logout-item svg {
      color: #DC2626;
    }

    .logout-item:hover {
      background-color: #FEF2F2;
      color: #B91C1C;
    }

    .logout-item:hover svg {
      color: #B91C1C;
    }

    /* ── Notifications Dropdown ──────────────────────────── */
    .notif-dropdown-container {
      position: relative;
    }

    .notif-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 340px;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: notifPop 0.15s ease-out;
    }

    @keyframes notifPop {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .notif-dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #F1F5F9;
    }

    .notif-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #14213D;
    }

    .notif-badge {
      font-size: 10.5px;
      font-weight: 600;
      background: #FEF3C7;
      color: #B45309;
      border: 1px solid #FDE68A;
      padding: 1px 6px;
      border-radius: 99px;
    }

    .notif-items-list {
      max-height: 280px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .notif-item {
      padding: 10px 14px;
      border-bottom: 1px solid #F8FAFC;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .notif-item:hover {
      background: #F8FAFC;
    }

    .notif-item.unread {
      background: #F0FDF4;
      border-left: 3px solid #16A34A;
    }

    .notif-item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .notif-item-title {
      font-size: 12.5px;
      color: #14213D;
    }

    .notif-time {
      font-size: 10.5px;
      color: #94A3B8;
      font-family: var(--font-family-mono);
    }

    .notif-item-msg {
      font-size: 11.5px;
      color: #64748B;
      margin: 3px 0 0;
      line-height: 1.4;
    }

    .notif-empty {
      padding: 24px 16px;
      text-align: center;
      font-size: 12.5px;
      color: #94A3B8;
    }

    .notif-dropdown-footer {
      padding: 10px 14px;
      background: #F8FAFC;
      border-top: 1px solid #F1F5F9;
      text-align: center;
    }

    .notif-dropdown-footer a {
      font-size: 11.5px;
      font-weight: 600;
      color: #1976D2;
      text-decoration: none;
    }

    .notif-dropdown-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class HeaderComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly perm = inject(PermissionService);
  private readonly ticketService = inject(TicketService);
  private readonly elementRef = inject(ElementRef);

  readonly userMenuOpen = signal(false);
  readonly notifMenuOpen = signal(false);
  readonly inAppNotifs = signal<any[]>([]);
  readonly unreadCount = signal(0);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    if (!this.auth.currentUser()) return;
    this.ticketService.getInAppNotifications().subscribe({
      next: (res) => {
        this.inAppNotifs.set(res.items || []);
        this.unreadCount.set(res.unreadCount || 0);
      },
      error: () => {}
    });
  }

  toggleNotifMenu(event: Event): void {
    event.stopPropagation();
    this.closeUserMenu();
    this.notifMenuOpen.update(v => !v);
    if (this.notifMenuOpen()) {
      this.loadNotifications();
    }
  }

  onNotificationClick(n: any): void {
    if (!n.isRead) {
      this.ticketService.markNotificationRead(n.id).subscribe({
        next: () => {
          this.loadNotifications();
        }
      });
    }
    this.closeAllMenus();
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.notifMenuOpen.set(false);
    this.userMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  closeAllMenus(): void {
    this.userMenuOpen.set(false);
    this.notifMenuOpen.set(false);
  }

  logout(): void {
    this.closeAllMenus();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAllMenus();
    }
  }
}
