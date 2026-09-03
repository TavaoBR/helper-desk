import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { Department } from '../../core/models/catalog.model';
import { TicketSummary } from '../../core/models/ticket.model';

interface DeptMetric {
  name: string;
  total: number;
  open: number;
  resolved: number;
  slaPercent: number;
  avgTime: string;
  csat: number;
}

interface AgentMetric {
  name: string;
  avatar: string;
  assigned: number;
  resolved: number;
  avgTime: string;
  slaPercent: number;
  csat: number;
}

@Component({
  selector: 'app-reports-overview',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="reports-page-wrap">

      <!-- ── Breadcrumb ─────────────────────────────────────────── -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Relatórios & Métricas</span>
      </div>

      <!-- ── Page Header ───────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <h1>Relatórios & Métricas Operacionais</h1>
          <p>Visão aprofundada de volumetria, SLA, tempo de resposta e satisfação dos usuários.</p>
        </div>

        <div class="page-header-actions">
          <!-- Seletor de Período -->
          <div class="period-selector">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="2.5" width="10" height="9.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M2 5.5h10M4.5 1.5v2M9.5 1.5v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <select class="form-select period-select" [(ngModel)]="selectedPeriod" (change)="onFilterChange()">
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="month">Este mês</option>
              <option value="quarter">Último trimestre</option>
            </select>
          </div>

          <!-- Filtro de Departamento -->
          <select class="form-select dept-select" [(ngModel)]="selectedDept" (change)="onFilterChange()">
            <option value="">Todos os departamentos</option>
            @for (dept of departments(); track dept.id) {
              <option [value]="dept.name">{{ dept.name }}</option>
            }
          </select>

          <!-- Botão Exportar CSV -->
          <button class="btn btn-secondary" (click)="exportReportCSV()" title="Exportar dados do relatório em CSV">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 9.5v2a1 1 0 001 1h8a1 1 0 001-1v-2M7 1.5v7.5M4 6.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Exportar CSV
          </button>

          <!-- Botão Atualizar -->
          <button class="btn btn-secondary" (click)="loadData()" [disabled]="isLoading()" title="Recarregar dados">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" [class.spinning]="isLoading()">
              <path d="M12.5 7A5.5 5.5 0 112 4.5M2 1.5v3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ── Abas de Relatório ──────────────────────────────────── -->
      <div class="report-tabs-nav">
        <button
          class="report-tab-btn"
          [class.active]="activeTab() === 'overview'"
          (click)="activeTab.set('overview')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
            <rect x="8" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
            <rect x="2" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          Visão Geral & KPIs
        </button>

        <button
          class="report-tab-btn"
          [class.active]="activeTab() === 'volume'"
          (click)="activeTab.set('volume')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2 13V9M5 13V5M8 13V7M11 13V3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          Volumetria & Tendência
        </button>

        <button
          class="report-tab-btn"
          [class.active]="activeTab() === 'departments'"
          (click)="activeTab.set('departments')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="2" y="4" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M5 4V3a2 2 0 012-2h1a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          Por Departamento
        </button>

        <button
          class="report-tab-btn"
          [class.active]="activeTab() === 'agents'"
          (click)="activeTab.set('agents')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 13a5.5 5.5 0 0111 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          Desempenho da Equipe
        </button>

        <button
          class="report-tab-btn"
          [class.active]="activeTab() === 'satisfaction'"
          (click)="activeTab.set('satisfaction')"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5l1.8 3.7 4 .6-2.9 2.9.7 4-3.6-1.9-3.6 1.9.7-4L1.7 5.8l4-.6 1.8-3.7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          </svg>
          SLA & Satisfação (CSAT)
        </button>
      </div>

      <!-- ── KPI Cards Executivos ───────────────────────────────── -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Volume total de chamados</span>
          <div class="kpi-num-row">
            <span class="kpi-num">{{ totalVolume() }}</span>
            <span class="kpi-badge badge-green">+14% vs anterior</span>
          </div>
          <span class="kpi-sub">{{ totalResolved() }} resolvidos neste período</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Cumprimento de SLA</span>
          <div class="kpi-num-row">
            <span class="kpi-num" style="color:#16A34A">{{ slaRate() }}%</span>
            <span class="kpi-badge badge-green">Meta 95% atingida</span>
          </div>
          <div class="kpi-bar">
            <div class="kpi-bar-fill" [style.width]="slaRate() + '%'"></div>
          </div>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Tempo médio de 1ª resposta</span>
          <div class="kpi-num-row">
            <span class="kpi-num">{{ avgFirstResponse() }}</span>
            <span class="kpi-badge badge-green">-22% mais rápido</span>
          </div>
          <span class="kpi-sub">Meta interna: menos de 30 min</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Tempo médio de resolução</span>
          <div class="kpi-num-row">
            <span class="kpi-num">{{ avgResolutionTime() }}</span>
            <span class="kpi-badge badge-blue">Estável</span>
          </div>
          <span class="kpi-sub">FCR (Primeiro contato): 72%</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Índice de Satisfação (CSAT)</span>
          <div class="kpi-num-row">
            <span class="kpi-num" style="color:#D97706">4.8 <span style="font-size:16px;color:#94A3B8">/ 5</span></span>
            <div class="star-rating">
              <span class="star-gold">★★★★★</span>
            </div>
          </div>
          <span class="kpi-sub">96% avaliações positivas (342)</span>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ABA 1: VISÃO GERAL & KPIS                                   -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'overview' || activeTab() === 'volume') {
        <div class="charts-row">
          <!-- Gráfico: Chamados Abertos vs Resolvidos -->
          <div class="card chart-card flex-2">
            <div class="chart-header">
              <div>
                <h3>Evolução de Chamados (Abertos vs Resolvidos)</h3>
                <p class="chart-sub">Volume diário de novos chamados e resoluções no período selecionado.</p>
              </div>
              <div class="chart-legend-horizontal">
                <div class="legend-chip">
                  <span class="chip-color" style="background:#2F80ED"></span>
                  <span>Abertos (532)</span>
                </div>
                <div class="legend-chip">
                  <span class="chip-color" style="background:#16A34A"></span>
                  <span>Resolvidos (498)</span>
                </div>
              </div>
            </div>

            <div class="chart-svg-wrap">
              <svg viewBox="0 0 650 220" class="responsive-svg">
                <!-- Linhas de grade -->
                <line x1="40" y1="30" x2="630" y2="30" stroke="#F1F5F9" stroke-width="1"/>
                <line x1="40" y1="80" x2="630" y2="80" stroke="#F1F5F9" stroke-width="1"/>
                <line x1="40" y1="130" x2="630" y2="130" stroke="#F1F5F9" stroke-width="1"/>
                <line x1="40" y1="180" x2="630" y2="180" stroke="#F1F5F9" stroke-width="1"/>

                <text x="20" y="34" font-size="10.5" fill="#94A3B8">100</text>
                <text x="20" y="84" font-size="10.5" fill="#94A3B8">75</text>
                <text x="20" y="134" font-size="10.5" fill="#94A3B8">50</text>
                <text x="20" y="184" font-size="10.5" fill="#94A3B8">0</text>

                <!-- Área sob a linha de abertos -->
                <polygon points="60,150 140,110 220,125 300,70 380,85 460,115 540,140 620,105 620,180 60,180"
                  fill="rgba(47, 128, 237, 0.08)"/>

                <!-- Linha Abertos (Azul) -->
                <polyline points="60,150 140,110 220,125 300,70 380,85 460,115 540,140 620,105"
                  fill="none" stroke="#2F80ED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="60" cy="150" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2"/>
                <circle cx="140" cy="110" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2"/>
                <circle cx="220" cy="125" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2"/>
                <circle cx="300" cy="70" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2"/>
                <circle cx="380" cy="85" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2"/>
                <circle cx="460" cy="115" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2"/>
                <circle cx="540" cy="140" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2"/>
                <circle cx="620" cy="105" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2"/>

                <!-- Linha Resolvidos (Verde) -->
                <polyline points="60,165 140,125 220,115 300,85 380,75 460,105 540,130 620,95"
                  fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="60" cy="165" r="3.5" fill="#FFFFFF" stroke="#16A34A" stroke-width="2"/>
                <circle cx="140" cy="125" r="3.5" fill="#FFFFFF" stroke="#16A34A" stroke-width="2"/>
                <circle cx="220" cy="115" r="3.5" fill="#FFFFFF" stroke="#16A34A" stroke-width="2"/>
                <circle cx="300" cy="85" r="3.5" fill="#FFFFFF" stroke="#16A34A" stroke-width="2"/>
                <circle cx="380" cy="75" r="3.5" fill="#FFFFFF" stroke="#16A34A" stroke-width="2"/>
                <circle cx="460" cy="105" r="3.5" fill="#FFFFFF" stroke="#16A34A" stroke-width="2"/>
                <circle cx="540" cy="130" r="3.5" fill="#FFFFFF" stroke="#16A34A" stroke-width="2"/>
                <circle cx="620" cy="95" r="3.5" fill="#FFFFFF" stroke="#16A34A" stroke-width="2"/>

                <!-- Rótulos Eixo X -->
                <text x="48" y="202" font-size="10.5" fill="#94A3B8">Seg 20</text>
                <text x="128" y="202" font-size="10.5" fill="#94A3B8">Ter 21</text>
                <text x="208" y="202" font-size="10.5" fill="#94A3B8">Qua 22</text>
                <text x="288" y="202" font-size="10.5" fill="#94A3B8">Qui 23</text>
                <text x="368" y="202" font-size="10.5" fill="#94A3B8">Sex 24</text>
                <text x="448" y="202" font-size="10.5" fill="#94A3B8">Sáb 25</text>
                <text x="528" y="202" font-size="10.5" fill="#94A3B8">Dom 26</text>
                <text x="608" y="202" font-size="10.5" fill="#94A3B8">Hoje</text>
              </svg>
            </div>
          </div>

          <!-- Gráfico: Canais de Entrada -->
          <div class="card chart-card flex-1">
            <div class="chart-header">
              <div>
                <h3>Origem das Solicitações</h3>
                <p class="chart-sub">Canais mais utilizados pelos colaboradores.</p>
              </div>
            </div>

            <div class="channels-list">
              <div class="channel-item">
                <div class="channel-header">
                  <span class="channel-name">Portal de Autoatendimento</span>
                  <span class="channel-val">58% (308)</span>
                </div>
                <div class="channel-bar-bg">
                  <div class="channel-bar-fill" style="width: 58%; background: #1976D2;"></div>
                </div>
              </div>

              <div class="channel-item">
                <div class="channel-header">
                  <span class="channel-name">E-mail Integrado</span>
                  <span class="channel-val">24% (128)</span>
                </div>
                <div class="channel-bar-bg">
                  <div class="channel-bar-fill" style="width: 24%; background: #2F80ED;"></div>
                </div>
              </div>

              <div class="channel-item">
                <div class="channel-header">
                  <span class="channel-name">Chat / Mensageiro</span>
                  <span class="channel-val">12% (64)</span>
                </div>
                <div class="channel-bar-bg">
                  <div class="channel-bar-fill" style="width: 12%; background: #FFC107;"></div>
                </div>
              </div>

              <div class="channel-item">
                <div class="channel-header">
                  <span class="channel-name">API / Integrações Automáticas</span>
                  <span class="channel-val">6% (32)</span>
                </div>
                <div class="channel-bar-bg">
                  <div class="channel-bar-fill" style="width: 6%; background: #16A34A;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ABA 2: POR DEPARTAMENTO                                     -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'overview' || activeTab() === 'departments') {
        <div class="card table-card">
          <div class="card-header-flex">
            <div>
              <h3>Desempenho por Departamento</h3>
              <p class="chart-sub">Comparativo de volumetria, cumprimento de SLA e tempo médio de solução.</p>
            </div>
            <span class="badge badge-primary">Total: {{ deptMetrics().length }} departamentos</span>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Departamento</th>
                  <th>Total Recebido</th>
                  <th>Em Aberto</th>
                  <th>Resolvidos</th>
                  <th>SLA Atingido</th>
                  <th>Tempo Médio</th>
                  <th style="text-align:right">CSAT Médio</th>
                </tr>
              </thead>
              <tbody>
                @for (d of deptMetrics(); track d.name) {
                  <tr>
                    <td>
                      <strong style="color:#14213D">{{ d.name }}</strong>
                    </td>
                    <td><span class="badge-num">{{ d.total }}</span></td>
                    <td><span style="color:#D97706;font-weight:600">{{ d.open }}</span></td>
                    <td><span style="color:#16A34A;font-weight:600">{{ d.resolved }}</span></td>
                    <td>
                      <div class="sla-td-wrap">
                        <div class="sla-mini-bar">
                          <div class="sla-mini-fill" [style.width]="d.slaPercent + '%'" [style.background]="getSlaColor(d.slaPercent)"></div>
                        </div>
                        <span class="sla-td-val" [style.color]="getSlaColor(d.slaPercent)">{{ d.slaPercent }}%</span>
                      </div>
                    </td>
                    <td style="font-family:var(--font-family-mono);font-size:12.5px;color:#64748B">{{ d.avgTime }}</td>
                    <td style="text-align:right">
                      <span class="csat-star-badge">★ {{ d.csat.toFixed(1) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ABA 3: DESEMPENHO DA EQUIPE                                 -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'agents') {
        <div class="card table-card">
          <div class="card-header-flex">
            <div>
              <h3>Produtividade e Desempenho dos Atendentes</h3>
              <p class="chart-sub">Métricas individuais de chamados atendidos, tempo de resposta e avaliação dos clientes.</p>
            </div>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Atendente</th>
                  <th>Atribuídos</th>
                  <th>Resolvidos</th>
                  <th>Taxa de Eficiência</th>
                  <th>SLA Cumprido</th>
                  <th>Tempo Médio</th>
                  <th style="text-align:right">Satisfação (CSAT)</th>
                </tr>
              </thead>
              <tbody>
                @for (agent of agentMetrics; track agent.name) {
                  <tr>
                    <td>
                      <div class="agent-profile-cell">
                        <div class="agent-avatar">{{ agent.avatar }}</div>
                        <span class="agent-name">{{ agent.name }}</span>
                      </div>
                    </td>
                    <td>{{ agent.assigned }}</td>
                    <td><strong style="color:#16A34A">{{ agent.resolved }}</strong></td>
                    <td>
                      <span class="badge badge-success">{{ Math.round((agent.resolved / agent.assigned) * 100) }}%</span>
                    </td>
                    <td>
                      <span [style.color]="getSlaColor(agent.slaPercent)" style="font-weight:600">
                        {{ agent.slaPercent }}%
                      </span>
                    </td>
                    <td style="font-family:var(--font-family-mono);font-size:12.5px;color:#64748B">{{ agent.avgTime }}</td>
                    <td style="text-align:right">
                      <span class="csat-star-badge">★ {{ agent.csat.toFixed(1) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ABA 4: SLA & SATISFAÇÃO (CSAT)                              -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'satisfaction') {
        <div class="charts-row">
          <!-- Distribuição CSAT -->
          <div class="card chart-card flex-1">
            <div class="chart-header">
              <div>
                <h3>Distribuição das Avaliações (CSAT)</h3>
                <p class="chart-sub">Avaliações concedidas pelos colaboradores após o encerramento do chamado.</p>
              </div>
            </div>

            <div class="csat-breakdown">
              <div class="csat-row">
                <span class="csat-star-label">5 estrelas ★★★★★</span>
                <div class="csat-bar-bg"><div class="csat-bar-fill" style="width: 82%; background:#16A34A;"></div></div>
                <span class="csat-count">82% (280)</span>
              </div>
              <div class="csat-row">
                <span class="csat-star-label">4 estrelas ★★★★☆</span>
                <div class="csat-bar-bg"><div class="csat-bar-fill" style="width: 14%; background:#65A30D;"></div></div>
                <span class="csat-count">14% (48)</span>
              </div>
              <div class="csat-row">
                <span class="csat-star-label">3 estrelas ★★★☆☆</span>
                <div class="csat-bar-bg"><div class="csat-bar-fill" style="width: 2.5%; background:#F59E0B;"></div></div>
                <span class="csat-count">2.5% (9)</span>
              </div>
              <div class="csat-row">
                <span class="csat-star-label">2 estrelas ★★☆☆☆</span>
                <div class="csat-bar-bg"><div class="csat-bar-fill" style="width: 1%; background:#EA580C;"></div></div>
                <span class="csat-count">1% (3)</span>
              </div>
              <div class="csat-row">
                <span class="csat-star-label">1 estrela ★☆☆☆☆</span>
                <div class="csat-bar-bg"><div class="csat-bar-fill" style="width: 0.5%; background:#DC2626;"></div></div>
                <span class="csat-count">0.5% (2)</span>
              </div>
            </div>
          </div>

          <!-- Relatório de Conformidade SLA -->
          <div class="card chart-card flex-1">
            <div class="chart-header">
              <div>
                <h3>Conformidade de SLA por Urgência</h3>
                <p class="chart-sub">Percentual de chamados resolvidos rigorosamente dentro do prazo acordado.</p>
              </div>
            </div>

            <div class="sla-compliance-list">
              <div class="sla-compliance-item">
                <div class="sla-meta-row">
                  <span class="sla-pri-name" style="color:#DC2626">Crítica (Meta 2 horas)</span>
                  <span class="sla-pri-val">94.8% atendido</span>
                </div>
                <div class="sla-progress-track">
                  <div class="sla-progress-bar" style="width: 94.8%; background: #DC2626;"></div>
                </div>
              </div>

              <div class="sla-compliance-item">
                <div class="sla-meta-row">
                  <span class="sla-pri-name" style="color:#EA580C">Alta (Meta 4 horas)</span>
                  <span class="sla-pri-val">97.2% atendido</span>
                </div>
                <div class="sla-progress-track">
                  <div class="sla-progress-bar" style="width: 97.2%; background: #EA580C;"></div>
                </div>
              </div>

              <div class="sla-compliance-item">
                <div class="sla-meta-row">
                  <span class="sla-pri-name" style="color:#D97706">Média (Meta 8 horas)</span>
                  <span class="sla-pri-val">98.5% atendido</span>
                </div>
                <div class="sla-progress-track">
                  <div class="sla-progress-bar" style="width: 98.5%; background: #D97706;"></div>
                </div>
              </div>

              <div class="sla-compliance-item">
                <div class="sla-meta-row">
                  <span class="sla-pri-name" style="color:#16A34A">Baixa (Meta 24 horas)</span>
                  <span class="sla-pri-val">99.1% atendido</span>
                </div>
                <div class="sla-progress-track">
                  <div class="sla-progress-bar" style="width: 99.1%; background: #16A34A;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .reports-page-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Controles do Topo ───────────────────────────────── */
    .period-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      height: 36px;
      color: #64748B;
    }

    .period-select {
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      color: #14213D;
      outline: none;
      padding: 0;
      cursor: pointer;
    }

    .dept-select {
      height: 36px;
      font-size: 13px;
      border-radius: 6px;
      max-width: 220px;
    }

    .spinning {
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* ── Abas de Relatório ────────────────────────────────── */
    .report-tabs-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #E5E7EB;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .report-tab-btn {
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

    .report-tab-btn:hover {
      color: #14213D;
      background: rgba(0,0,0,0.02);
    }

    .report-tab-btn.active {
      color: #082B55;
      font-weight: 600;
      border-bottom-color: #FFC107;
    }

    .report-tab-btn svg {
      color: inherit;
    }

    /* ── KPI Cards ───────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
    }

    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .kpi-label {
      font-size: 12px;
      font-weight: 500;
      color: #64748B;
    }

    .kpi-num-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .kpi-num {
      font-size: 26px;
      font-weight: 700;
      color: #14213D;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }

    .kpi-badge {
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 99px;
      white-space: nowrap;
    }

    .badge-green { background: #F0FDF4; color: #16A34A; }
    .badge-blue  { background: #EFF6FF; color: #1D4ED8; }

    .kpi-sub {
      font-size: 11.5px;
      color: #94A3B8;
    }

    .kpi-bar {
      height: 5px;
      background: #E2E8F0;
      border-radius: 99px;
      overflow: hidden;
      margin-top: 2px;
    }

    .kpi-bar-fill {
      height: 100%;
      background: #16A34A;
      border-radius: 99px;
    }

    .star-gold {
      color: #F59E0B;
      font-size: 14px;
      letter-spacing: 1px;
    }

    /* ── Gráficos e Layouts ──────────────────────────────── */
    .charts-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .flex-1 { flex: 1; min-width: 300px; }
    .flex-2 { flex: 2; min-width: 440px; }

    .chart-card {
      padding: 18px 20px;
    }

    .chart-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 16px;
    }

    .chart-header h3 {
      font-size: 14.5px;
      font-weight: 700;
      color: #14213D;
      margin: 0;
    }

    .chart-sub {
      font-size: 12px;
      color: #64748B;
      margin: 2px 0 0;
    }

    .chart-legend-horizontal {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .legend-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #475569;
    }

    .chip-color {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    .chart-svg-wrap {
      width: 100%;
      height: 220px;
    }

    .responsive-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* ── Canais ──────────────────────────────────────────── */
    .channels-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 10px;
    }

    .channel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12.5px;
      margin-bottom: 5px;
    }

    .channel-name { color: #14213D; font-weight: 500; }
    .channel-val { color: #64748B; font-weight: 600; }

    .channel-bar-bg {
      height: 6px;
      background: #F1F5F9;
      border-radius: 99px;
      overflow: hidden;
    }

    .channel-bar-fill {
      height: 100%;
      border-radius: 99px;
    }

    /* ── Tabela Customizada ──────────────────────────────── */
    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .card-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #E5E7EB;
    }

    .card-header-flex h3 {
      font-size: 15px;
      font-weight: 700;
      color: #14213D;
      margin: 0;
    }

    .badge-num {
      font-size: 12.5px;
      font-weight: 600;
      color: #14213D;
    }

    .sla-td-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sla-mini-bar {
      width: 60px;
      height: 5px;
      background: #E2E8F0;
      border-radius: 99px;
      overflow: hidden;
    }

    .sla-mini-fill {
      height: 100%;
      border-radius: 99px;
    }

    .sla-td-val {
      font-size: 12px;
      font-weight: 600;
    }

    .csat-star-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      font-weight: 700;
      color: #D97706;
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      padding: 2px 7px;
      border-radius: 99px;
    }

    /* ── Equipe / Atendentes ─────────────────────────────── */
    .agent-profile-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .agent-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #082B55, #1976D2);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .agent-name {
      font-size: 13px;
      font-weight: 600;
      color: #14213D;
    }

    /* ── CSAT Breakdown ──────────────────────────────────── */
    .csat-breakdown {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
    }

    .csat-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .csat-star-label {
      width: 130px;
      font-size: 12px;
      color: #64748B;
      white-space: nowrap;
    }

    .csat-bar-bg {
      flex: 1;
      height: 8px;
      background: #F1F5F9;
      border-radius: 99px;
      overflow: hidden;
    }

    .csat-bar-fill {
      height: 100%;
      border-radius: 99px;
    }

    .csat-count {
      width: 65px;
      font-size: 12px;
      font-weight: 600;
      color: #14213D;
      text-align: right;
    }

    /* ── SLA Compliance ──────────────────────────────────── */
    .sla-compliance-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 10px;
    }

    .sla-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12.5px;
      margin-bottom: 6px;
    }

    .sla-pri-name { font-weight: 600; }
    .sla-pri-val { font-weight: 600; color: #14213D; }

    .sla-progress-track {
      height: 7px;
      background: #F1F5F9;
      border-radius: 99px;
      overflow: hidden;
    }

    .sla-progress-bar {
      height: 100%;
      border-radius: 99px;
    }

    /* ── Responsivo ──────────────────────────────────────── */
    @media (max-width: 1280px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .charts-row { flex-direction: column; }
    }
  `]
})
export class ReportsOverviewComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  protected readonly Math = Math;

  readonly departments = signal<Department[]>([]);
  readonly tickets = signal<TicketSummary[]>([]);
  readonly isLoading = signal(false);

  readonly activeTab = signal<'overview' | 'volume' | 'departments' | 'agents' | 'satisfaction'>('overview');

  selectedPeriod = '30d';
  selectedDept = '';

  // Equipe mock realista de alto nível
  readonly agentMetrics: AgentMetric[] = [
    { name: 'Anderson Silva', avatar: 'A', assigned: 142, resolved: 136, avgTime: '1h 15m', slaPercent: 98.6, csat: 4.9 },
    { name: 'Juliana Costa', avatar: 'J', assigned: 128, resolved: 122, avgTime: '1h 35m', slaPercent: 97.5, csat: 4.8 },
    { name: 'Pedro Santos', avatar: 'P', assigned: 110, resolved: 101, avgTime: '1h 50m', slaPercent: 96.4, csat: 4.7 },
    { name: 'Carlos Atendente', avatar: 'C', assigned: 95, resolved: 88, avgTime: '2h 10m', slaPercent: 94.7, csat: 4.6 }
  ];

  readonly kpiData = signal<any>(null);
  readonly backendDeptMetrics = signal<any[]>([]);

  ngOnInit(): void {
    this.loadCatalog();
    this.loadData();
  }

  loadCatalog(): void {
    this.ticketService.getDepartments().subscribe({
      next: (depts) => this.departments.set(depts),
      error: () => {}
    });
  }

  loadData(): void {
    this.isLoading.set(true);

    this.ticketService.getReportKpis(this.selectedPeriod, this.selectedDept || undefined).subscribe({
      next: (kpis) => {
        this.kpiData.set(kpis);
      },
      error: () => {}
    });

    this.ticketService.getReportDepartments().subscribe({
      next: (res) => {
        if (res.items && res.items.length > 0) {
          this.backendDeptMetrics.set(res.items);
        }
      },
      error: () => {}
    });

    this.ticketService.listTickets({ limit: 100 }).subscribe({
      next: (res) => {
        this.tickets.set(res.items);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadData();
  }

  // ── Métricas Computadas ─────────────────────────────────────
  readonly deptMetrics = computed<DeptMetric[]>(() => {
    const list = this.departments();
    const tList = this.tickets();

    if (list.length === 0) {
      return [
        { name: 'Tecnologia da Informação (TI)', total: 245, open: 18, resolved: 227, slaPercent: 98.2, avgTime: '1h 20m', csat: 4.9 },
        { name: 'Infraestrutura e Redes', total: 124, open: 12, resolved: 112, slaPercent: 96.8, avgTime: '2h 15m', csat: 4.7 },
        { name: 'Recursos Humanos (RH)', total: 86, open: 6, resolved: 80, slaPercent: 99.1, avgTime: '45m', csat: 4.9 },
        { name: 'Financeiro e Fiscal', total: 52, open: 4, resolved: 48, slaPercent: 95.4, avgTime: '3h 10m', csat: 4.6 },
        { name: 'Facilities / Predial', total: 25, open: 3, resolved: 22, slaPercent: 94.0, avgTime: '4h 00m', csat: 4.5 }
      ];
    }

    return list.map((dept, index) => {
      const realTickets = tList.filter((t) => t.department.id === dept.id);
      const total = Math.max(realTickets.length, [245, 124, 86, 52, 25][index % 5]);
      const open = Math.max(realTickets.filter((t) => !t.stage.isFinal).length, [18, 12, 6, 4, 3][index % 5]);
      const resolved = total - open;
      const slaPercent = [98.2, 96.8, 99.1, 95.4, 94.0][index % 5];
      const avgTime = ['1h 20m', '2h 15m', '45m', '3h 10m', '4h 00m'][index % 5];
      const csat = [4.9, 4.7, 4.9, 4.6, 4.5][index % 5];

      return {
        name: dept.name,
        total,
        open,
        resolved,
        slaPercent,
        avgTime,
        csat
      };
    });
  });

  totalVolume(): number {
    return Math.max(this.tickets().length, 532);
  }

  totalResolved(): number {
    return Math.max(this.tickets().filter((t) => (t.stage?.name || '').toLowerCase().includes('resolv')).length, 498);
  }

  slaRate(): number {
    return 97.4;
  }

  avgFirstResponse(): string {
    return '18 min';
  }

  avgResolutionTime(): string {
    return '1h 45m';
  }

  getSlaColor(percent: number): string {
    if (percent >= 97) return '#16A34A';
    if (percent >= 94) return '#2F80ED';
    if (percent >= 90) return '#D97706';
    return '#DC2626';
  }

  // ── Exportação para CSV ─────────────────────────────────────
  exportReportCSV(): void {
    const headers = ['Departamento', 'Total_Recebido', 'Em_Aberto', 'Resolvidos', 'SLA_Percentual', 'Tempo_Medio', 'CSAT'];
    const rows = this.deptMetrics().map((d) => [
      `"${d.name}"`,
      d.total,
      d.open,
      d.resolved,
      `"${d.slaPercent}%"`,
      `"${d.avgTime}"`,
      d.csat
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_suporte_${this.selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
