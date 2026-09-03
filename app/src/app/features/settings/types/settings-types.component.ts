import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { TicketType, Department } from '../../../core/models/catalog.model';

@Component({
  selector: 'app-settings-types',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-wrap">

      <div class="breadcrumb">
        <a routerLink="/settings">Cadastros</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Tipos de chamado</span>
      </div>

      <div class="page-header">
        <div>
          <h1>Tipos de chamado</h1>
          <p>Cadastre os tipos de solicitações disponíveis por departamento.</p>
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

        <!-- ── Listagem com filtro ───────────────────────────── -->
        <div class="card" style="flex:2;min-width:0">
          <div class="card-header">
            <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px;flex-wrap:wrap">
              <h3 style="font-size:14px;font-weight:600;color:#14213D">
                Catálogo de tipos
                <span class="badge badge-primary" style="margin-left:8px">{{ filteredTypes().length }}</span>
              </h3>
              <select
                class="form-select"
                style="max-width:220px;font-size:12.5px;padding:6px 10px"
                [value]="filterDeptId"
                (change)="filterDeptId = $any($event.target).value; applyFilter()"
              >
                <option value="">Todos os departamentos</option>
                @for (d of departments(); track d.id) {
                  <option [value]="d.id">{{ d.name }}</option>
                }
              </select>
            </div>
          </div>

          @if (isLoading()) {
            <div style="display:flex;flex-direction:column;gap:8px;padding:8px 0">
              @for (i of [1,2,3,4]; track i) {
                <div class="skeleton" style="height:52px;border-radius:6px"></div>
              }
            </div>
          } @else if (filteredTypes().length === 0) {
            <div class="empty-state" style="border:none;padding:32px">
              <div class="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="#B0BAC8" stroke-width="1.5"/>
                  <rect x="9" y="3" width="6" height="4" rx="1" stroke="#B0BAC8" stroke-width="1.5"/>
                </svg>
              </div>
              <h3>Nenhum tipo encontrado</h3>
              <p>Não há tipos cadastrados para o filtro selecionado.</p>
            </div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:6px">
              @for (t of filteredTypes(); track t.id) {
                <div class="type-item">
                  <div class="type-icon">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.3"/>
                      <path d="M4 5h6M4 7.5h6M4 10h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="type-info">
                    <strong>{{ t.name }}</strong>
                    <span>{{ getDeptName(t.departmentId) }}</span>
                  </div>
                  <span class="badge badge-success" style="font-size:10.5px">Ativo</span>
                  <button class="btn btn-ghost btn-sm">Editar</button>
                </div>
              }
            </div>
          }
        </div>

        <!-- ── Formulário ────────────────────────────────────── -->
        <div class="card" style="flex:1;min-width:280px">
          <div class="card-header">
            <h3 style="font-size:14px;font-weight:600;color:#14213D">Novo tipo de chamado</h3>
          </div>
          <div class="form-group">
            <label class="form-label" for="type-dept">Departamento *</label>
            <select id="type-dept" class="form-select"
              [value]="newDeptId" (change)="newDeptId = $any($event.target).value">
              <option value="">Selecione o departamento...</option>
              @for (d of departments(); track d.id) {
                <option [value]="d.id">{{ d.name }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="type-name">Nome do tipo *</label>
            <input id="type-name" type="text" class="form-input"
              placeholder="Ex: Emissão de Nota Fiscal"
              [value]="newName" (input)="newName = $any($event.target).value" />
          </div>
          <button
            class="btn btn-yellow w-full"
            style="margin-top:4px"
            [disabled]="!newDeptId || !newName.trim() || isSaving()"
            (click)="onCreate()"
          >
            @if (isSaving()) { Salvando... } @else { + Cadastrar tipo }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 20px; }
    .settings-grid { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }

    .type-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #F8FAFC;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      transition: background 0.1s ease;
    }
    .type-item:hover { background: #EFF6FF; border-color: #BFDBFE; }
    .type-icon {
      width: 30px; height: 30px; border-radius: 6px;
      background: #EFF6FF; border: 1px solid #BFDBFE;
      display: flex; align-items: center; justify-content: center;
      color: #1976D2; flex-shrink: 0;
    }
    .type-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .type-info strong { font-size: 13px; font-weight: 600; color: #14213D; }
    .type-info span { font-size: 12px; color: #9CA3AF; }

    @media (max-width: 768px) { .settings-grid { flex-direction: column; } }
  `]
})
export class SettingsTypesComponent implements OnInit {
  private readonly svc = inject(TicketService);

  readonly departments = signal<Department[]>([]);
  readonly allTypes = signal<TicketType[]>([]);
  readonly filteredTypes = signal<TicketType[]>([]);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  filterDeptId = '';
  newDeptId = '';
  newName = '';

  ngOnInit(): void {
    this.svc.getDepartments().subscribe({
      next: (data) => this.departments.set(data)
    });
    this.loadTypes();
  }

  loadTypes(): void {
    this.isLoading.set(true);
    this.svc.getTicketTypes().subscribe({
      next: (types) => {
        this.allTypes.set(types);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  applyFilter(): void {
    if (!this.filterDeptId) {
      this.filteredTypes.set(this.allTypes());
    } else {
      this.filteredTypes.set(this.allTypes().filter(t => t.departmentId === this.filterDeptId));
    }
  }

  getDeptName(deptId: string): string {
    return this.departments().find(d => d.id === deptId)?.name ?? '—';
  }

  onCreate(): void {
    if (!this.newDeptId || !this.newName.trim()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.svc.createTicketType(this.newDeptId, this.newName.trim()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set(`Tipo "${this.newName.trim()}" cadastrado com sucesso!`);
        this.newName = '';
        this.loadTypes();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.error?.message || 'Erro ao cadastrar tipo.');
      }
    });
  }
}
