import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { TicketSummary } from '../../core/models/ticket.model';
import { Department, Priority } from '../../core/models/catalog.model';

@Component({
  selector: 'app-queue-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="queue-page-wrap">

      <!-- ── Breadcrumb ─────────────────────────────────────────── -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Fila Operacional</span>
      </div>

      <!-- ── Page Header ───────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <div class="header-title-row">
            <h1>Fila Operacional de Atendimento</h1>
            <span class="live-indicator">
              <span class="live-dot"></span>
              Fila ao vivo
            </span>
          </div>
          <p>Chamados pendentes aguardando triagem, distribuição e atendimento prioritário.</p>
        </div>

        <div class="page-header-actions">
          <button class="btn btn-secondary" (click)="loadQueue()" [disabled]="isLoading()" title="Atualizar fila">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" [class.spinning]="isLoading()">
              <path d="M12.5 7A5.5 5.5 0 112 4.5M2 1.5v3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Atualizar
          </button>

          <button
            class="btn btn-yellow"
            (click)="pickNextTicket()"
            [disabled]="filteredQueue().length === 0 || isAssigning()"
            title="Atender o chamado de maior urgência e espera"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Atender próximo da fila
          </button>

          <a routerLink="/tickets/new" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Novo chamado
          </a>
        </div>
      </div>

      <!-- ── Toast de Notificação ──────────────────────────────── -->
      @if (toastMessage()) {
        <div class="toast-alert" [class.toast-success]="toastType() === 'success'" [class.toast-error]="toastType() === 'error'">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ toastMessage() }}</span>
        </div>
      }

      <!-- ── KPI Cards da Fila ─────────────────────────────────── -->
      <div class="queue-kpis-grid">
        <div class="queue-kpi-card">
          <div class="kpi-icon-wrap" style="background:#EFF6FF;color:#1976D2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-title">Total na fila</span>
            <strong class="kpi-num">{{ totalInQueue() }}</strong>
          </div>
        </div>

        <div class="queue-kpi-card">
          <div class="kpi-icon-wrap" style="background:#FEF2F2;color:#DC2626">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3l8 14H2l8-14z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="M10 8v4M10 15h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-title">Urgência Crítica / Alta</span>
            <strong class="kpi-num" style="color:#DC2626">{{ criticalCount() }}</strong>
          </div>
        </div>

        <div class="queue-kpi-card">
          <div class="kpi-icon-wrap" style="background:#FFFBEB;color:#D97706">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/>
              <path d="M3 17a7 7 0 0114 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-title">Sem atendente (Livres)</span>
            <strong class="kpi-num" style="color:#D97706">{{ unassignedCount() }}</strong>
          </div>
        </div>

        <div class="queue-kpi-card">
          <div class="kpi-icon-wrap" style="background:#F0FDF4;color:#16A34A">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.8"/>
              <path d="M10 6v4l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-title">Espera média estimada</span>
            <strong class="kpi-num" style="color:#16A34A">{{ averageWaitTime() }}</strong>
          </div>
        </div>
      </div>

      <!-- ── Tabs por Fila / Departamento ──────────────────────── -->
      <div class="queue-tabs-bar">
        <button
          class="queue-tab-btn"
          [class.active]="selectedDeptFilter() === ''"
          (click)="selectedDeptFilter.set('')"
        >
          Todas as filas
          <span class="tab-badge">{{ tickets().length }}</span>
        </button>

        @for (dept of departments(); track dept.id) {
          <button
            class="queue-tab-btn"
            [class.active]="selectedDeptFilter() === dept.id"
            (click)="selectedDeptFilter.set(dept.id)"
          >
            {{ dept.name }}
            <span class="tab-badge">{{ countForDept(dept.id) }}</span>
          </button>
        }
      </div>

      <!-- ── Barra de busca e filtros rápidos da fila ──────────── -->
      <div class="queue-controls-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por protocolo, título ou solicitante na fila..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="controls-right">
          <!-- Filtro de Prioridade -->
          <select class="form-select filter-select" [(ngModel)]="selectedPriorityFilter">
            <option value="">Todas as prioridades</option>
            @for (pri of priorities(); track pri.id) {
              <option [value]="pri.name">{{ pri.name }}</option>
            }
          </select>

          <!-- Toggle: Apenas não atribuídos -->
          <label class="unassigned-toggle">
            <input type="checkbox" [(ngModel)]="onlyUnassigned" />
            <span>Apenas não atribuídos</span>
          </label>

          <!-- Ordenação -->
          <select class="form-select sort-select" [(ngModel)]="sortBy">
            <option value="priority">Prioridade (Maior peso)</option>
            <option value="oldest">Tempo de espera (Mais antigos)</option>
            <option value="newest">Mais recentes</option>
          </select>
        </div>
      </div>

      <!-- ── Conteúdo: Tabela da Fila ou Loading ou Empty State ── -->
      @if (isLoading()) {
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th style="width:50px">#</th>
                <th>Protocolo</th>
                <th>Título do chamado</th>
                <th>Prioridade</th>
                <th>Fila / Departamento</th>
                <th>Solicitante</th>
                <th>Tempo na fila</th>
                <th>Status</th>
                <th style="text-align:right">Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (i of [1,2,3,4,5]; track i) {
                <tr>
                  <td><div class="skeleton" style="height:16px;width:24px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:75px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:200px"></div></td>
                  <td><div class="skeleton" style="height:20px;width:75px;border-radius:99px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:110px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:95px"></div></td>
                  <td><div class="skeleton" style="height:18px;width:80px"></div></td>
                  <td><div class="skeleton" style="height:20px;width:70px;border-radius:99px"></div></td>
                  <td><div class="skeleton" style="height:30px;width:90px;border-radius:6px;float:right"></div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      } @else if (filteredQueue().length === 0) {
        <!-- Empty State Profissional -->
        <div class="empty-queue-card">
          <div class="empty-queue-icon">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="20" stroke="#E2E8F0" stroke-width="2"/>
              <path d="M14 22l6 6 11-12" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>Fila limpa e organizada! 🎉</h3>
          <p>
            @if (searchQuery || selectedDeptFilter() || selectedPriorityFilter || onlyUnassigned) {
              Nenhum chamado encontrado com os filtros selecionados na fila.
            } @else {
              Não há chamados pendentes de atendimento nesta fila no momento. Excelente trabalho da equipe!
            }
          </p>

          <div class="empty-actions">
            @if (searchQuery || selectedDeptFilter() || selectedPriorityFilter || onlyUnassigned) {
              <button class="btn btn-secondary" (click)="resetFilters()">
                Limpar filtros
              </button>
            }
            <a routerLink="/tickets/new" class="btn btn-yellow">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Abrir novo chamado
            </a>
            <button class="btn btn-secondary" (click)="generateDemoTickets()" [disabled]="isGeneratingDemo()">
              @if (isGeneratingDemo()) {
                Gerando chamados...
              } @else {
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                Gerar chamados de teste na fila
              }
            </button>
          </div>
        </div>

      } @else {
        <!-- Tabela Operacional -->
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th style="width:48px;text-align:center">Pos</th>
                <th style="width:110px">Protocolo</th>
                <th>Título do chamado</th>
                <th style="width:130px">Prioridade</th>
                <th style="width:150px">Fila</th>
                <th style="width:130px">Solicitante</th>
                <th style="width:120px">Espera</th>
                <th style="width:120px">Atendente</th>
                <th style="width:140px;text-align:right">Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (ticket of filteredQueue(); track ticket.id; let i = $index) {
                <tr [class.highlight-row]="i === 0 && !ticket.assignedUser">
                  <!-- Posição na fila -->
                  <td style="text-align:center">
                    <span class="queue-pos-badge" [class.pos-top]="i === 0">#{{ i + 1 }}</span>
                  </td>

                  <!-- Protocolo -->
                  <td>
                    <span class="protocol-badge">{{ ticket.protocol }}</span>
                  </td>

                  <!-- Título + tipo -->
                  <td class="td-title">
                    <a [routerLink]="['/tickets', ticket.id]" class="queue-ticket-title">
                      {{ ticket.title }}
                    </a>
                    <span class="queue-ticket-type">{{ ticket.type.name }}</span>
                  </td>

                  <!-- Prioridade -->
                  <td>
                    <span class="priority-badge" [class]="getPriorityClass(ticket.priority.weight)">
                      <span class="priority-dot" [class]="getPriorityDotClass(ticket.priority.weight)"></span>
                      {{ ticket.priority.name }}
                    </span>
                  </td>

                  <!-- Fila / Departamento -->
                  <td class="td-dept">
                    <span class="dept-tag">{{ ticket.department.name }}</span>
                  </td>

                  <!-- Solicitante -->
                  <td class="td-requester">
                    <div class="requester-cell">
                      <div class="requester-avatar">{{ ticket.requester.name.charAt(0) }}</div>
                      <span class="requester-name">{{ ticket.requester.name }}</span>
                    </div>
                  </td>

                  <!-- Tempo de espera com SLA visual -->
                  <td>
                    <div class="wait-cell" [class]="getWaitSeverityClass(ticket.createdAt)">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.3"/>
                        <path d="M6.5 3.5V6.5L8.5 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                      </svg>
                      <span>{{ getElapsedTime(ticket.createdAt) }}</span>
                    </div>
                  </td>

                  <!-- Atribuído a -->
                  <td>
                    @if (ticket.assignedUser) {
                      <div class="assignee-pill">
                        <div class="assignee-avatar-sm">{{ ticket.assignedUser.name.charAt(0) }}</div>
                        <span class="assignee-name">{{ ticket.assignedUser.name }}</span>
                      </div>
                    } @else {
                      <span class="badge-unassigned">Livre na fila</span>
                    }
                  </td>

                  <!-- Ação rápida -->
                  <td style="text-align:right">
                    @if (!ticket.assignedUser) {
                      <button
                        class="btn btn-yellow btn-sm btn-claim"
                        (click)="claimTicket(ticket)"
                        [disabled]="isAssigning()"
                        title="Assumir este chamado para você"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Assumir
                      </button>
                    } @else {
                      <a [routerLink]="['/tickets', ticket.id]" class="btn btn-secondary btn-sm">
                        Atender
                      </a>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `,
  styles: [`
    .queue-page-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: #16A34A;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      padding: 2px 8px;
      border-radius: 99px;
    }

    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #16A34A;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.25);
      animation: pulseDot 2s infinite ease-in-out;
    }

    @keyframes pulseDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
    }

    .spinning {
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* ── Toast ───────────────────────────────────────────── */
    .toast-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from { transform: translateY(-8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .toast-success {
      background-color: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #15803D;
    }

    .toast-error {
      background-color: #FEF2F2;
      border: 1px solid #FECACA;
      color: #DC2626;
    }

    /* ── KPI Cards ───────────────────────────────────────── */
    .queue-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .queue-kpi-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .kpi-title {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
    }

    .kpi-num {
      font-size: 24px;
      font-weight: 700;
      color: #14213D;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }

    /* ── Tabs por Fila ───────────────────────────────────── */
    .queue-tabs-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
      border-bottom: 1px solid #E5E7EB;
    }

    .queue-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 500;
      color: #64748B;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.12s ease;
      font-family: inherit;
    }

    .queue-tab-btn:hover {
      color: #14213D;
      background: rgba(0,0,0,0.02);
    }

    .queue-tab-btn.active {
      color: #082B55;
      font-weight: 600;
      border-bottom-color: #FFC107;
    }

    .tab-badge {
      padding: 1px 6px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
      background: #F1F5F9;
      color: #475569;
    }

    .queue-tab-btn.active .tab-badge {
      background: #082B55;
      color: #FFFFFF;
    }

    /* ── Controles e Busca ───────────────────────────────── */
    .queue-controls-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 10px 14px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .search-wrap {
      flex: 1;
      min-width: 260px;
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

    .search-input {
      width: 100%;
      height: 38px;
      padding: 0 14px 0 36px;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      background: #F8FAFC;
      font-size: 13px;
      color: #14213D;
      outline: none;
      transition: all 0.12s ease;
      font-family: inherit;
    }

    .search-input:focus {
      background: #FFFFFF;
      border-color: #1976D2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.08);
    }

    .controls-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-select, .sort-select {
      height: 38px;
      font-size: 12.5px;
      border-radius: 6px;
    }

    .unassigned-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      user-select: none;
    }

    .unassigned-toggle input {
      accent-color: #082B55;
      cursor: pointer;
    }

    /* ── Tabela Customizada ──────────────────────────────── */
    .highlight-row {
      background-color: #FFFDF5;
    }

    .queue-pos-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      background: #F1F5F9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .pos-top {
      color: #B45309;
      background: #FEF3C7;
      border: 1px solid #FDE68A;
    }

    .td-title {
      max-width: 260px;
    }

    .queue-ticket-title {
      font-size: 13px;
      font-weight: 600;
      color: #14213D;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-decoration: none;
      transition: color 0.1s ease;
    }

    .queue-ticket-title:hover {
      color: #1976D2;
    }

    .queue-ticket-type {
      font-size: 11px;
      color: #94A3B8;
      display: block;
      margin-top: 2px;
    }

    .dept-tag {
      font-size: 12px;
      color: #475569;
      background: #F8FAFC;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #E2E8F0;
      white-space: nowrap;
    }

    .requester-cell {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .requester-avatar {
      width: 22px;
      height: 22px;
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

    .requester-name {
      font-size: 12.5px;
      color: #14213D;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Tempo de Espera com Cores SLA ───────────────────── */
    .wait-cell {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .wait-good {
      background: #F0FDF4;
      color: #15803D;
      border: 1px solid #DCFCE7;
    }

    .wait-warn {
      background: #FFFBEB;
      color: #B45309;
      border: 1px solid #FEF3C7;
    }

    .wait-crit {
      background: #FEF2F2;
      color: #DC2626;
      border: 1px solid #FEE2E2;
    }

    /* ── Atendente ───────────────────────────────────────── */
    .assignee-pill {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .assignee-avatar-sm {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2563EB;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .assignee-name {
      font-size: 12px;
      color: #14213D;
      white-space: nowrap;
    }

    .badge-unassigned {
      display: inline-flex;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 500;
      color: #64748B;
      background: #F8FAFC;
      border: 1px dashed #CBD5E1;
      border-radius: 4px;
    }

    .btn-claim {
      font-size: 12px;
      padding: 5px 12px;
      font-weight: 600;
    }

    /* ── Empty State ─────────────────────────────────────── */
    .empty-queue-card {
      background: #FFFFFF;
      border: 1px dashed #CBD5E1;
      border-radius: 10px;
      padding: 56px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }

    .empty-queue-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    .empty-queue-card h3 {
      font-size: 18px;
      font-weight: 700;
      color: #14213D;
      margin: 0;
    }

    .empty-queue-card p {
      font-size: 13.5px;
      color: #64748B;
      max-width: 440px;
      margin: 0;
      line-height: 1.5;
    }

    .empty-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 10px;
    }

    /* ── Priority Badges ─────────────────────────────────── */
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

    @media (max-width: 1024px) {
      .queue-kpis-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .queue-kpis-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class QueueListComponent implements OnInit, OnDestroy {
  private readonly ticketService = inject(TicketService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly tickets = signal<TicketSummary[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly priorities = signal<Priority[]>([]);

  readonly isLoading = signal(true);
  readonly isAssigning = signal(false);
  readonly isGeneratingDemo = signal(false);

  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error'>('success');

  // Filtros
  readonly selectedDeptFilter = signal<string>('');
  searchQuery = '';
  selectedPriorityFilter = '';
  onlyUnassigned = false;
  sortBy: 'priority' | 'oldest' | 'newest' = 'priority';

  private autoRefreshTimer: any = null;

  ngOnInit(): void {
    this.loadCatalog();
    this.loadQueue();

    // Auto-refresh a cada 45 segundos para manter a fila viva
    this.autoRefreshTimer = setInterval(() => {
      this.loadQueue(false);
    }, 45000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
    }
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

  loadQueue(showLoading = true): void {
    if (showLoading) this.isLoading.set(true);

    this.ticketService.listTickets({ limit: 100 }).subscribe({
      next: (res) => {
        // A Fila Operacional contém chamados que não foram finalizados (resolvidos ou fechados)
        const pendingTickets = res.items.filter((t) => {
          const s = (t.stage?.name || '').toLowerCase();
          return !s.includes('resolv') && !s.includes('fechad') && !s.includes('encerrad');
        });

        this.tickets.set(pendingTickets);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // ── Computeds para KPIs e Listagem ───────────────────────────
  readonly filteredQueue = computed(() => {
    let list = this.tickets();

    // Filtro de Departamento
    if (this.selectedDeptFilter()) {
      list = list.filter((t) => t.department.id === this.selectedDeptFilter());
    }

    // Filtro de Busca
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.protocol.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.requester.name.toLowerCase().includes(q)
      );
    }

    // Filtro de Prioridade
    if (this.selectedPriorityFilter) {
      list = list.filter((t) => t.priority.name === this.selectedPriorityFilter);
    }

    // Apenas não atribuídos
    if (this.onlyUnassigned) {
      list = list.filter((t) => !t.assignedUser);
    }

    // Ordenação
    return [...list].sort((a, b) => {
      if (this.sortBy === 'priority') {
        if (b.priority.weight !== a.priority.weight) {
          return b.priority.weight - a.priority.weight; // Maior peso primeiro
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Mais antigo primeiro
      } else if (this.sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  });

  totalInQueue(): number {
    return this.tickets().length;
  }

  criticalCount(): number {
    return this.tickets().filter((t) => (t.priority?.weight || 0) >= 70).length;
  }

  unassignedCount(): number {
    return this.tickets().filter((t) => !t.assignedUser).length;
  }

  averageWaitTime(): string {
    const list = this.tickets();
    if (list.length === 0) return '0 min';

    const now = Date.now();
    let totalMs = 0;
    for (const t of list) {
      totalMs += Math.max(0, now - new Date(t.createdAt).getTime());
    }
    const avgMinutes = Math.round(totalMs / list.length / (1000 * 60));

    if (avgMinutes < 60) return `${avgMinutes} min`;
    const hours = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;
    return `${hours}h ${mins}m`;
  }

  countForDept(deptId: string): number {
    return this.tickets().filter((t) => t.department.id === deptId).length;
  }

  resetFilters(): void {
    this.selectedDeptFilter.set('');
    this.searchQuery = '';
    this.selectedPriorityFilter = '';
    this.onlyUnassigned = false;
  }

  // ── Ações: Assumir Chamado ──────────────────────────────────
  claimTicket(ticket: TicketSummary): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.isAssigning.set(true);
    this.ticketService.assignTicket(ticket.id, {
      userId: user.id,
      expectedVersion: ticket.version
    }).subscribe({
      next: () => {
        this.isAssigning.set(false);
        this.showToast(`Chamado #${ticket.protocol} assumido com sucesso!`, 'success');
        this.loadQueue(false);
      },
      error: () => {
        this.isAssigning.set(false);
        this.showToast(`Erro ao assumir chamado #${ticket.protocol}. Tente novamente.`, 'error');
      }
    });
  }

  // Atender o próximo chamado elegível da fila
  pickNextTicket(): void {
    const next = this.filteredQueue()[0];
    if (!next) return;

    const user = this.auth.currentUser();
    if (!next.assignedUser && user) {
      this.isAssigning.set(true);
      this.ticketService.assignTicket(next.id, {
        userId: user.id,
        expectedVersion: next.version
      }).subscribe({
        next: () => {
          this.isAssigning.set(false);
          this.router.navigate(['/tickets', next.id]);
        },
        error: () => {
          this.isAssigning.set(false);
          this.router.navigate(['/tickets', next.id]);
        }
      });
    } else {
      this.router.navigate(['/tickets', next.id]);
    }
  }

  // ── Gerar Chamados de Demonstração na Fila ───────────────────
  generateDemoTickets(): void {
    const depts = this.departments();
    const priorities = this.priorities();
    if (depts.length === 0) return;

    this.isGeneratingDemo.set(true);

    const samples = [
      {
        title: 'Queda de conexão intermitente no switch do andar 3',
        description: 'Os computadores da equipe de operações estão perdendo o gateway local desde às 14h.',
        dept: depts[0],
        weight: 100
      },
      {
        title: 'Solicitação de acesso VPN e certificado para novo colaborador',
        description: 'Colaborador admitido hoje necessita de permissão de acesso à rede interna para trabalho híbrido.',
        dept: depts[0],
        weight: 80
      },
      {
        title: 'Erro 500 ao gerar relatório fiscal no módulo de fechamento',
        description: 'Equipe de contabilidade não consegue exportar a planilha de apuração do trimestre.',
        dept: depts.length > 2 ? depts[2] : depts[0],
        weight: 80
      },
      {
        title: 'Troca de lâmpada e manutenção no ar-condicionado da sala de reuniões',
        description: 'Climatizador desligando sozinho após 20 minutos de funcionamento.',
        dept: depts.length > 3 ? depts[3] : depts[0],
        weight: 20
      }
    ];

    let createdCount = 0;
    samples.forEach((sample) => {
      this.ticketService.getTicketTypes(sample.dept.id).subscribe({
        next: (types) => {
          const type = types[0];
          const matchedPri = priorities.find((p) => p.weight === sample.weight) || priorities[0];

          if (type && matchedPri) {
            this.ticketService.createTicket({
              title: sample.title,
              description: sample.description,
              departmentId: sample.dept.id,
              typeId: type.id,
              priorityId: matchedPri.id
            }).subscribe({
              next: () => {
                createdCount++;
                if (createdCount >= samples.length) {
                  this.isGeneratingDemo.set(false);
                  this.showToast('Chamados de teste gerados na fila com sucesso!', 'success');
                  this.loadQueue();
                }
              },
              error: () => {
                this.isGeneratingDemo.set(false);
              }
            });
          }
        },
        error: () => {
          this.isGeneratingDemo.set(false);
        }
      });
    });
  }

  // ── Utilitários de Tempo e Cores ────────────────────────────
  getElapsedTime(dateStr: string): string {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Agora';
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h ${mins % 60}m`;
    const days = Math.floor(hours / 24);
    return `há ${days} dia${days > 1 ? 's' : ''}`;
  }

  getWaitSeverityClass(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours >= 4) return 'wait-crit';
    if (hours >= 1.5) return 'wait-warn';
    return 'wait-good';
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

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
