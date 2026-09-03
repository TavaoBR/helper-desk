import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { TicketSummary } from '../../core/models/ticket.model';
import { Department, Priority } from '../../core/models/catalog.model';
import { PaginationMeta } from '../../core/models/api.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="page-wrap">

      <!-- ── Breadcrumb ─────────────────────────────────────────── -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <span class="breadcrumb-sep">›</span>
        @if (currentScope() === 'attending') {
          <span class="breadcrumb-current">Atendimentos</span>
        } @else if (currentScope() === 'mine') {
          <span>Meus chamados</span>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-current">Abertos por mim</span>
        } @else {
          <span class="breadcrumb-current">Todos os chamados</span>
        }
      </div>

      <!-- ── Page Header ───────────────────────────────────────── -->
      <div class="page-header">
        <div>
          @if (currentScope() === 'attending') {
            <h1>Central de Atendimento</h1>
            <p>Gerencie chamados em atendimento e atenda solicitações operacionais.</p>
          } @else if (currentScope() === 'mine') {
            <h1>Chamados abertos por mim</h1>
            <p>Acompanhe o andamento das solicitações abertas pelo seu usuário.</p>
          } @else {
            <h1>Todos os chamados</h1>
            <p>Visualize e gerencie todos os chamados da empresa.</p>
          }
        </div>
        <div class="page-header-actions">
          <a routerLink="/tickets/new" id="btn-novo-chamado" class="btn btn-yellow">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Novo chamado
          </a>
        </div>
      </div>

      <!-- ── Barra de busca e filtros unificada ─────────────────── -->
      <div class="search-filter-card">
        <div class="search-filter-main">
          <div class="search-box">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              id="ticket-search"
              type="text"
              class="search-input-clean"
              placeholder="Buscar por número, título ou solicitante..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="loadTickets(1)"
            />
          </div>

          <div class="filter-actions-group">
            @if (currentScope() === 'attending' && perm.primaryRole() === 'ROLE_AGENT') {
              <div class="toggle-group">
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="agentView() === 'all'"
                  (click)="setAgentView('all')"
                >
                  Fila geral
                </button>
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="agentView() === 'mine'"
                  (click)="setAgentView('mine')"
                >
                  Atribuídos a mim
                </button>
              </div>
            }

            <button
              class="btn btn-secondary filter-toggle-btn"
              [class.active]="showFilters() || hasActiveFilters()"
              (click)="showFilters.update(v => !v)"
              title="Filtros avançados"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Filtros
              @if (hasActiveFilters()) {
                <span class="filter-active-dot"></span>
              }
              <svg class="chevron-filter" [class.rotated]="showFilters()" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Painel expansível de filtros -->
        @if (showFilters()) {
          <div class="filters-expanded-panel">
            <div class="filters-row">
              <div class="filter-field">
                <label class="filter-label">Departamento</label>
                <select class="form-select filter-select" [(ngModel)]="selectedDepartment">
                  <option value="">Todos os departamentos</option>
                  @for (dept of departments(); track dept.id) {
                    <option [value]="dept.id">{{ dept.name }}</option>
                  }
                </select>
              </div>

              <div class="filter-field">
                <label class="filter-label">Prioridade</label>
                <select class="form-select filter-select" [(ngModel)]="selectedPriority">
                  <option value="">Todas as prioridades</option>
                  @for (pri of priorities(); track pri.id) {
                    <option [value]="pri.id">{{ pri.name }}</option>
                  }
                </select>
              </div>

              <div class="filter-buttons">
                <button class="btn btn-primary btn-sm" (click)="loadTickets(1)">
                  Aplicar filtros
                </button>
                @if (hasActiveFilters()) {
                  <button class="btn btn-ghost btn-sm" (click)="clearFilters()">
                    Limpar
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ── Tabs de status com contadores estilo SaaS ─────────── -->
      <div class="tabs-nav">
        <button class="tab-btn" [class.active]="activeTab === 'all'" (click)="setTab('all')">
          Todos
          <span class="tab-count">{{ totalCount() }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'open'" (click)="setTab('open')">
          Abertos
          <span class="tab-count">{{ openCount() }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'attending'" (click)="setTab('attending')">
          Em atendimento
          <span class="tab-count">{{ attendingCount() }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'waiting'" (click)="setTab('waiting')">
          Aguardando
          <span class="tab-count">{{ waitingCount() }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'resolved'" (click)="setTab('resolved')">
          Resolvidos
          <span class="tab-count">{{ resolvedCount() }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'closed'" (click)="setTab('closed')">
          Fechados
          <span class="tab-count">{{ closedCount() }}</span>
        </button>
      </div>

      <!-- ── Conteúdo principal ─────────────────────────────────── -->
      @if (isLoading()) {
        <!-- Skeleton loading -->
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>#</th><th>Título</th><th>Solicitante</th>
                <th>Departamento</th><th>Prioridade</th><th>Etapa</th>
                <th>Atribuído a</th><th>Abertura</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (i of [1,2,3,4,5,6,7]; track i) {
                <tr>
                  <td><div class="skeleton" style="height:18px;width:60px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:180px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:100px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:90px"></div></td>
                  <td><div class="skeleton" style="height:20px;width:70px;border-radius:99px"></div></td>
                  <td><div class="skeleton" style="height:20px;width:100px;border-radius:99px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:100px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:110px"></div></td>
                  <td><div class="skeleton" style="height:28px;width:70px;border-radius:6px"></div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      } @else if (errorMessage()) {
        <div class="alert alert-danger">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 5v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ errorMessage() }}
        </div>

      } @else if (displayTickets.length === 0) {
        <!-- Empty state -->
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M24 14H4a2 2 0 00-2 2v8a2 2 0 002 2h20a2 2 0 002-2v-8a2 2 0 00-2-2z" stroke="#B0BAC8" stroke-width="1.6"/>
              <path d="M8 14V8a6 6 0 0112 0v6" stroke="#B0BAC8" stroke-width="1.6" stroke-linecap="round"/>
              <circle cx="14" cy="19" r="2" fill="#B0BAC8"/>
            </svg>
          </div>
          <h3>Nenhum chamado encontrado</h3>
          <p>Não há chamados cadastrados com os filtros selecionados.</p>
          <a routerLink="/tickets/new" class="btn btn-yellow">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Abrir novo chamado
          </a>
        </div>

      } @else {
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Solicitante</th>
                <th>Departamento</th>
                <th>Prioridade</th>
                <th>Etapa atual</th>
                <th>Atribuído a</th>
                <th>Abertura</th>
                <th style="width:80px;text-align:right"></th>
              </tr>
            </thead>
            <tbody>
              @for (ticket of displayTickets; track ticket.id) {
                <tr>
                  <td>
                    <span class="protocol-badge">{{ ticket.protocol }}</span>
                  </td>
                  <td class="td-title">
                    <a [routerLink]="['/tickets', ticket.id]" class="ticket-link">
                      {{ ticket.title }}
                    </a>
                  </td>
                  <td class="td-name">{{ ticket.requester.name }}</td>
                  <td class="td-dept">{{ ticket.department.name }}</td>
                  <td>
                    <span class="priority-badge" [class]="getPriorityClass(ticket.priority.weight)">
                      <span class="priority-dot" [class]="getPriorityDotClass(ticket.priority.weight)"></span>
                      {{ ticket.priority.name }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="getStageClass(ticket.stage.name)">
                      {{ ticket.stage.name }}
                    </span>
                  </td>
                  <td>
                    @if (ticket.assignedUser) {
                      <div class="assignee">
                        <div class="assignee-avatar">{{ ticket.assignedUser.name.charAt(0) }}</div>
                        <span>{{ ticket.assignedUser.name }}</span>
                      </div>
                    } @else {
                      <span class="unassigned">— Não atribuído</span>
                    }
                  </td>
                  <td class="td-date">{{ ticket.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td style="text-align:right">
                    <a [routerLink]="['/tickets', ticket.id]" class="btn btn-ghost btn-sm">
                      Ver
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- ── Paginação ──────────────────────────────────── -->
        @if (pagination(); as pag) {
          <div class="pagination-wrap">
            <span class="pagination-info">
              Mostrando {{ tickets().length }} de {{ pag.total }} chamados
            </span>
            <div class="pagination">
              <button
                class="pagination-btn"
                [disabled]="pag.page <= 1"
                (click)="loadTickets(pag.page - 1)"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              @for (page of getPageNumbers(pag.page, totalPages(pag)); track page) {
                @if (page === -1) {
                  <span class="pagination-ellipsis">…</span>
                } @else {
                  <button
                    class="pagination-btn"
                    [class.active]="page === pag.page"
                    (click)="loadTickets(page)"
                  >
                    {{ page }}
                  </button>
                }
              }

              <button
                class="pagination-btn"
                [disabled]="pag.page * pag.limit >= pag.total"
                (click)="loadTickets(pag.page + 1)"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .page-wrap {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ── Barra de busca e filtros unificada estilo SaaS ────── */
    .search-filter-card {
      background-color: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      overflow: hidden;
      transition: border-color 0.15s ease;
    }

    .search-filter-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
    }

    .search-box {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #9CA3AF;
      pointer-events: none;
    }

    .search-input-clean {
      width: 100%;
      height: 38px;
      padding: 0 14px 0 38px;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      font-family: inherit;
      font-size: 13.5px;
      color: #14213D;
      background-color: #F8FAFC;
      outline: none;
      transition: all 0.15s ease;
    }

    .search-input-clean:focus {
      background-color: #FFFFFF;
      border-color: #1976D2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.08);
    }

    .search-input-clean::placeholder {
      color: #9CA3AF;
    }

    .filter-actions-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .filter-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 38px;
      padding: 0 14px;
      font-size: 13px;
      font-weight: 500;
      color: #4B5563;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      background-color: #FFFFFF;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .filter-toggle-btn:hover,
    .filter-toggle-btn.active {
      background-color: #F8FAFC;
      border-color: #D1D5DB;
      color: #14213D;
    }

    .filter-active-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #1976D2;
    }

    .chevron-filter {
      color: #9CA3AF;
      transition: transform 0.15s ease;
    }

    .chevron-filter.rotated {
      transform: rotate(180deg);
    }

    /* Painel expansível de filtros */
    .filters-expanded-panel {
      padding: 14px 16px;
      background-color: #F8FAFC;
      border-top: 1px solid #E5E7EB;
    }

    .filters-row {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      flex-wrap: wrap;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1;
      min-width: 200px;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 600;
      color: #4B5563;
    }

    .filter-select {
      font-size: 13px;
      height: 36px;
      border-radius: 6px;
    }

    .filter-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 1px;
    }

    /* Toggle agente */
    .toggle-group {
      display: flex;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      overflow: hidden;
      height: 38px;
    }

    .toggle-btn {
      padding: 0 14px;
      font-size: 12.5px;
      font-weight: 500;
      background: #FFFFFF;
      border: none;
      color: #667085;
      cursor: pointer;
      transition: all 0.12s ease;
      font-family: inherit;
      display: flex;
      align-items: center;
    }

    .toggle-btn + .toggle-btn {
      border-left: 1px solid #E5E7EB;
    }

    .toggle-btn.active {
      background-color: #082B55;
      color: #FFFFFF;
      font-weight: 600;
    }

    /* ── Tabela: cells específicas ─────────────────────── */
    .td-title {
      max-width: 260px;
    }

    .td-name {
      white-space: nowrap;
    }

    .td-dept {
      white-space: nowrap;
      color: #667085;
    }

    .td-date {
      white-space: nowrap;
      font-size: 12px;
      color: #9CA3AF;
      font-family: var(--font-family-mono);
    }

    .ticket-link {
      font-weight: 600;
      color: #14213D;
      font-size: 13px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 0.12s ease;
    }

    .ticket-link:hover {
      color: #1976D2;
    }

    /* ── Priority badge ──────────────────────────────── */
    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px 3px 7px;
      font-size: 11.5px;
      font-weight: 600;
      border-radius: 99px;
      white-space: nowrap;
    }

    .priority-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .priority-critical { background-color: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
    .priority-high     { background-color: #FFF7ED; color: #EA580C; border: 1px solid #FED7AA; }
    .priority-medium   { background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
    .priority-low      { background-color: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }

    .dot-critical { background-color: #DC2626; }
    .dot-high     { background-color: #EA580C; }
    .dot-medium   { background-color: #D97706; }
    .dot-low      { background-color: #16A34A; }

    /* ── Status badge ────────────────────────────────── */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      font-size: 11.5px;
      font-weight: 600;
      border-radius: 99px;
      white-space: nowrap;
    }

    .status-novo        { background-color: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
    .status-triagem     { background-color: #EFF6FF; color: #0369A1; border: 1px solid #BAE6FD; }
    .status-atendimento { background-color: #EFF6FF; color: #0284C7; border: 1px solid #BAE6FD; }
    .status-aguardando  { background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
    .status-resolvido   { background-color: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }
    .status-fechado     { background-color: #F9FAFB; color: #6B7280; border: 1px solid #E5E7EB; }
    .status-default     { background-color: #F9FAFB; color: #6B7280; border: 1px solid #E5E7EB; }

    /* ── Assignee ────────────────────────────────────── */
    .assignee {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      color: #14213D;
    }

    .assignee-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #082B55, #1976D2);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .unassigned {
      font-size: 12px;
      color: #9CA3AF;
      font-style: italic;
    }

    /* ── Paginação ───────────────────────────────────── */
    .pagination-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .pagination-info {
      font-size: 12.5px;
      color: #9CA3AF;
    }

    .pagination-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      font-size: 13px;
      color: #9CA3AF;
    }
  `]
})
export class TicketListComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly auth = inject(AuthService);
  readonly perm = inject(PermissionService);
  protected readonly Math = Math;

  readonly tickets = signal<TicketSummary[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly priorities = signal<Priority[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly agentView = signal<'all' | 'mine'>('all');
  readonly showFilters = signal(false);

  activeTab: 'all' | 'open' | 'attending' | 'waiting' | 'resolved' | 'closed' = 'all';
  searchQuery = '';
  selectedDepartment = '';
  selectedPriority = '';

  hasActiveFilters(): boolean {
    return !!(this.selectedDepartment || this.selectedPriority);
  }

  clearFilters(): void {
    this.selectedDepartment = '';
    this.selectedPriority = '';
    this.loadTickets(1);
  }

  setTab(tab: 'all' | 'open' | 'attending' | 'waiting' | 'resolved' | 'closed'): void {
    this.activeTab = tab;
  }

  get displayTickets(): TicketSummary[] {
    const list = this.tickets();
    if (this.activeTab === 'all') return list;
    return list.filter(t => {
      const s = (t.stage?.name || '').toLowerCase();
      if (this.activeTab === 'open') return s.includes('novo') || s.includes('aberto') || s.includes('triagem');
      if (this.activeTab === 'attending') return s.includes('atendimento') || s.includes('andamento');
      if (this.activeTab === 'waiting') return s.includes('aguardando');
      if (this.activeTab === 'resolved') return s.includes('resolv');
      if (this.activeTab === 'closed') return s.includes('fechado') || s.includes('encerrado');
      return true;
    });
  }

  totalCount(): number {
    return this.pagination()?.total ?? this.tickets().length;
  }

  openCount(): number {
    return this.tickets().filter(t => {
      const s = (t.stage?.name || '').toLowerCase();
      return s.includes('novo') || s.includes('aberto') || s.includes('triagem');
    }).length;
  }

  attendingCount(): number {
    return this.tickets().filter(t => {
      const s = (t.stage?.name || '').toLowerCase();
      return s.includes('atendimento') || s.includes('andamento');
    }).length;
  }

  waitingCount(): number {
    return this.tickets().filter(t => (t.stage?.name || '').toLowerCase().includes('aguardando')).length;
  }

  resolvedCount(): number {
    return this.tickets().filter(t => (t.stage?.name || '').toLowerCase().includes('resolv')).length;
  }

  closedCount(): number {
    return this.tickets().filter(t => {
      const s = (t.stage?.name || '').toLowerCase();
      return s.includes('fechado') || s.includes('encerrado');
    }).length;
  }

  private readonly route = inject(ActivatedRoute);
  readonly currentScope = signal<'mine' | 'all' | 'attending'>('all');

  ngOnInit(): void {
    this.loadCatalog();
    this.route.queryParamMap.subscribe(params => {
      const scopeParam = params.get('scope');
      if (scopeParam === 'mine' || scopeParam === 'attending' || scopeParam === 'all') {
        this.currentScope.set(scopeParam);
      } else {
        this.currentScope.set(this.perm.primaryRole() === 'ROLE_USER' ? 'mine' : 'all');
      }
      this.loadTickets(1);
    });
  }

  loadCatalog(): void {
    this.ticketService.getDepartments().subscribe({
      next: (data) => this.departments.set(data),
      error: () => {}
    });
    this.ticketService.getPriorities().subscribe({
      next: (data) => this.priorities.set(data),
      error: () => {}
    });
  }

  setAgentView(view: 'all' | 'mine'): void {
    this.agentView.set(view);
    this.loadTickets(1);
  }

  loadTickets(page: number = 1): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const user = this.auth.currentUser();
    let requesterId: string | undefined = undefined;
    let assignedUserId: string | undefined = undefined;

    if (this.currentScope() === 'mine') {
      requesterId = user?.id;
    } else if (this.currentScope() === 'attending') {
      if (this.agentView() === 'mine') {
        assignedUserId = user?.id;
      }
    }

    this.ticketService.listTickets({
      page,
      limit: 15,
      search: this.searchQuery || undefined,
      departmentId: this.selectedDepartment || undefined,
      priorityId: this.selectedPriority || undefined,
      assignedUserId,
      requesterId
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.tickets.set(res.items);
        this.pagination.set(res.pagination);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error?.message || 'Erro ao carregar lista de chamados.');
      }
    });
  }

  totalPages(pag: PaginationMeta): number {
    return Math.ceil(pag.total / pag.limit) || 1;
  }

  getPageNumbers(current: number, total: number): number[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  getPriorityClass(weight: number): string {
    if (weight >= 90) return 'priority-badge priority-critical';
    if (weight >= 70) return 'priority-badge priority-high';
    if (weight >= 40) return 'priority-badge priority-medium';
    return 'priority-badge priority-low';
  }

  getPriorityDotClass(weight: number): string {
    if (weight >= 90) return 'priority-dot dot-critical';
    if (weight >= 70) return 'priority-dot dot-high';
    if (weight >= 40) return 'priority-dot dot-medium';
    return 'priority-dot dot-low';
  }

  getStageClass(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('novo') || n.includes('aberto')) return 'status-badge status-novo';
    if (n.includes('triagem')) return 'status-badge status-triagem';
    if (n.includes('atendimento') || n.includes('andamento')) return 'status-badge status-atendimento';
    if (n.includes('aguardando')) return 'status-badge status-aguardando';
    if (n.includes('resolv')) return 'status-badge status-resolvido';
    if (n.includes('fechado') || n.includes('encerrado')) return 'status-badge status-fechado';
    return 'status-badge status-default';
  }
}
