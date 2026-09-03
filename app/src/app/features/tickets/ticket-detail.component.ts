import { Component, OnInit, inject, signal, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, JsonPipe } from '@angular/common';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { Ticket, TicketComment, TicketHistoryItem } from '../../core/models/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, JsonPipe],
  template: `
    @if (isLoading()) {
      <!-- Skeleton loading -->
      <div class="detail-skeleton">
        <div class="skeleton" style="height:20px;width:180px;margin-bottom:16px"></div>
        <div class="skeleton" style="height:32px;width:60%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:18px;width:40%;margin-bottom:28px"></div>
        <div style="display:grid;grid-template-columns:240px 1fr 280px;gap:20px">
          <div class="skeleton" style="height:320px;border-radius:8px"></div>
          <div class="skeleton" style="height:320px;border-radius:8px"></div>
          <div class="skeleton" style="height:320px;border-radius:8px"></div>
        </div>
      </div>

    } @else if (errorMessage()) {
      <div class="alert alert-danger">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 5v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        {{ errorMessage() }}
        <div style="margin-top:8px">
          <a routerLink="/tickets" class="btn btn-secondary btn-sm">← Voltar para a lista</a>
        </div>
      </div>

    } @else if (ticket(); as t) {
      <div class="detail-wrap">

        <!-- ── Breadcrumb ─────────────────────────────────────────── -->
        <div class="breadcrumb">
          <a routerLink="/tickets">Dashboard</a>
          <span class="breadcrumb-sep">›</span>
          <a routerLink="/tickets">Todos os chamados</a>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-current">{{ t.protocol }}</span>
        </div>

        <!-- ── Header do ticket ─────────────────────────────────────── -->
        <div class="ticket-header">
          <div class="ticket-header-main">
            <div class="ticket-title-row">
              <span class="protocol-badge">{{ t.protocol }}</span>
              <span class="status-badge" [class]="getStageClass(t.stage.name)">
                {{ t.stage.name }}
              </span>
            </div>
            <h1 class="ticket-title">{{ t.title }}</h1>
            <p class="ticket-meta">
              Aberto por <strong>{{ t.requester.name }}</strong>
              em {{ t.createdAt | date:'dd/MM/yyyy' }}
              às {{ t.createdAt | date:'HH:mm' }}
            </p>
          </div>

          <div class="ticket-header-actions">
            @if (conflictError()) {
              <div class="alert alert-warning" style="margin:0;padding:8px 12px;font-size:12px">
                ⚠️ Conflito detectado. Dados recarregados.
              </div>
            }

            @if (!t.assignedUser) {
              @if (perm.can('ticket.assign')) {
                <button id="btn-assumir" class="btn btn-yellow" (click)="assignToMe()">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M1 13a5 5 0 0110 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M11 7l1.5 1.5L15 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Assumir atendimento
                </button>
              }
            } @else {
              <div class="assignee-pill">
                <div class="assignee-avatar-sm">{{ t.assignedUser.name.charAt(0) }}</div>
                <span>{{ t.assignedUser.name }}</span>
              </div>
            }

            <button class="btn btn-secondary">
              Ações
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- ── Layout 3 colunas ─────────────────────────────────────── -->
        <div class="detail-layout">

          <!-- ── Coluna esquerda: Informações do ticket ─────────────── -->
          <aside class="detail-info-col">
            <div class="card card-sm">
              <h3 class="col-title">Informações</h3>

              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Departamento</span>
                  <span class="info-value">{{ t.department.name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Tipo</span>
                  <span class="info-value">{{ t.type.name }}</span>
                </div>
                @if (t.category) {
                  <div class="info-item">
                    <span class="info-label">Categoria</span>
                    <span class="info-value">{{ t.category.name }}</span>
                  </div>
                }
                <div class="info-item">
                  <span class="info-label">Prioridade</span>
                  <span class="priority-badge" [class]="getPriorityClass(t.priority.weight)">
                    <span class="priority-dot" [class]="getPriorityDotClass(t.priority.weight)"></span>
                    {{ t.priority.name }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Pipeline</span>
                  <span class="info-value font-mono" style="font-size:12px">{{ t.pipeline.name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Etapa atual</span>
                  <span class="status-badge" [class]="getStageClass(t.stage.name)" style="font-size:11px">
                    {{ t.stage.name }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Atribuído a</span>
                  @if (t.assignedUser) {
                    <div class="assignee-sm">
                      <div class="assignee-avatar-sm">{{ t.assignedUser.name.charAt(0) }}</div>
                      <span class="info-value">{{ t.assignedUser.name }}</span>
                    </div>
                  } @else {
                    <span class="info-value-muted">Não atribuído</span>
                  }
                </div>
                <div class="info-item">
                  <span class="info-label">Versão</span>
                  <span class="info-value font-mono" style="font-size:11px;color:#9CA3AF">v{{ t.version }}</span>
                </div>
              </div>
            </div>
          </aside>

          <!-- ── Coluna central: Descrição + Tabs ──────────────────── -->
          <div class="detail-main-col">

            <!-- Descrição -->
            <div class="card card-sm description-card">
              <h3 class="col-title">Descrição da solicitação</h3>
              <p class="description-text">{{ t.description }}</p>
            </div>

            <!-- Tabs: Comentários / Histórico / Anexos -->
            <div class="tabs-card">
              <div class="tabs-nav">
                <button class="tab-btn" [class.active]="activeTab === 'comments'" (click)="activeTab = 'comments'">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M11 2H2a1 1 0 00-1 1v6a1 1 0 001 1h1.5L6 12l2.5-2H11a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                  </svg>
                  Comentários
                  <span class="tab-count">{{ comments().length }}</span>
                </button>
                <button class="tab-btn" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M6.5 3.5v3l2 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                  Histórico
                  <span class="tab-count">{{ history().length }}</span>
                </button>
                <button class="tab-btn" [class.active]="activeTab === 'attachments'" (click)="activeTab = 'attachments'">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M11 7.5L6.5 12A3.5 3.5 0 012 7.5l6-6a2 2 0 013 3L5 10.5a.5.5 0 01-.7-.7L10 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                  Anexos
                </button>
              </div>

              <div class="tab-content">

                <!-- Aba Comentários -->
                @if (activeTab === 'comments') {
                  <div class="comments-list">

                    @for (c of comments(); track c.id) {
                      <div class="comment-item" [class.comment-internal]="c.visibility === 'internal'">
                        <div class="comment-avatar">{{ c.author.name.charAt(0) }}</div>
                        <div class="comment-body-wrap">
                          <div class="comment-header">
                            <span class="comment-author">{{ c.author.name }}</span>
                            @if (c.visibility === 'internal') {
                              <span class="badge badge-warning" style="font-size:10px;padding:2px 7px">Nota interna</span>
                            }
                            <span class="comment-date">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                          </div>
                          <p class="comment-text">{{ c.body }}</p>
                        </div>
                      </div>
                    } @empty {
                      <div class="empty-comments">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                          <path d="M27 6H5a2 2 0 00-2 2v14a2 2 0 002 2h4l7 5 7-5h4a2 2 0 002-2V8a2 2 0 00-2-2z" stroke="#D1D5DB" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                        <p>Nenhum comentário registrado.</p>
                      </div>
                    }

                    <!-- Novo comentário -->
                    <div class="new-comment">
                      <div class="comment-avatar comment-avatar-me">{{ getMyInitial() }}</div>
                      <div class="new-comment-form">
                        <textarea
                          class="form-textarea"
                          rows="3"
                          placeholder="Escreva um comentário..."
                          [(ngModel)]="newCommentBody"
                          style="border-radius:8px;font-size:13px"
                        ></textarea>
                        <div class="new-comment-actions">
                          @if (perm.can('ticket.comment_internal')) {
                            <label class="internal-toggle">
                              <input type="checkbox" [(ngModel)]="isInternalNote" />
                              <span>Nota interna</span>
                            </label>
                          }
                          <button
                            class="btn btn-yellow btn-sm"
                            [disabled]="!newCommentBody.trim() || isSubmittingComment()"
                            (click)="addComment()"
                          >
                            @if (isSubmittingComment()) {
                              Enviando...
                            } @else {
                              Enviar
                            }
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                }

                <!-- Aba Histórico -->
                @if (activeTab === 'history') {
                  <div class="timeline">
                    @for (item of history(); track item.id) {
                      <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-line"></div>
                        <div class="timeline-content">
                          <div class="timeline-header">
                            <strong>{{ item.actor.name }}</strong>
                            <span class="timeline-action">{{ item.action }}</span>
                            <span class="timeline-date">{{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                          </div>
                          @if (item.metadata) {
                            <pre class="timeline-meta">{{ item.metadata | json }}</pre>
                          }
                        </div>
                      </div>
                    } @empty {
                      <div class="empty-comments">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                          <circle cx="16" cy="16" r="12" stroke="#D1D5DB" stroke-width="1.5"/>
                          <path d="M16 9v7l4 4" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <p>Nenhum evento no histórico.</p>
                      </div>
                    }
                  </div>
                }

                <!-- Aba Anexos -->
                @if (activeTab === 'attachments') {
                  <div class="empty-comments">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M27 17.5L16.5 28A7 7 0 016 17.5l13-13a4 4 0 016 5.5L12 22.5a1 1 0 01-1.4-1.4L22 10" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <p>Nenhum anexo neste chamado.</p>
                  </div>
                }

              </div>
            </div>
          </div>

          <!-- ── Coluna direita: Solicitante + SLA ─────────────────── -->
          <aside class="detail-right-col">

            <!-- Informações do solicitante -->
            <div class="card card-sm">
              <h3 class="col-title">Solicitante</h3>
              <div class="requester-profile">
                <div class="requester-avatar">{{ t.requester.name.charAt(0) }}</div>
                <div class="requester-info">
                  <strong class="requester-name">{{ t.requester.name }}</strong>
                  <span class="requester-email">{{ t.department.name }}</span>
                </div>
              </div>
              <div class="info-list" style="margin-top:16px">
                <div class="info-item">
                  <span class="info-label">Setor</span>
                  <span class="info-value">{{ t.department.name }}</span>
                </div>
              </div>
            </div>

            <!-- SLA -->
            <div class="card card-sm sla-card">
              <h3 class="col-title">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0">
                  <circle cx="7" cy="7" r="5.5" stroke="#1976D2" stroke-width="1.4"/>
                  <path d="M7 4v3l2 1.5" stroke="#1976D2" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                SLA
              </h3>
              <div class="sla-item">
                <span class="info-label">Meta de resposta</span>
                <span class="sla-value">2h 00m</span>
              </div>
              <div class="sla-progress">
                <div class="sla-bar">
                  <div class="sla-bar-fill" style="width:65%"></div>
                </div>
                <span class="sla-hint">65% consumido</span>
              </div>
            </div>

          </aside>

        </div>
      </div>
    }
  `,
  styles: [`
    .detail-skeleton {
      padding: 4px 0;
    }

    .detail-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Header do ticket ────────────────────────────── */
    .ticket-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px 24px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .ticket-header-main {
      flex: 1;
      min-width: 0;
    }

    .ticket-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .ticket-title {
      font-size: 20px;
      font-weight: 700;
      color: #14213D;
      margin-bottom: 6px;
      line-height: 1.3;
    }

    .ticket-meta {
      font-size: 13px;
      color: #9CA3AF;
      margin: 0;
    }

    .ticket-meta strong {
      color: #667085;
      font-weight: 600;
    }

    .ticket-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .assignee-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 99px;
      font-size: 13px;
      font-weight: 500;
      color: #15803D;
    }

    .assignee-sm {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .assignee-avatar-sm {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: linear-gradient(135deg, #082B55, #1976D2);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ── Layout 3 colunas ────────────────────────────── */
    .detail-layout {
      display: grid;
      grid-template-columns: 240px 1fr 280px;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1200px) {
      .detail-layout { grid-template-columns: 220px 1fr; }
      .detail-right-col { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    }

    @media (max-width: 768px) {
      .detail-layout { grid-template-columns: 1fr; }
      .detail-right-col { grid-column: 1; display: flex; flex-direction: column; }
    }

    /* ── Colunas ─────────────────────────────────────── */
    .detail-info-col, .detail-right-col, .detail-main-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .col-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #9CA3AF;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── Info list ───────────────────────────────────── */
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 11px;
      font-weight: 600;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 13px;
      font-weight: 500;
      color: #14213D;
    }

    .info-value-muted {
      font-size: 13px;
      color: #9CA3AF;
      font-style: italic;
    }

    /* ── Priority/Status inline badges ──────────────── */
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

    /* ── Descrição ───────────────────────────────────── */
    .description-card { padding: 20px 24px; }

    .description-text {
      font-size: 13.5px;
      color: #4B5563;
      white-space: pre-wrap;
      line-height: 1.65;
      margin: 0;
    }

    /* ── Tabs card ───────────────────────────────────── */
    .tabs-card {
      background-color: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .tab-content {
      padding: 20px 24px;
    }

    /* ── Comentários ─────────────────────────────────── */
    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      display: flex;
      gap: 12px;
    }

    .comment-internal {
      background-color: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 8px;
      padding: 12px;
      margin: 0 -4px;
    }

    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #082B55, #1976D2);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .comment-avatar-me {
      background: linear-gradient(135deg, #065F46, #16A34A);
    }

    .comment-body-wrap {
      flex: 1;
      min-width: 0;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }

    .comment-author {
      font-size: 13px;
      font-weight: 600;
      color: #14213D;
    }

    .comment-date {
      font-size: 11.5px;
      color: #9CA3AF;
      margin-left: auto;
    }

    .comment-text {
      font-size: 13.5px;
      color: #4B5563;
      line-height: 1.55;
      margin: 0;
      white-space: pre-wrap;
    }

    .empty-comments {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 32px 0;
      color: #9CA3AF;
    }

    .empty-comments p {
      font-size: 13px;
      color: #9CA3AF;
      margin: 0;
    }

    /* Novo comentário */
    .new-comment {
      display: flex;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
    }

    .new-comment-form {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .new-comment-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .internal-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #667085;
      cursor: pointer;
    }

    .internal-toggle input[type="checkbox"] {
      accent-color: #FFC107;
    }

    /* ── Timeline ────────────────────────────────────── */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .timeline-item {
      display: flex;
      gap: 12px;
      position: relative;
      padding-bottom: 16px;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #1976D2;
      border: 2px solid #EFF6FF;
      flex-shrink: 0;
      margin-top: 4px;
      z-index: 1;
    }

    .timeline-line {
      position: absolute;
      left: 4px;
      top: 14px;
      bottom: 0;
      width: 2px;
      background-color: #E5E7EB;
    }

    .timeline-item:last-child .timeline-line { display: none; }

    .timeline-content { flex: 1; }

    .timeline-header {
      font-size: 13px;
      color: #4B5563;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }

    .timeline-header strong {
      color: #14213D;
    }

    .timeline-action {
      color: #667085;
    }

    .timeline-date {
      font-size: 11.5px;
      color: #9CA3AF;
      margin-left: auto;
    }

    .timeline-meta {
      margin-top: 6px;
      padding: 8px;
      background: #F8FAFC;
      border-radius: 4px;
      font-size: 11px;
      color: #667085;
      overflow-x: auto;
    }

    /* ── Solicitante / SLA ───────────────────────────── */
    .requester-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }

    .requester-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #082B55, #1976D2);
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .requester-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .requester-name {
      font-size: 14px;
      font-weight: 700;
      color: #14213D;
    }

    .requester-email {
      font-size: 12px;
      color: #667085;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sla-card { display: flex; flex-direction: column; gap: 10px; }

    .sla-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sla-value {
      font-size: 22px;
      font-weight: 700;
      color: #14213D;
      letter-spacing: -0.02em;
    }

    .sla-progress {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .sla-bar {
      height: 6px;
      background-color: #E5E7EB;
      border-radius: 99px;
      overflow: hidden;
    }

    .sla-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #16A34A, #FFC107);
      border-radius: 99px;
      transition: width 0.3s ease;
    }

    .sla-hint {
      font-size: 11px;
      color: #9CA3AF;
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  id = input.required<string>();

  private readonly ticketService = inject(TicketService);
  readonly auth = inject(AuthService);
  readonly perm = inject(PermissionService);

  readonly ticket = signal<Ticket | null>(null);
  readonly comments = signal<TicketComment[]>([]);
  readonly history = signal<TicketHistoryItem[]>([]);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly conflictError = signal(false);

  activeTab: 'comments' | 'history' | 'attachments' = 'comments';
  newCommentBody = '';
  isInternalNote = false;
  readonly isSubmittingComment = signal(false);

  ngOnInit(): void {
    this.loadTicket();
  }

  loadTicket(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.conflictError.set(false);

    const ticketId = this.id();
    this.ticketService.getTicket(ticketId).subscribe({
      next: (data) => {
        this.ticket.set(data);
        this.isLoading.set(false);
        this.loadComments(ticketId);
        this.loadHistory(ticketId);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error?.message || 'Erro ao carregar detalhes do chamado.');
      }
    });
  }

  loadComments(ticketId: string): void {
    this.ticketService.getComments(ticketId).subscribe({
      next: (list) => this.comments.set(list)
    });
  }

  loadHistory(ticketId: string): void {
    this.ticketService.getHistory(ticketId).subscribe({
      next: (list) => this.history.set(list)
    });
  }

  assignToMe(): void {
    const t = this.ticket();
    const user = this.auth.currentUser();
    if (!t || !user) return;

    this.ticketService.assignTicket(t.id, {
      userId: user.id,
      expectedVersion: t.version
    }).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.loadHistory(t.id);
      },
      error: (err) => {
        if (err.status === 409) {
          this.conflictError.set(true);
          this.loadTicket();
        }
      }
    });
  }

  addComment(): void {
    const t = this.ticket();
    if (!t || !this.newCommentBody.trim()) return;

    this.isSubmittingComment.set(true);
    this.ticketService.addComment(t.id, {
      body: this.newCommentBody.trim(),
      visibility: this.isInternalNote ? 'internal' : 'public'
    }).subscribe({
      next: (comment) => {
        this.comments.update((list) => [comment, ...list]);
        this.newCommentBody = '';
        this.isSubmittingComment.set(false);
        this.loadHistory(t.id);
      },
      error: () => { this.isSubmittingComment.set(false); }
    });
  }

  getMyInitial(): string {
    return this.auth.currentUser()?.name.charAt(0).toUpperCase() || 'U';
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
