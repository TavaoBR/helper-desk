import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { Department } from '../../../core/models/catalog.model';

@Component({
  selector: 'app-settings-departments',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-wrap">

      <div class="breadcrumb">
        <a routerLink="/settings">Cadastros</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Departamentos</span>
      </div>

      <div class="page-header">
        <div>
          <h1>Departamentos</h1>
          <p>Gerencie os departamentos da empresa que recebem chamados.</p>
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
                <th>Nome</th>
                <th>Descrição</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @if (isLoading()) {
                @for (i of [1,2,3,4]; track i) {
                  <tr>
                    <td><div class="skeleton" style="height:16px;width:120px"></div></td>
                    <td><div class="skeleton" style="height:16px;width:200px"></div></td>
                    <td><div class="skeleton" style="height:20px;width:50px;border-radius:99px"></div></td>
                    <td></td>
                  </tr>
                }
              } @else if (departments().length === 0) {
                <tr><td colspan="4">
                  <div style="text-align:center;padding:32px;color:#9CA3AF;font-size:13px">
                    Nenhum departamento cadastrado.
                  </div>
                </td></tr>
              } @else {
                @for (dept of departments(); track dept.id) {
                  <tr>
                    <td style="font-weight:600;color:#14213D">{{ dept.name }}</td>
                    <td style="color:#667085">{{ dept.description || '—' }}</td>
                    <td><span class="badge badge-success">Ativo</span></td>
                    <td style="text-align:right">
                      <button class="btn btn-ghost btn-sm">Editar</button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- ── Formulário ────────────────────────────────────── -->
        <div class="card" style="flex:1;min-width:280px">
          <div class="card-header">
            <h3 style="font-size:14px;font-weight:600;color:#14213D">Novo departamento</h3>
          </div>
          <div class="form-group">
            <label class="form-label" for="dept-name">Nome *</label>
            <input id="dept-name" type="text" class="form-input"
              placeholder="Ex: Tecnologia da Informação"
              [value]="newName" (input)="newName = $any($event.target).value" />
          </div>
          <div class="form-group">
            <label class="form-label" for="dept-desc">Descrição</label>
            <textarea id="dept-desc" class="form-textarea" rows="3"
              placeholder="Descrição opcional do departamento"
              [value]="newDescription" (input)="newDescription = $any($event.target).value"></textarea>
          </div>
          <button
            class="btn btn-yellow w-full"
            style="margin-top:4px"
            [disabled]="!newName.trim() || isSaving()"
            (click)="onCreate()"
          >
            @if (isSaving()) { Salvando... } @else { + Cadastrar departamento }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 20px; }
    .settings-grid { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
    @media (max-width: 768px) { .settings-grid { flex-direction: column; } }
  `]
})
export class SettingsDepartmentsComponent implements OnInit {
  private readonly svc = inject(TicketService);

  readonly departments = signal<Department[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  newName = '';
  newDescription = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.svc.getDepartments().subscribe({
      next: (data) => { this.departments.set(data); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.errorMessage.set('Erro ao carregar departamentos.'); }
    });
  }

  onCreate(): void {
    if (!this.newName.trim()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.svc.createDepartment({ name: this.newName.trim(), description: this.newDescription.trim() || undefined }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set(`Departamento "${this.newName.trim()}" cadastrado com sucesso!`);
        this.newName = '';
        this.newDescription = '';
        this.load();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.error?.message || 'Erro ao cadastrar departamento.');
      }
    });
  }
}
