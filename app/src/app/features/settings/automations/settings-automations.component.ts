import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { Department, Priority } from '../../../core/models/catalog.model';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'create' | 'stage' | 'sla' | 'assign';
  active: boolean;
  trigger: string;
  condition: string;
  action: string;
  runsCount: number;
}

@Component({
  selector: 'app-settings-automations',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="automations-page-wrap">

      <!-- ── Breadcrumb ─────────────────────────────────────────── -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <span class="breadcrumb-sep">›</span>
        <a routerLink="/settings">Cadastros</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Regras de automação</span>
      </div>

      <!-- ── Page Header ───────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <div class="header-title-row">
            <h1>Regras de Automação</h1>
            <span class="badge-count">{{ activeRulesCount() }} ativas</span>
          </div>
          <p>Configure gatilhos, condições e ações automáticas para acelerar a triagem e o atendimento.</p>
        </div>

        <div class="page-header-actions">
          <button class="btn btn-yellow" (click)="openNewModal()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Nova regra
          </button>
        </div>
      </div>

      <!-- ── Toast de Sucesso ──────────────────────────────────── -->
      @if (toastMessage()) {
        <div class="toast-alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ toastMessage() }}</span>
        </div>
      }

      <!-- ── Barra de Categorias e Busca ───────────────────────── -->
      <div class="filter-controls-bar">
        <div class="category-tabs">
          <button
            class="cat-tab-btn"
            [class.active]="selectedCategory() === 'all'"
            (click)="selectedCategory.set('all')"
          >
            Todas as regras
            <span class="cat-pill">{{ rules().length }}</span>
          </button>
          <button
            class="cat-tab-btn"
            [class.active]="selectedCategory() === 'create'"
            (click)="selectedCategory.set('create')"
          >
            Criação de chamados
          </button>
          <button
            class="cat-tab-btn"
            [class.active]="selectedCategory() === 'assign'"
            (click)="selectedCategory.set('assign')"
          >
            Atribuição automática
          </button>
          <button
            class="cat-tab-btn"
            [class.active]="selectedCategory() === 'stage'"
            (click)="selectedCategory.set('stage')"
          >
            Mudança de etapa
          </button>
          <button
            class="cat-tab-btn"
            [class.active]="selectedCategory() === 'sla'"
            (click)="selectedCategory.set('sla')"
          >
            SLA & Escalonamento
          </button>
        </div>

        <div class="search-input-wrap">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#94A3B8" stroke-width="1.3"/>
            <path d="M9.5 9.5l3 3" stroke="#94A3B8" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por nome ou ação..."
            [(ngModel)]="searchQuery"
          />
        </div>
      </div>

      <!-- ── Lista de Cards de Regras ──────────────────────────── -->
      <div class="rules-grid">
        @for (rule of filteredRules(); track rule.id) {
          <div class="rule-card" [class.rule-disabled]="!rule.active">
            <!-- Topo do Card: Nome e Toggle -->
            <div class="rule-card-header">
              <div class="rule-title-group">
                <div class="rule-icon-wrap" [class.icon-active]="rule.active">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2l2 4 4.5.7-3.2 3.1.8 4.4L9 12.1 4.9 14.2l.8-4.4L2.5 6.7 7 6l2-4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 class="rule-name">{{ rule.name }}</h3>
                  <p class="rule-desc">{{ rule.description }}</p>
                </div>
              </div>

              <!-- Toggle Ativo/Inativo -->
              <div class="toggle-wrap">
                <label class="switch-toggle" [title]="rule.active ? 'Regra ativa' : 'Regra pausada'">
                  <input
                    type="checkbox"
                    [checked]="rule.active"
                    (change)="toggleRule(rule)"
                  />
                  <span class="slider"></span>
                </label>
                <span class="toggle-status" [class.status-on]="rule.active">
                  {{ rule.active ? 'Ativa' : 'Pausada' }}
                </span>
              </div>
            </div>

            <!-- Blocos de Fluxo (Quando ➔ Se ➔ Então) -->
            <div class="workflow-flow-blocks">
              <div class="flow-block">
                <span class="flow-badge trigger-badge">QUANDO</span>
                <span class="flow-text">{{ rule.trigger }}</span>
              </div>

              <div class="flow-connector">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <div class="flow-block">
                <span class="flow-badge condition-badge">SE</span>
                <span class="flow-text">{{ rule.condition }}</span>
              </div>

              <div class="flow-connector">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <div class="flow-block">
                <span class="flow-badge action-badge">ENTÃO</span>
                <span class="flow-text action-text">{{ rule.action }}</span>
              </div>
            </div>

            <!-- Rodapé do Card: Execuções e Ações -->
            <div class="rule-card-footer">
              <div class="rule-stats">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M6.5 3.5V6.5L8.5 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                <span>Executada <strong>{{ rule.runsCount }} vezes</strong> nos últimos 30 dias</span>
              </div>

              <div class="rule-actions">
                <button class="btn-ghost-sm" (click)="duplicateRule(rule)" title="Duplicar regra">
                  Duplicar
                </button>
                <button class="btn-ghost-sm" (click)="editRule(rule)" title="Editar configurações">
                  Editar
                </button>
                <button class="btn-ghost-sm btn-danger-ghost" (click)="deleteRule(rule)" title="Excluir regra">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-rules">
            <p>Nenhuma regra de automação encontrada para os filtros atuais.</p>
          </div>
        }
      </div>

      <!-- ── Modal: Nova / Editar Regra ───────────────────────── -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingRuleId ? 'Editar Regra de Automação' : 'Criar Nova Regra de Automação' }}</h3>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nome da regra <span style="color:#DC2626">*</span></label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Ex: Escalonamento automático de incidentes críticos"
                  [(ngModel)]="modalName"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Descrição operacional</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Breve explicação do objetivo desta regra"
                  [(ngModel)]="modalDesc"
                />
              </div>

              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label class="form-label">Categoria</label>
                  <select class="form-select" [(ngModel)]="modalCategory">
                    <option value="create">Criação de chamados</option>
                    <option value="assign">Atribuição automática</option>
                    <option value="stage">Mudança de etapa</option>
                    <option value="sla">SLA & Escalonamento</option>
                  </select>
                </div>

                <div class="form-group" style="flex:1">
                  <label class="form-label">Gatilho (Quando)</label>
                  <select class="form-select" [(ngModel)]="modalTrigger">
                    <option value="Novo chamado é criado">Novo chamado é criado</option>
                    <option value="Chamado entra na fila">Chamado entra na fila</option>
                    <option value="Sem resposta há mais de 2 horas">Sem resposta há mais de 2 horas</option>
                    <option value="Status alterado para Resolvido">Status alterado para Resolvido</option>
                    <option value="SLA atinge 80% do prazo">SLA atinge 80% do prazo</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Condição (Se)</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Ex: Departamento é TI e Prioridade é Crítica"
                  [(ngModel)]="modalCondition"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Ação resultante (Então)</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Ex: Notificar equipe e aplicar prazo de 2 horas"
                  [(ngModel)]="modalAction"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button class="btn btn-yellow" [disabled]="!modalName.trim()" (click)="saveRule()">
                {{ editingRuleId ? 'Salvar alterações' : 'Criar regra' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .automations-page-wrap {
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

    /* ── Controles de Filtro ─────────────────────────────── */
    .filter-controls-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 8px 14px;
    }

    .category-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      overflow-x: auto;
    }

    .cat-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      font-size: 12.5px;
      font-weight: 500;
      color: #64748B;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.12s ease;
      white-space: nowrap;
      font-family: inherit;
    }

    .cat-tab-btn:hover {
      background: #F1F5F9;
      color: #14213D;
    }

    .cat-tab-btn.active {
      background: #082B55;
      color: #FFFFFF;
      font-weight: 600;
    }

    .cat-pill {
      font-size: 10.5px;
      padding: 1px 5px;
      border-radius: 99px;
      background: rgba(255,255,255,0.25);
    }

    .search-input-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      background: #F8FAFC;
      height: 34px;
      min-width: 220px;
    }

    .search-input {
      border: none;
      background: transparent;
      font-size: 12.5px;
      color: #14213D;
      outline: none;
      width: 100%;
      font-family: inherit;
    }

    /* ── Grade de Cards de Regras ────────────────────────── */
    .rules-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .rule-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .rule-card:hover {
      border-color: #CBD5E1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }

    .rule-disabled {
      opacity: 0.65;
      background: #FAFBFD;
    }

    .rule-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .rule-title-group {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .rule-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #F1F5F9;
      color: #64748B;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-active {
      background: #FEF3C7;
      color: #B45309;
    }

    .rule-name {
      font-size: 14.5px;
      font-weight: 700;
      color: #14213D;
      margin: 0;
    }

    .rule-desc {
      font-size: 12.5px;
      color: #64748B;
      margin: 2px 0 0;
    }

    /* ── Toggle Switch ───────────────────────────────────── */
    .toggle-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .switch-toggle {
      position: relative;
      display: inline-block;
      width: 38px;
      height: 20px;
    }

    .switch-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #CBD5E1;
      transition: .2s;
      border-radius: 20px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #16A34A;
    }

    input:checked + .slider:before {
      transform: translateX(18px);
    }

    .toggle-status {
      font-size: 12px;
      font-weight: 600;
      color: #94A3B8;
      min-width: 44px;
    }

    .status-on {
      color: #16A34A;
    }

    /* ── Blocos de Fluxo (When / If / Then) ───────────────── */
    .workflow-flow-blocks {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      background: #F8FAFC;
      border: 1px solid #F1F5F9;
      border-radius: 6px;
      padding: 10px 14px;
    }

    .flow-block {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .flow-badge {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .trigger-badge   { background: #EFF6FF; color: #1D4ED8; border: 1px solid #DBEAFE; }
    .condition-badge { background: #FFFBEB; color: #B45309; border: 1px solid #FEF3C7; }
    .action-badge    { background: #F0FDF4; color: #15803D; border: 1px solid #DCFCE7; }

    .flow-text {
      font-size: 12.5px;
      color: #334155;
      font-weight: 500;
    }

    .action-text {
      font-weight: 600;
      color: #0F172A;
    }

    .flow-connector {
      display: flex;
      align-items: center;
      color: #94A3B8;
    }

    /* ── Rodapé do Card ──────────────────────────────────── */
    .rule-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #F1F5F9;
      padding-top: 12px;
      font-size: 12px;
    }

    .rule-stats {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748B;
    }

    .rule-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-ghost-sm {
      background: none;
      border: none;
      font-size: 12px;
      font-weight: 500;
      color: #64748B;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.1s ease;
    }

    .btn-ghost-sm:hover {
      background: #F1F5F9;
      color: #14213D;
    }

    .btn-danger-ghost:hover {
      background: #FEF2F2;
      color: #DC2626;
    }

    .empty-rules {
      text-align: center;
      padding: 40px;
      background: #FFFFFF;
      border: 1px dashed #CBD5E1;
      border-radius: 8px;
      color: #64748B;
      font-size: 13.5px;
    }

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
      max-width: 540px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
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

    .modal-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: #14213D;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 16px;
      color: #94A3B8;
      cursor: pointer;
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      background: #F8FAFC;
      border-top: 1px solid #E5E7EB;
    }
  `]
})
export class SettingsAutomationsComponent implements OnInit {
  private readonly ticketService = inject(TicketService);

  readonly rules = signal<AutomationRule[]>([
    {
      id: 'rule-1',
      name: 'Triagem Rápida: Atribuir TI Incidentes Críticos',
      description: 'Atribui chamados urgentes para o coordenador de infraestrutura e reduz meta de SLA.',
      category: 'create',
      active: true,
      trigger: 'Novo chamado criado',
      condition: 'Departamento = TI E Prioridade = Crítica',
      action: 'Definir SLA = 2h e Notificar equipe via E-mail / Slack',
      runsCount: 142
    },
    {
      id: 'rule-2',
      name: 'Autoatribuição Round-Robin para Suporte Geral',
      description: 'Distribui chamados da fila geral entre os atendentes online proporcionalmente.',
      category: 'assign',
      active: true,
      trigger: 'Chamado sem atendente após 10 minutos',
      condition: 'Fila = Suporte Geral E Status = Triagem',
      action: 'Atribuir ao próximo atendente disponível em rodízio',
      runsCount: 389
    },
    {
      id: 'rule-3',
      name: 'Escalonamento Preventivo de Violação de SLA',
      description: 'Emite alerta sonoro e notificação ao gestor quando 80% do tempo de resposta for consumido.',
      category: 'sla',
      active: true,
      trigger: '80% do tempo limite de SLA atingido',
      condition: 'Chamado ainda não respondido',
      action: 'Adicionar tag #Urgente e Notificar gestor do departamento',
      runsCount: 67
    },
    {
      id: 'rule-4',
      name: 'Encerramento Automático de Chamados Resolvidos',
      description: 'Fecha o chamado definitivamente após 48 horas de inatividade após resolução.',
      category: 'stage',
      active: true,
      trigger: '48 horas após status "Resolvido"',
      condition: 'Sem novas respostas do solicitante',
      action: 'Mudar status para "Fechado" e Disparar pesquisa CSAT',
      runsCount: 512
    },
    {
      id: 'rule-5',
      name: 'Retomada Automática ao Receber Resposta',
      description: 'Devolve o chamado para a fila de atendimento assim que o cliente comenta.',
      category: 'stage',
      active: false,
      trigger: 'Novo comentário do solicitante',
      condition: 'Status = "Aguardando Solicitante"',
      action: 'Mudar status para "Em Atendimento" e Notificar atendente',
      runsCount: 94
    }
  ]);

  readonly selectedCategory = signal<string>('all');
  searchQuery = '';

  readonly toastMessage = signal<string | null>(null);

  // Modal
  readonly showModal = signal(false);
  editingRuleId: string | null = null;
  modalName = '';
  modalDesc = '';
  modalCategory: 'create' | 'assign' | 'stage' | 'sla' = 'create';
  modalTrigger = 'Novo chamado é criado';
  modalCondition = '';
  modalAction = '';

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.ticketService.getAutomationRules().subscribe({
      next: (res) => {
        if (res.items && res.items.length > 0) {
          const mapped = res.items.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description || '',
            category: r.category,
            active: r.active,
            trigger: r.triggerEvent,
            condition: r.conditionText,
            action: r.actionText,
            runsCount: r.runsCount || 0
          }));
          this.rules.set(mapped);
        }
      },
      error: () => {}
    });
  }

  activeRulesCount(): number {
    return this.rules().filter(r => r.active).length;
  }

  filteredRules(): AutomationRule[] {
    let list = this.rules();

    if (this.selectedCategory() !== 'all') {
      list = list.filter(r => r.category === this.selectedCategory());
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q)
      );
    }

    return list;
  }

  toggleRule(rule: AutomationRule): void {
    this.ticketService.toggleAutomationRule(rule.id).subscribe({
      next: (res) => {
        this.rules.update(list =>
          list.map(r => r.id === rule.id ? { ...r, active: res.active } : r)
        );
        this.showToast(res.active ? `Regra "${rule.name}" ativada!` : `Regra "${rule.name}" pausada.`);
      },
      error: () => {
        this.showToast('Erro ao alternar status da regra.');
      }
    });
  }

  openNewModal(): void {
    this.editingRuleId = null;
    this.modalName = '';
    this.modalDesc = '';
    this.modalCategory = 'create';
    this.modalTrigger = 'Novo chamado é criado';
    this.modalCondition = 'Departamento = TI';
    this.modalAction = 'Definir prioridade como Alta';
    this.showModal.set(true);
  }

  editRule(rule: AutomationRule): void {
    this.editingRuleId = rule.id;
    this.modalName = rule.name;
    this.modalDesc = rule.description;
    this.modalCategory = rule.category;
    this.modalTrigger = rule.trigger;
    this.modalCondition = rule.condition;
    this.modalAction = rule.action;
    this.showModal.set(true);
  }

  duplicateRule(rule: AutomationRule): void {
    this.ticketService.createAutomationRule({
      name: `${rule.name} (Cópia)`,
      description: rule.description,
      category: rule.category,
      triggerEvent: rule.trigger,
      conditionText: rule.condition,
      actionText: rule.action,
      active: false
    }).subscribe({
      next: () => {
        this.loadRules();
        this.showToast(`Regra duplicada com sucesso.`);
      },
      error: () => {
        this.showToast('Erro ao duplicar regra.');
      }
    });
  }

  deleteRule(rule: AutomationRule): void {
    this.ticketService.deleteAutomationRule(rule.id).subscribe({
      next: () => {
        this.rules.update(list => list.filter(r => r.id !== rule.id));
        this.showToast(`Regra "${rule.name}" removida com sucesso.`);
      },
      error: () => {
        this.showToast('Erro ao remover regra no servidor.');
      }
    });
  }

  saveRule(): void {
    if (!this.modalName.trim()) return;

    const payload = {
      name: this.modalName.trim(),
      description: this.modalDesc.trim(),
      category: this.modalCategory,
      triggerEvent: this.modalTrigger,
      conditionText: this.modalCondition,
      actionText: this.modalAction,
      active: true
    };

    if (this.editingRuleId) {
      this.ticketService.updateAutomationRule(this.editingRuleId, payload).subscribe({
        next: () => {
          this.loadRules();
          this.showToast('Regra de automação atualizada com sucesso!');
          this.closeModal();
        },
        error: () => {
          this.showToast('Erro ao atualizar regra no servidor.');
          this.closeModal();
        }
      });
    } else {
      this.ticketService.createAutomationRule(payload).subscribe({
        next: () => {
          this.loadRules();
          this.showToast('Nova regra criada e ativada no servidor!');
          this.closeModal();
        },
        error: () => {
          this.showToast('Erro ao criar regra no servidor.');
          this.closeModal();
        }
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
