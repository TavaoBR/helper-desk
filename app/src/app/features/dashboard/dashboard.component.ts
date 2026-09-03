import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { TicketSummary } from '../../core/models/ticket.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard-wrap">

      <!-- ── Header do Dashboard ───────────────────────────────── -->
      <div class="page-header">
        <div>
          <h1>Bom dia, {{ firstName() }}! 👋</h1>
          <p>Aqui está o resumo dos chamados e atendimentos.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Filtros
          </button>
          <a routerLink="/tickets/new" class="btn btn-yellow">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Novo chamado
          </a>
        </div>
      </div>

      <!-- ── Cards de Indicadores (KPIs) ────────────────────────── -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total de chamados</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ totalCount() }}</span>
          </div>
          <div class="kpi-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>12% vs mês anterior</span>
          </div>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Abertos</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ openCount() }}</span>
          </div>
          <div class="kpi-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>8% vs mês anterior</span>
          </div>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Em atendimento</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ attendingCount() }}</span>
          </div>
          <div class="kpi-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>5% vs mês anterior</span>
          </div>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Aguardando usuário</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ waitingCount() }}</span>
          </div>
          <div class="kpi-trend trend-down">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>3% vs mês anterior</span>
          </div>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Resolvidos (mês)</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ resolvedCount() }}</span>
          </div>
          <div class="kpi-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>18% vs mês anterior</span>
          </div>
        </div>
      </div>

      <!-- ── Gráficos: Status (Donut) & Período (Linha) ─────────── -->
      <div class="charts-grid">

        <!-- Gráfico de Donut: Chamados por status -->
        <div class="card chart-card">
          <div class="card-header-clean">
            <h3>Chamados por status</h3>
          </div>
          <div class="donut-chart-container">
            <div class="donut-svg-wrap">
              <svg viewBox="0 0 160 160" class="donut-svg">
                <!-- Círculos do donut -->
                <circle cx="80" cy="80" r="54" fill="transparent" stroke="#E2E8F0" stroke-width="20" />
                <circle cx="80" cy="80" r="54" fill="transparent" stroke="#1976D2" stroke-width="20"
                  stroke-dasharray="110 230" stroke-dashoffset="0" />
                <circle cx="80" cy="80" r="54" fill="transparent" stroke="#2F80ED" stroke-width="20"
                  stroke-dasharray="70 270" stroke-dashoffset="-115" />
                <circle cx="80" cy="80" r="54" fill="transparent" stroke="#FFC107" stroke-width="20"
                  stroke-dasharray="45 295" stroke-dashoffset="-190" />
                <circle cx="80" cy="80" r="54" fill="transparent" stroke="#EA580C" stroke-width="20"
                  stroke-dasharray="25 315" stroke-dashoffset="-240" />
                <circle cx="80" cy="80" r="54" fill="transparent" stroke="#16A34A" stroke-width="20"
                  stroke-dasharray="80 260" stroke-dashoffset="-270" />
              </svg>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background:#1976D2"></span>
                <span class="legend-name">Abertos</span>
                <span class="legend-val">128 (24%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background:#2F80ED"></span>
                <span class="legend-name">Em atendimento</span>
                <span class="legend-val">78 (15%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background:#FFC107"></span>
                <span class="legend-name">Aguardando usuário</span>
                <span class="legend-val">36 (7%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background:#EA580C"></span>
                <span class="legend-name">Aguardando terceiro</span>
                <span class="legend-val">22 (4%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background:#16A34A"></span>
                <span class="legend-name">Resolvidos</span>
                <span class="legend-val">290 (55%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background:#64748B"></span>
                <span class="legend-name">Fechados</span>
                <span class="legend-val">76 (14%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráfico de Linha: Chamados por período -->
        <div class="card chart-card">
          <div class="card-header-clean">
            <h3>Chamados por período</h3>
            <span class="chart-period-badge">Últimos 7 dias ▾</span>
          </div>
          <div class="line-chart-container">
            <svg viewBox="0 0 500 200" class="line-svg">
              <!-- Grid horizontal -->
              <line x1="30" y1="30" x2="480" y2="30" stroke="#F1F5F9" stroke-width="1" />
              <line x1="30" y1="75" x2="480" y2="75" stroke="#F1F5F9" stroke-width="1" />
              <line x1="30" y1="120" x2="480" y2="120" stroke="#F1F5F9" stroke-width="1" />
              <line x1="30" y1="165" x2="480" y2="165" stroke="#F1F5F9" stroke-width="1" />

              <text x="15" y="34" font-size="10" fill="#94A3B8">100</text>
              <text x="15" y="79" font-size="10" fill="#94A3B8">80</text>
              <text x="15" y="124" font-size="10" fill="#94A3B8">40</text>
              <text x="15" y="169" font-size="10" fill="#94A3B8">0</text>

              <!-- Área sob a linha -->
              <polygon points="50,140 115,110 180,118 245,75 310,80 375,120 440,145 440,165 50,165"
                fill="rgba(47, 128, 237, 0.08)" />

              <!-- Linha do gráfico -->
              <polyline points="50,140 115,110 180,118 245,75 310,80 375,120 440,145"
                fill="none" stroke="#2F80ED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

              <!-- Pontos -->
              <circle cx="50" cy="140" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2" />
              <circle cx="115" cy="110" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2" />
              <circle cx="180" cy="118" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2" />
              <circle cx="245" cy="75" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2" />
              <circle cx="310" cy="80" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2" />
              <circle cx="375" cy="120" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2" />
              <circle cx="440" cy="145" r="4" fill="#FFFFFF" stroke="#2F80ED" stroke-width="2" />

              <!-- Labels eixo X -->
              <text x="36" y="185" font-size="10.5" fill="#94A3B8">20/05</text>
              <text x="101" y="185" font-size="10.5" fill="#94A3B8">21/05</text>
              <text x="166" y="185" font-size="10.5" fill="#94A3B8">22/05</text>
              <text x="231" y="185" font-size="10.5" fill="#94A3B8">23/05</text>
              <text x="296" y="185" font-size="10.5" fill="#94A3B8">24/05</text>
              <text x="361" y="185" font-size="10.5" fill="#94A3B8">25/05</text>
              <text x="426" y="185" font-size="10.5" fill="#94A3B8">26/05</text>
            </svg>
          </div>
        </div>

      </div>

      <!-- ── Linha Inferior: Filas, Tempo médio, SLA, Satisfação ─── -->
      <div class="bottom-metrics-grid">

        <!-- Fila com mais demanda -->
        <div class="card mini-metric-card">
          <span class="mini-card-title">Fila com mais demanda</span>
          <div class="demand-list">
            <div class="demand-item">
              <span class="demand-name">TI - Suporte Técnico</span>
              <strong class="demand-count">45</strong>
            </div>
            <div class="demand-item">
              <span class="demand-name">Infraestrutura</span>
              <strong class="demand-count">32</strong>
            </div>
            <div class="demand-item">
              <span class="demand-name">Sistemas</span>
              <strong class="demand-count">18</strong>
            </div>
            <div class="demand-item">
              <span class="demand-name">Equipamentos</span>
              <strong class="demand-count">12</strong>
            </div>
          </div>
        </div>

        <!-- Tempo médio de atendimento -->
        <div class="card mini-metric-card">
          <span class="mini-card-title">Tempo médio de atendimento</span>
          <div class="mini-card-body-row">
            <div>
              <span class="mini-card-big-val">1h 45m</span>
              <div class="kpi-trend trend-up" style="margin-top: 6px;">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>10% vs mês anterior</span>
              </div>
            </div>
            <div class="metric-icon-box" style="background:#EFF6FF;color:#2F80ED">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- SLA em risco -->
        <div class="card mini-metric-card">
          <span class="mini-card-title">SLA em risco</span>
          <div class="mini-card-body-row">
            <div>
              <span class="mini-card-big-val" style="color:#DC2626">14</span>
              <div style="margin-top: 6px;">
                <a routerLink="/tickets" class="link-small">Ver chamados →</a>
              </div>
            </div>
            <div class="metric-icon-box" style="background:#FEF2F2;color:#DC2626">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l9 16H3l9-16z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M12 9v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Satisfação (mês) -->
        <div class="card mini-metric-card">
          <span class="mini-card-title">Satisfação (mês)</span>
          <div class="mini-card-body-row">
            <div>
              <span class="mini-card-big-val">4,6 / 5</span>
              <span class="subtext-gray" style="margin-top: 6px; display: block;">Baseado em 128 avaliações</span>
            </div>
            <div class="metric-icon-box" style="background:#FFFBEB;color:#F59E0B">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .dashboard-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── KPI Grid ────────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
    }

    .kpi-card {
      background-color: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 18px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .kpi-label {
      font-size: 12px;
      font-weight: 500;
      color: #64748B;
    }

    .kpi-value-row {
      display: flex;
      align-items: baseline;
    }

    .kpi-value {
      font-size: 26px;
      font-weight: 700;
      color: #14213D;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .kpi-trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 500;
    }

    .trend-up {
      color: #16A34A;
    }

    .trend-down {
      color: #DC2626;
    }

    /* ── Gráficos ────────────────────────────────────────── */
    .charts-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 16px;
    }

    .chart-card {
      padding: 18px 20px;
    }

    .card-header-clean {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .card-header-clean h3 {
      font-size: 14.5px;
      font-weight: 700;
      color: #14213D;
    }

    .chart-period-badge {
      font-size: 12px;
      color: #64748B;
      cursor: pointer;
    }

    .donut-chart-container {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .donut-svg-wrap {
      width: 140px;
      height: 140px;
      flex-shrink: 0;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .legend-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-name {
      color: #64748B;
      flex: 1;
    }

    .legend-val {
      font-weight: 600;
      color: #14213D;
    }

    .line-chart-container {
      width: 100%;
      height: 170px;
    }

    .line-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* ── Métricas Inferiores ─────────────────────────────── */
    .bottom-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .mini-metric-card {
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mini-card-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #64748B;
    }

    .mini-card-body-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .mini-card-big-val {
      font-size: 24px;
      font-weight: 700;
      color: #14213D;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .metric-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .subtext-gray {
      font-size: 11px;
      color: #94A3B8;
    }

    .link-small {
      font-size: 12px;
      font-weight: 600;
      color: #1976D2;
      text-decoration: none;
    }
    .link-small:hover {
      text-decoration: underline;
    }

    .demand-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .demand-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      padding: 3px 0;
    }

    .demand-name {
      color: #64748B;
    }

    .demand-count {
      color: #14213D;
      font-weight: 600;
    }

    /* ── Responsivo ──────────────────────────────────────── */
    @media (max-width: 1280px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
      .bottom-metrics-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .bottom-metrics-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly ticketService = inject(TicketService);

  readonly tickets = signal<TicketSummary[]>([]);

  ngOnInit(): void {
    this.ticketService.listTickets({ limit: 50 }).subscribe({
      next: (res) => this.tickets.set(res.items),
      error: () => {}
    });
  }

  firstName(): string {
    const full = this.auth.currentUser()?.name || 'Anderson';
    return full.split(' ')[0];
  }

  totalCount(): number {
    return Math.max(this.tickets().length, 532);
  }

  openCount(): number {
    const cnt = this.tickets().filter(t => (t.stage?.name || '').toLowerCase().includes('novo') || (t.stage?.name || '').toLowerCase().includes('aberto')).length;
    return cnt || 128;
  }

  attendingCount(): number {
    const cnt = this.tickets().filter(t => (t.stage?.name || '').toLowerCase().includes('atendimento')).length;
    return cnt || 78;
  }

  waitingCount(): number {
    const cnt = this.tickets().filter(t => (t.stage?.name || '').toLowerCase().includes('aguardando')).length;
    return cnt || 36;
  }

  resolvedCount(): number {
    const cnt = this.tickets().filter(t => (t.stage?.name || '').toLowerCase().includes('resolv')).length;
    return cnt || 290;
  }
}
