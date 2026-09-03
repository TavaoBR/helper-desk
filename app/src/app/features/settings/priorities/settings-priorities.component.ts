import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { Priority } from '../../../core/models/catalog.model';

@Component({
  selector: 'app-settings-priorities',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-wrap">

      <div class="breadcrumb">
        <a routerLink="/settings">Cadastros</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Prioridades</span>
      </div>

      <div class="page-header">
        <div>
          <h1>Matriz de Prioridades</h1>
          <p>Defina as prioridades e seus pesos de triagem para os chamados.</p>
        </div>
      </div>

      @if (successMessage()) {
        <div class="alert alert-success">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ successMessage() }}
        </div>
      }
      @if (errorMessage()) {
        <div class="alert alert-danger">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 5v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ errorMessage() }}
        </div>
      }

      <div class="settings-grid">

        <!-- ── Listagem ──────────────────────────────────────── -->
        <div class="table-container" style="flex:2;min-width:0">
          <table class="table">
            <thead>
              <tr>
                <th>Prioridade</th>
                <th>Peso</th>
                <th>Nível</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @if (isLoading()) {
                @for (i of [1,2,3,4]; track i) {
                  <tr>
                    <td><div class="skeleton" style="height:16px;width:100px"></div></td>
                    <td><div class="skeleton" style="height:16px;width:40px"></div></td>
                    <td><div class="skeleton" style="height:20px;width:80px;border-radius:99px"></div></td>
                    <td><div class="skeleton" style="height:20px;width:50px;border-radius:99px"></div></td>
                    <td></td>
                  </tr>
                }
              } @else {
                @for (pri of priorities(); track pri.id) {
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span class="priority-dot-indicator" [class]="getDotClass(pri.weight)"></span>
                        <strong style="font-size:13px;color:#14213D">{{ pri.name }}</strong>
                      </div>
                    </td>
                    <td>
                      <code style="font-size:13px;font-family:var(--font-family-mono);color:#667085">{{ pri.weight }}</code>
                    </td>
                    <td>
                      <span class="badge" [class]="getBadgeClass(pri.weight)" style="font-size:11px">
                        {{ getLevelLabel(pri.weight) }}
                      </span>
                    </td>
                    <td><span class="badge badge-success" style="font-size:10.5px">Ativo</span></td>
                    <td style="text-align:right">
                      <button class="btn btn-ghost btn-sm">Editar</button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- ── Info card ─────────────────────────────────────── -->
        <div class="card" style="flex:1;min-width:280px">
          <div class="card-header">
            <h3 style="font-size:14px;font-weight:600;color:#14213D">Como funciona o peso</h3>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="weight-info">
              <span class="priority-dot-indicator dot-critical"></span>
              <div>
                <strong>Crítica (90–100)</strong>
                <p>Impacto total. SLA reduzido. Atenção imediata.</p>
              </div>
            </div>
            <div class="weight-info">
              <span class="priority-dot-indicator dot-high"></span>
              <div>
                <strong>Alta (70–89)</strong>
                <p>Impacto alto. Atendimento prioritário.</p>
              </div>
            </div>
            <div class="weight-info">
              <span class="priority-dot-indicator dot-medium"></span>
              <div>
                <strong>Média (40–69)</strong>
                <p>Impacto moderado. Fluxo padrão de atendimento.</p>
              </div>
            </div>
            <div class="weight-info">
              <span class="priority-dot-indicator dot-low"></span>
              <div>
                <strong>Baixa (0–39)</strong>
                <p>Baixo impacto. Fila normal de atendimento.</p>
              </div>
            </div>
          </div>

          <div class="card-header" style="margin-top:20px">
            <h3 style="font-size:14px;font-weight:600;color:#14213D">Adicionar nova</h3>
          </div>
          <div class="form-group">
            <label class="form-label" for="pri-name">Nome da prioridade *</label>
            <input id="pri-name" type="text" class="form-input"
              placeholder="Ex: Urgente"
              [value]="newName" (input)="newName = $any($event.target).value" />
          </div>
          <div class="form-group">
            <label class="form-label" for="pri-weight">Peso (0–100) *</label>
            <input id="pri-weight" type="number" class="form-input"
              placeholder="Ex: 85" min="0" max="100"
              [value]="newWeight" (input)="newWeight = +$any($event.target).value" />
          </div>
          <button
            class="btn btn-yellow w-full"
            style="margin-top:4px"
            [disabled]="!newName.trim() || isSaving()"
            (click)="onCreate()"
          >
            @if (isSaving()) { Salvando... } @else { + Cadastrar prioridade }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 20px; }
    .settings-grid { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }

    .priority-dot-indicator {
      width: 10px; height: 10px;
      border-radius: 50%; flex-shrink: 0; display: inline-block;
    }
    .dot-critical { background-color: #DC2626; }
    .dot-high     { background-color: #EA580C; }
    .dot-medium   { background-color: #D97706; }
    .dot-low      { background-color: #16A34A; }

    .weight-info {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px;
      background: #F8FAFC;
      border-radius: 6px;
    }
    .weight-info strong { display: block; font-size: 12.5px; color: #14213D; margin-bottom: 2px; }
    .weight-info p { font-size: 12px; color: #9CA3AF; margin: 0; }

    @media (max-width: 768px) { .settings-grid { flex-direction: column; } }
  `]
})
export class SettingsPrioritiesComponent implements OnInit {
  private readonly svc = inject(TicketService);

  readonly priorities = signal<Priority[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  newName = '';
  newWeight = 50;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.svc.getPriorities().subscribe({
      next: (data) => { this.priorities.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  onCreate(): void {
    if (!this.newName.trim()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.svc.createPriority({ name: this.newName.trim(), weight: this.newWeight }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set(`Prioridade "${this.newName.trim()}" cadastrada!`);
        this.newName = '';
        this.newWeight = 50;
        this.load();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.error?.message || 'Erro ao cadastrar prioridade.');
      }
    });
  }

  getDotClass(weight: number): string {
    if (weight >= 90) return 'priority-dot-indicator dot-critical';
    if (weight >= 70) return 'priority-dot-indicator dot-high';
    if (weight >= 40) return 'priority-dot-indicator dot-medium';
    return 'priority-dot-indicator dot-low';
  }

  getBadgeClass(weight: number): string {
    if (weight >= 90) return 'badge-danger';
    if (weight >= 70) return 'badge-warning';
    if (weight >= 40) return 'badge-info';
    return 'badge-success';
  }

  getLevelLabel(weight: number): string {
    if (weight >= 90) return 'Crítica';
    if (weight >= 70) return 'Alta';
    if (weight >= 40) return 'Média';
    return 'Baixa';
  }
}
