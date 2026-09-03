import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  email: boolean;
  inApp: boolean;
  push: boolean;
}

@Component({
  selector: 'app-settings-notifications',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="notifications-page-wrap">

      <!-- ── Breadcrumb ─────────────────────────────────────────── -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <span class="breadcrumb-sep">›</span>
        <a routerLink="/settings">Cadastros</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Notificações</span>
      </div>

      <!-- ── Page Header ───────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <div class="header-title-row">
            <h1>Modelos e Regras de Notificação</h1>
            <span class="badge-status">Canais conectados</span>
          </div>
          <p>Configure disparos automáticos de e-mail, alertas no navegador e webhooks para clientes e atendentes.</p>
        </div>

        <div class="page-header-actions">
          <button class="btn btn-secondary" (click)="sendTestNotification()" [disabled]="isSendingTest()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 2L2 6l4.5 1.5L8 12l4-10z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            {{ isSendingTest() ? 'Enviando teste...' : 'Enviar notificação de teste' }}
          </button>
          <button class="btn btn-yellow" (click)="saveAllSettings()">
            Salvar alterações
          </button>
        </div>
      </div>

      <!-- ── Toast de Feedback ─────────────────────────────────── -->
      @if (toastMessage()) {
        <div class="toast-alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ toastMessage() }}</span>
        </div>
      }

      <!-- ── Abas de Notificações ───────────────────────────────── -->
      <div class="notif-tabs-nav">
        <button
          class="notif-tab-btn"
          [class.active]="activeTab() === 'requester'"
          (click)="activeTab.set('requester')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 13a5.5 5.5 0 0111 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          Para o Solicitante (Cliente)
        </button>

        <button
          class="notif-tab-btn"
          [class.active]="activeTab() === 'agent'"
          (click)="activeTab.set('agent')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="2" y="3" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 5.5l5.5 4 5.5-4" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          Para o Atendente (Equipe)
        </button>

        <button
          class="notif-tab-btn"
          [class.active]="activeTab() === 'templates'"
          (click)="activeTab.set('templates')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M3 2h6l3 3v8H3V2z" stroke="currentColor" stroke-width="1.3"/>
            <path d="M9 2v3h3" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          Modelos de E-mail (Templates)
        </button>

        <button
          class="notif-tab-btn"
          [class.active]="activeTab() === 'channels'"
          (click)="activeTab.set('channels')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M13 7.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 7.5h11M7.5 2a9 9 0 010 11 9 9 0 010-11z" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          Canais & Integrações
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ABA 1 & 2: REGRAS DE NOTIFICAÇÃO (CLIENTE OU ATENDENTE)     -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'requester' || activeTab() === 'agent') {
        <div class="card table-card">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:40%">Gatilho de Evento</th>
                  <th style="width:20%;text-align:center">E-mail</th>
                  <th style="width:20%;text-align:center">No Sistema (In-App)</th>
                  <th style="width:20%;text-align:center">Push / Navegador</th>
                </tr>
              </thead>
              <tbody>
                @for (rule of (activeTab() === 'requester' ? requesterRules() : agentRules()); track rule.id) {
                  <tr>
                    <td>
                      <strong class="rule-title-cell">{{ rule.name }}</strong>
                      <p class="rule-desc-cell">{{ rule.description }}</p>
                    </td>
                    <td style="text-align:center">
                      <input type="checkbox" [(ngModel)]="rule.email" class="custom-checkbox" />
                    </td>
                    <td style="text-align:center">
                      <input type="checkbox" [(ngModel)]="rule.inApp" class="custom-checkbox" />
                    </td>
                    <td style="text-align:center">
                      <input type="checkbox" [(ngModel)]="rule.push" class="custom-checkbox" />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ABA 3: TEMPLATES DE E-MAIL                                  -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'templates') {
        <div class="templates-grid">
          <!-- Seletor e Configuração do Template -->
          <div class="card template-config-card">
            <h3>Personalizar Modelo</h3>

            <div class="form-group" style="margin-top:14px">
              <label class="form-label">Modelo Selecionado</label>
              <select class="form-select" [(ngModel)]="selectedTemplateKey">
                <option value="ticket_created">Abertura de chamado (Solicitante)</option>
                <option value="agent_replied">Nova resposta do suporte (Solicitante)</option>
                <option value="ticket_assigned">Chamado atribuído (Atendente)</option>
                <option value="ticket_resolved">Chamado resolvido com CSAT (Solicitante)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Assunto do E-mail</label>
              <input type="text" class="form-input" [(ngModel)]="templateSubject" />
            </div>

            <div class="form-group">
              <label class="form-label">Tags Dinâmicas Disponíveis</label>
              <div class="tags-cloud">
                <span class="tag-pill" (click)="insertTag('{{ ticket.protocol }}')">{{ '{{ ticket.protocol }}' }}</span>
                <span class="tag-pill" (click)="insertTag('{{ ticket.title }}')">{{ '{{ ticket.title }}' }}</span>
                <span class="tag-pill" (click)="insertTag('{{ user.name }}')">{{ '{{ user.name }}' }}</span>
                <span class="tag-pill" (click)="insertTag('{{ department.name }}')">{{ '{{ department.name }}' }}</span>
              </div>
            </div>
          </div>

          <!-- Prévia Visual do E-mail -->
          <div class="card email-preview-card">
            <div class="preview-bar">
              <span class="preview-dot" style="background:#EF4444"></span>
              <span class="preview-dot" style="background:#F59E0B"></span>
              <span class="preview-dot" style="background:#10B981"></span>
              <span class="preview-title">Pré-visualização do E-mail</span>
            </div>

            <div class="email-mockup-body">
              <div class="email-header">
                <div class="email-logo">
                  <span style="color:#FFC107">Support</span><span style="color:#FFFFFF">Flow</span>
                </div>
                <span class="email-protocol-tag">#HD-000128</span>
              </div>

              <div class="email-content">
                <h2>Seu chamado foi recebido com sucesso!</h2>
                <p>Olá, <strong>João Solicitante</strong>,</p>
                <p>Confirmamos a abertura do seu chamado na nossa central de atendimento. Nossa equipe operacional já está cuidando da sua solicitação.</p>

                <div class="email-ticket-box">
                  <div class="box-row">
                    <span class="box-lbl">Protocolo:</span>
                    <strong class="box-val">HD-000128</strong>
                  </div>
                  <div class="box-row">
                    <span class="box-lbl">Título:</span>
                    <strong class="box-val">Solicitação de acesso VPN para novo colaborador</strong>
                  </div>
                  <div class="box-row">
                    <span class="box-lbl">Departamento:</span>
                    <strong class="box-val">Tecnologia da Informação (TI)</strong>
                  </div>
                  <div class="box-row">
                    <span class="box-lbl">Prazo SLA:</span>
                    <strong class="box-val" style="color:#16A34A">Até 4 horas úteis</strong>
                  </div>
                </div>

                <div style="text-align:center;margin: 24px 0 12px">
                  <a class="email-cta-btn">Acessar chamado no portal</a>
                </div>

                <p class="email-footer-text">
                  Você pode acompanhar o andamento a qualquer momento respondendo a este e-mail ou acessando a plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ABA 4: CANAIS & INTEGRAÇÕES                                 -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'channels') {
        <div class="channels-grid">
          <!-- SMTP E-mail -->
          <div class="card channel-card">
            <div class="channel-top">
              <div class="channel-icon" style="background:#EFF6FF;color:#1D4ED8">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M2 6l8 5 8-5" stroke="currentColor" stroke-width="1.6"/>
                </svg>
              </div>
              <div class="channel-info">
                <h3>Servidor de Envio SMTP (E-mail)</h3>
                <p>Disparo corporativo via servidor seguro autenticado.</p>
              </div>
              <span class="badge badge-success">Conectado</span>
            </div>
            <div class="channel-body">
              <div class="meta-item">
                <span class="meta-label">Host:</span>
                <span class="meta-val">smtp.supportflow.local:587 (TLS)</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Remetente:</span>
                <span class="meta-val">suporte&#64;supportflow.local</span>
              </div>
            </div>
          </div>

          <!-- Webhooks / Slack / Teams -->
          <div class="card channel-card">
            <div class="channel-top">
              <div class="channel-icon" style="background:#FEF3C7;color:#B45309">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M7 10h6M10 7l3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="channel-info">
                <h3>Webhooks & Mensageiros (Slack / Teams)</h3>
                <p>Envio de eventos de incidentes críticos para canais de operações.</p>
              </div>
              <span class="badge badge-success">Ativo</span>
            </div>
            <div class="channel-body">
              <div class="meta-item">
                <span class="meta-label">Endpoint:</span>
                <span class="meta-val">https://hooks.slack.com/services/T00/B00/XXXX</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Eventos:</span>
                <span class="meta-val">Chamados Críticos, Violações de SLA</span>
              </div>
            </div>
          </div>

          <!-- Notificações Web Push -->
          <div class="card channel-card">
            <div class="channel-top">
              <div class="channel-icon" style="background:#F0FDF4;color:#15803D">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 7a5 5 0 00-10 0c0 4-2 5-2 5h14s-2-1-2-5M8.5 17a1.5 1.5 0 003 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="channel-info">
                <h3>Notificações no Navegador (Web Push)</h3>
                <p>Alertas sonoros e pop-ups visuais quando novos chamados chegarem na fila.</p>
              </div>
              <span class="badge badge-success">Permitido</span>
            </div>
            <div class="channel-body">
              <div class="meta-item">
                <span class="meta-label">Status no navegador:</span>
                <span class="meta-val">Notificações ativas neste dispositivo</span>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .notifications-page-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-status {
      font-size: 12px;
      font-weight: 600;
      color: #16A34A;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      padding: 2px 8px;
      border-radius: 99px;
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
      background-color: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #15803D;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from { transform: translateY(-8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* ── Abas ────────────────────────────────────────────── */
    .notif-tabs-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #E5E7EB;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .notif-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 14px;
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

    .notif-tab-btn:hover {
      color: #14213D;
      background: rgba(0,0,0,0.02);
    }

    .notif-tab-btn.active {
      color: #082B55;
      font-weight: 600;
      border-bottom-color: #FFC107;
    }

    /* ── Tabela de Regras ────────────────────────────────── */
    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .rule-title-cell {
      font-size: 13px;
      color: #14213D;
      display: block;
    }

    .rule-desc-cell {
      font-size: 11.5px;
      color: #64748B;
      margin: 2px 0 0;
    }

    .custom-checkbox {
      width: 17px;
      height: 17px;
      accent-color: #082B55;
      cursor: pointer;
    }

    /* ── Templates Layout ────────────────────────────────── */
    .templates-grid {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .template-config-card {
      flex: 1;
      min-width: 300px;
      padding: 20px;
    }

    .template-config-card h3 {
      font-size: 15px;
      font-weight: 700;
      color: #14213D;
      margin: 0;
    }

    .tags-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }

    .tag-pill {
      font-size: 11px;
      font-family: var(--font-family-mono);
      background: #F1F5F9;
      color: #082B55;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #E2E8F0;
      cursor: pointer;
      user-select: none;
    }

    .tag-pill:hover {
      background: #E2E8F0;
    }

    /* ── E-mail Preview Mockup ───────────────────────────── */
    .email-preview-card {
      flex: 1.3;
      min-width: 360px;
      padding: 0;
      overflow: hidden;
      background: #F8FAFC;
    }

    .preview-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      background: #EDF2F7;
      border-bottom: 1px solid #E2E8F0;
    }

    .preview-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .preview-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      margin-left: 6px;
    }

    .email-mockup-body {
      max-width: 480px;
      margin: 20px auto;
      background: #FFFFFF;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06);
      overflow: hidden;
      border: 1px solid #E5E7EB;
    }

    .email-header {
      background: #082B55;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .email-logo {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .email-protocol-tag {
      font-family: var(--font-family-mono);
      font-size: 11px;
      font-weight: 700;
      background: rgba(255,255,255,0.15);
      color: #FFC107;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .email-content {
      padding: 24px;
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
    }

    .email-content h2 {
      font-size: 16px;
      font-weight: 700;
      color: #14213D;
      margin: 0 0 12px;
    }

    .email-ticket-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px 14px;
      margin: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
    }

    .box-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    .box-lbl { color: #64748B; }
    .box-val { color: #14213D; }

    .email-cta-btn {
      display: inline-block;
      background: #FFC107;
      color: #082B55;
      font-weight: 700;
      font-size: 12.5px;
      padding: 10px 22px;
      border-radius: 6px;
      text-decoration: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    }

    .email-footer-text {
      font-size: 11.5px;
      color: #94A3B8;
      text-align: center;
      margin-top: 20px;
    }

    /* ── Canais ──────────────────────────────────────────── */
    .channels-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .channel-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .channel-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .channel-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .channel-info {
      flex: 1;
    }

    .channel-info h3 {
      font-size: 14px;
      font-weight: 700;
      color: #14213D;
      margin: 0;
    }

    .channel-info p {
      font-size: 12px;
      color: #64748B;
      margin: 2px 0 0;
    }

    .channel-body {
      display: flex;
      gap: 24px;
      padding-top: 10px;
      border-top: 1px solid #F1F5F9;
      font-size: 12px;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      gap: 6px;
    }

    .meta-label { color: #64748B; font-weight: 500; }
    .meta-val   { color: #14213D; font-weight: 600; font-family: var(--font-family-mono); }
  `]
})
export class SettingsNotificationsComponent implements OnInit {
  readonly activeTab = signal<'requester' | 'agent' | 'templates' | 'channels'>('requester');

  readonly requesterRules = signal<NotificationRule[]>([
    {
      id: 'req-created',
      name: 'Abertura de Chamado',
      description: 'Dispara quando um novo chamado é registrado no sistema com o número de protocolo.',
      email: true,
      inApp: true,
      push: false
    },
    {
      id: 'req-assigned',
      name: 'Chamado Atribuído a um Técnico',
      description: 'Informa ao solicitante que um especialista foi designado para seu atendimento.',
      email: true,
      inApp: true,
      push: true
    },
    {
      id: 'req-comment',
      name: 'Nova Resposta da Equipe de Suporte',
      description: 'Disparado quando um atendente adiciona uma resposta pública no ticket.',
      email: true,
      inApp: true,
      push: true
    },
    {
      id: 'req-resolved',
      name: 'Chamado Resolvido (com Pesquisa CSAT)',
      description: 'Notifica a solução do chamado e solicita a avaliação do atendimento.',
      email: true,
      inApp: true,
      push: false
    },
    {
      id: 'req-closed',
      name: 'Encerramento Definitivo',
      description: 'Confirma o encerramento do chamado após período de tolerância.',
      email: false,
      inApp: true,
      push: false
    }
  ]);

  readonly agentRules = signal<NotificationRule[]>([
    {
      id: 'agent-assigned',
      name: 'Chamado Atribuído a Você',
      description: 'Notifica imediatamente quando um chamado da fila é direcionado ao seu usuário.',
      email: true,
      inApp: true,
      push: true
    },
    {
      id: 'agent-customer-reply',
      name: 'Resposta do Solicitante',
      description: 'Avisa que o cliente respondeu a um chamado que estava aguardando retorno.',
      email: true,
      inApp: true,
      push: true
    },
    {
      id: 'agent-sla-warning',
      name: 'Alerta Preventivo de SLA (80% do prazo)',
      description: 'Emite aviso prioritário quando o chamado estiver a 20% do estouro da meta.',
      email: true,
      inApp: true,
      push: true
    },
    {
      id: 'agent-sla-breached',
      name: 'Violação de Prazo de SLA',
      description: 'Disparo de alta gravidade notificando estouro da meta estabelecida.',
      email: true,
      inApp: true,
      push: true
    }
  ]);

  // Template selector
  selectedTemplateKey = 'ticket_created';
  templateSubject = '[SupportFlow] Chamado #{{ ticket.protocol }} aberto com sucesso: {{ ticket.title }}';

  private readonly ticketService = inject(TicketService);

  readonly toastMessage = signal<string | null>(null);
  readonly isSendingTest = signal(false);

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.ticketService.getNotificationSettings().subscribe({
      next: (res) => {
        if (res.items && res.items.length > 0) {
          const req = res.items.filter((i: any) => i.recipientType === 'requester');
          const agt = res.items.filter((i: any) => i.recipientType === 'agent');

          if (req.length > 0) {
            this.requesterRules.update(list => list.map(item => {
              const matched = req.find((r: any) => r.eventKey === item.id);
              if (matched) {
                return { ...item, email: matched.email, inApp: matched.inApp, push: matched.push };
              }
              return item;
            }));
          }

          if (agt.length > 0) {
            this.agentRules.update(list => list.map(item => {
              const matched = agt.find((r: any) => r.eventKey === item.id);
              if (matched) {
                return { ...item, email: matched.email, inApp: matched.inApp, push: matched.push };
              }
              return item;
            }));
          }
        }
      },
      error: () => {}
    });
  }

  insertTag(tag: string): void {
    this.templateSubject += ` ${tag}`;
  }

  sendTestNotification(): void {
    this.isSendingTest.set(true);
    this.ticketService.sendTestNotification().subscribe({
      next: () => {
        this.isSendingTest.set(false);
        this.showToast('Notificação de teste disparada com sucesso para seu usuário!');
      },
      error: () => {
        this.isSendingTest.set(false);
        this.showToast('Erro ao disparar notificação de teste.');
      }
    });
  }

  saveAllSettings(): void {
    const all = [
      ...this.requesterRules().map(r => ({ id: r.id, email: r.email, inApp: r.inApp, push: r.push })),
      ...this.agentRules().map(r => ({ id: r.id, email: r.email, inApp: r.inApp, push: r.push }))
    ];

    this.ticketService.updateNotificationSettings(all).subscribe({
      next: () => {
        this.showToast('Preferências de notificação salvas no servidor!');
      },
      error: () => {
        this.showToast('Erro ao salvar preferências no servidor.');
      }
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
