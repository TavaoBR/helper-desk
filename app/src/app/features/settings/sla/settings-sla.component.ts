import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';

interface SlaTarget {
  priorityName: string;
  weight: number;
  badgeClass: string;
  dotClass: string;
  firstResponseTime: string;
  resolutionTime: string;
  businessHours: string;
}

interface SlaPolicy {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  active: boolean;
  targets: SlaTarget[];
}

@Component({
  selector: 'app-settings-sla',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="sla-page-wrap">

      <!-- ── Breadcrumb ─────────────────────────────────────────── -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <span class="breadcrumb-sep">›</span>
        <a routerLink="/settings">Cadastros</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Políticas de SLA</span>
      </div>

      <!-- ── Page Header ───────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <div class="header-title-row">
            <h1>Políticas de SLA (Nível de Serviço)</h1>
            <span class="badge-count">{{ activePoliciesCount() }} políticas ativas</span>
          </div>
          <p>Defina metas de tempo de primeira resposta e tempo de resolução por prioridade e calendário de atendimento.</p>
        </div>

        <div class="page-header-actions">
          <button class="btn btn-yellow" (click)="openNewModal()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Nova política
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

      <!-- ── KPIs de SLA ───────────────────────────────────────── -->
      <div class="sla-kpis-grid">
        <div class="sla-kpi-card">
          <span class="kpi-label">Meta Global de SLA</span>
          <strong class="kpi-num">95.0%</strong>
          <span class="kpi-sub">Acordo padrão da empresa</span>
        </div>

        <div class="sla-kpi-card">
          <span class="kpi-label">Desempenho Real Atual</span>
          <strong class="kpi-num" style="color:#16A34A">97.4%</strong>
          <span class="kpi-sub" style="color:#16A34A">▲ +2.4% acima da meta</span>
        </div>

        <div class="sla-kpi-card">
          <span class="kpi-label">Calendário Padrão</span>
          <strong class="kpi-num" style="font-size:20px">08h - 18h</strong>
          <span class="kpi-sub">Segunda a Sexta (Comercial)</span>
        </div>

        <div class="sla-kpi-card">
          <span class="kpi-label">Pausa Fora do Horário</span>
          <strong class="kpi-num" style="font-size:20px;color:#2F80ED">Ativada</strong>
          <span class="kpi-sub">SLA pausa à noite e fins de semana</span>
        </div>
      </div>

      <!-- ── Lista de Políticas ────────────────────────────────── -->
      <div class="policies-list">
        @for (policy of policies(); track policy.id) {
          <div class="policy-card">
            <div class="policy-header">
              <div class="policy-title-wrap">
                <div class="policy-badge-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M9 5v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <div class="policy-name-row">
                    <h3>{{ policy.name }}</h3>
                    @if (policy.isDefault) {
                      <span class="default-badge">Padrão Corporativo</span>
                    }
                  </div>
                  <p class="policy-desc">{{ policy.description }}</p>
                </div>
              </div>

              <div class="policy-actions">
                <button class="btn-ghost-sm" (click)="editPolicy(policy)">Editar metas</button>
                <button class="btn-ghost-sm" (click)="duplicatePolicy(policy)">Duplicar</button>
              </div>
            </div>

            <!-- Matriz de Prazos de SLA -->
            <div class="targets-table-wrap">
              <table class="targets-table">
                <thead>
                  <tr>
                    <th>Prioridade</th>
                    <th>Meta 1ª Resposta</th>
                    <th>Meta de Resolução</th>
                    <th>Calendário Operacional</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of policy.targets; track t.priorityName) {
                    <tr>
                      <td>
                        <span class="priority-badge" [class]="t.badgeClass">
                          <span class="priority-dot" [class]="t.dotClass"></span>
                          {{ t.priorityName }}
                        </span>
                      </td>
                      <td>
                        <strong class="time-highlight">{{ t.firstResponseTime }}</strong>
                      </td>
                      <td>
                        <strong class="time-highlight" style="color:#082B55">{{ t.resolutionTime }}</strong>
                      </td>
                      <td>
                        <span class="calendar-tag">{{ t.businessHours }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>

      <!-- ── Modal: Criar / Editar Política ────────────────────── -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingPolicyId ? 'Editar Política de SLA' : 'Nova Política de SLA' }}</h3>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nome da política <span style="color:#DC2626">*</span></label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Ex: Suporte VIP para Diretoria e Clientes Estratégicos"
                  [(ngModel)]="modalName"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Descrição da abrangência</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Ex: Aplica-se a solicitações abertas por contas estratégicas"
                  [(ngModel)]="modalDesc"
                />
              </div>

              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label class="form-label">Meta Resolução Crítica</label>
                  <input type="text" class="form-input" placeholder="Ex: 2 horas" [(ngModel)]="modalCritTime" />
                </div>
                <div class="form-group" style="flex:1">
                  <label class="form-label">Meta Resolução Alta</label>
                  <input type="text" class="form-input" placeholder="Ex: 4 horas" [(ngModel)]="modalHighTime" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label class="form-label">Meta Resolução Média</label>
                  <input type="text" class="form-input" placeholder="Ex: 8 horas" [(ngModel)]="modalMedTime" />
                </div>
                <div class="form-group" style="flex:1">
                  <label class="form-label">Meta Resolução Baixa</label>
                  <input type="text" class="form-input" placeholder="Ex: 24 horas" [(ngModel)]="modalLowTime" />
                </div>
              </div>

              <label class="checkbox-row">
                <input type="checkbox" [(ngModel)]="modalIsDefault" />
                <span>Definir como política padrão corporativa</span>
              </label>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button class="btn btn-yellow" [disabled]="!modalName.trim()" (click)="savePolicy()">
                Salvar política
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .sla-page-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-count {
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

    /* ── KPIs ────────────────────────────────────────────── */
    .sla-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .sla-kpi-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .kpi-label { font-size: 12px; color: #64748B; font-weight: 500; }
    .kpi-num   { font-size: 24px; font-weight: 700; color: #14213D; line-height: 1.1; }
    .kpi-sub   { font-size: 11.5px; color: #94A3B8; }

    /* ── Cards de Política ───────────────────────────────── */
    .policies-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .policy-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .policy-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .policy-title-wrap {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .policy-badge-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #EFF6FF;
      color: #1976D2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .policy-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .policy-name-row h3 {
      font-size: 15px;
      font-weight: 700;
      color: #14213D;
      margin: 0;
    }

    .default-badge {
      font-size: 11px;
      font-weight: 600;
      color: #082B55;
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      padding: 1px 7px;
      border-radius: 99px;
    }

    .policy-desc {
      font-size: 12.5px;
      color: #64748B;
      margin: 2px 0 0;
    }

    .policy-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-ghost-sm {
      background: none;
      border: none;
      font-size: 12.5px;
      font-weight: 500;
      color: #64748B;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.1s ease;
    }

    .btn-ghost-sm:hover {
      background: #F1F5F9;
      color: #14213D;
    }

    /* ── Tabela de Metas ─────────────────────────────────── */
    .targets-table-wrap {
      border: 1px solid #F1F5F9;
      border-radius: 6px;
      overflow: hidden;
    }

    .targets-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .targets-table th {
      background: #F8FAFC;
      padding: 8px 14px;
      text-align: left;
      font-size: 11.5px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .targets-table td {
      padding: 10px 14px;
      border-top: 1px solid #F1F5F9;
      color: #334155;
    }

    .time-highlight {
      font-family: var(--font-family-mono);
      font-size: 13px;
      color: #14213D;
    }

    .calendar-tag {
      font-size: 12px;
      color: #475569;
      background: #F1F5F9;
      padding: 2px 8px;
      border-radius: 4px;
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

    /* ── Modal ───────────────────────────────────────────── */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 16px;
    }

    .modal-card {
      background: #FFFFFF;
      border-radius: 10px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalPop 0.15s ease-out;
    }

    @keyframes modalPop {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #E5E7EB;
    }

    .modal-header h3 { font-size: 16px; font-weight: 700; color: #14213D; margin: 0; }
    .modal-close  { background: none; border: none; font-size: 16px; color: #94A3B8; cursor: pointer; }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row { display: flex; gap: 12px; }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #14213D;
      cursor: pointer;
      margin-top: 4px;
    }

    .checkbox-row input { accent-color: #082B55; }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      background: #F8FAFC;
      border-top: 1px solid #E5E7EB;
    }

    @media (max-width: 900px) {
      .sla-kpis-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class SettingsSlaComponent implements OnInit {
  readonly policies = signal<SlaPolicy[]>([
    {
      id: 'sla-default',
      name: 'Política Corporativa Geral',
      description: 'Acordo padrão aplicado a todos os chamados sem política específica configurada.',
      isDefault: true,
      active: true,
      targets: [
        {
          priorityName: 'Crítica / Urgente',
          weight: 100,
          badgeClass: 'priority-critical',
          dotClass: 'dot-critical',
          firstResponseTime: '15 minutos',
          resolutionTime: '2 horas',
          businessHours: '24/7 (Ininterrupto)'
        },
        {
          priorityName: 'Alta',
          weight: 80,
          badgeClass: 'priority-high',
          dotClass: 'dot-high',
          firstResponseTime: '30 minutos',
          resolutionTime: '4 horas',
          businessHours: 'Horário Comercial (08h - 18h)'
        },
        {
          priorityName: 'Média',
          weight: 50,
          badgeClass: 'priority-medium',
          dotClass: 'dot-medium',
          firstResponseTime: '2 horas',
          resolutionTime: '8 horas (1 dia)',
          businessHours: 'Horário Comercial (08h - 18h)'
        },
        {
          priorityName: 'Baixa',
          weight: 20,
          badgeClass: 'priority-low',
          dotClass: 'dot-low',
          firstResponseTime: '4 horas',
          resolutionTime: '24 horas (3 dias)',
          businessHours: 'Horário Comercial (08h - 18h)'
        }
      ]
    },
    {
      id: 'sla-vip',
      name: 'SLA Atendimento VIP / Diretoria',
      description: 'Prazos acelerados dedicados à diretoria, executivos e sistemas de faturamento crítico.',
      isDefault: false,
      active: true,
      targets: [
        {
          priorityName: 'Crítica / Urgente',
          weight: 100,
          badgeClass: 'priority-critical',
          dotClass: 'dot-critical',
          firstResponseTime: '10 minutos',
          resolutionTime: '1 hora',
          businessHours: '24/7 (Ininterrupto)'
        },
        {
          priorityName: 'Alta',
          weight: 80,
          badgeClass: 'priority-high',
          dotClass: 'dot-high',
          firstResponseTime: '15 minutos',
          resolutionTime: '2 horas',
          businessHours: '24/7 (Ininterrupto)'
        },
        {
          priorityName: 'Média',
          weight: 50,
          badgeClass: 'priority-medium',
          dotClass: 'dot-medium',
          firstResponseTime: '45 minutos',
          resolutionTime: '4 horas',
          businessHours: 'Horário Comercial (08h - 18h)'
        },
        {
          priorityName: 'Baixa',
          weight: 20,
          badgeClass: 'priority-low',
          dotClass: 'dot-low',
          firstResponseTime: '2 horas',
          resolutionTime: '12 horas',
          businessHours: 'Horário Comercial (08h - 18h)'
        }
      ]
    }
  ]);

  readonly toastMessage = signal<string | null>(null);

  // Modal
  readonly showModal = signal(false);
  editingPolicyId: string | null = null;
  modalName = '';
  modalDesc = '';
  modalCritTime = '2 horas';
  modalHighTime = '4 horas';
  modalMedTime = '8 horas';
  modalLowTime = '24 horas';
  modalIsDefault = false;

  private readonly ticketService = inject(TicketService);

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.ticketService.getSlaPolicies().subscribe({
      next: (res) => {
        if (res.items && res.items.length > 0) {
          const mapped = res.items.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            isDefault: p.isDefault,
            active: p.isActive,
            targets: (p.targets || []).map((t: any) => ({
              priorityName: t.priority?.name || 'Geral',
              weight: t.priority?.weight || 50,
              badgeClass: this.getBadgeClass(t.priority?.weight || 50),
              dotClass: this.getDotClass(t.priority?.weight || 50),
              firstResponseTime: this.formatMinutes(t.firstResponseMinutes),
              resolutionTime: this.formatMinutes(t.resolutionMinutes),
              businessHours: t.businessHoursType === 'calendar_24x7' ? '24/7 (Ininterrupto)' : 'Horário Comercial (08h - 18h)'
            }))
          }));
          this.policies.set(mapped);
        }
      },
      error: () => {}
    });
  }

  activePoliciesCount(): number {
    return this.policies().filter(p => p.active).length;
  }

  openNewModal(): void {
    this.editingPolicyId = null;
    this.modalName = '';
    this.modalDesc = '';
    this.modalCritTime = '2 horas';
    this.modalHighTime = '4 horas';
    this.modalMedTime = '8 horas';
    this.modalLowTime = '24 horas';
    this.modalIsDefault = false;
    this.showModal.set(true);
  }

  editPolicy(policy: SlaPolicy): void {
    this.editingPolicyId = policy.id;
    this.modalName = policy.name;
    this.modalDesc = policy.description;
    this.modalCritTime = policy.targets[0]?.resolutionTime || '2 horas';
    this.modalHighTime = policy.targets[1]?.resolutionTime || '4 horas';
    this.modalMedTime = policy.targets[2]?.resolutionTime || '8 horas';
    this.modalLowTime = policy.targets[3]?.resolutionTime || '24 horas';
    this.modalIsDefault = policy.isDefault;
    this.showModal.set(true);
  }

  duplicatePolicy(policy: SlaPolicy): void {
    this.ticketService.createSlaPolicy({
      name: `${policy.name} (Cópia)`,
      description: policy.description,
      isDefault: false
    }).subscribe({
      next: () => {
        this.loadPolicies();
        this.showToast(`Política duplicada com sucesso.`);
      },
      error: () => {
        this.showToast('Erro ao duplicar política no servidor.');
      }
    });
  }

  savePolicy(): void {
    if (!this.modalName.trim()) return;

    const payload = {
      name: this.modalName.trim(),
      description: this.modalDesc.trim(),
      isDefault: this.modalIsDefault
    };

    this.ticketService.createSlaPolicy(payload).subscribe({
      next: () => {
        this.loadPolicies();
        this.showToast(this.editingPolicyId ? 'Política atualizada com sucesso!' : 'Nova política de SLA criada e persistida!');
        this.closeModal();
      },
      error: () => {
        this.showToast('Erro ao salvar política no servidor.');
        this.closeModal();
      }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  private formatMinutes(mins: number): string {
    if (mins < 60) return `${mins} minutos`;
    const h = Math.round(mins / 60);
    if (h < 24) return `${h} hora${h > 1 ? 's' : ''}`;
    const d = Math.round(h / 24);
    return `${d} dia${d > 1 ? 's' : ''} (${h}h)`;
  }

  private getBadgeClass(weight: number): string {
    if (weight >= 90) return 'priority-badge priority-critical';
    if (weight >= 70) return 'priority-badge priority-high';
    if (weight >= 40) return 'priority-badge priority-medium';
    return 'priority-badge priority-low';
  }

  private getDotClass(weight: number): string {
    if (weight >= 90) return 'priority-dot dot-critical';
    if (weight >= 70) return 'priority-dot dot-high';
    if (weight >= 40) return 'priority-dot dot-medium';
    return 'priority-dot dot-low';
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
