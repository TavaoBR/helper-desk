import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-settings-users',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-wrap">

      <div class="breadcrumb">
        <a routerLink="/settings">Cadastros</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Usuários</span>
      </div>

      <div class="page-header">
        <div>
          <h1>Usuários e agentes</h1>
          <p>Gerencie os colaboradores e perfis de acesso da plataforma.</p>
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
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @if (isLoading()) {
                @for (i of [1,2,3,4]; track i) {
                  <tr>
                    <td>
                      <div style="display:flex;gap:10px;align-items:center">
                        <div class="skeleton" style="width:32px;height:32px;border-radius:50%;flex-shrink:0"></div>
                        <div class="skeleton" style="height:16px;width:120px"></div>
                      </div>
                    </td>
                    <td><div class="skeleton" style="height:16px;width:160px"></div></td>
                    <td><div class="skeleton" style="height:20px;width:80px;border-radius:99px"></div></td>
                    <td><div class="skeleton" style="height:20px;width:50px;border-radius:99px"></div></td>
                    <td></td>
                  </tr>
                }
              } @else {
                @for (u of users(); track u.id) {
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="user-avatar">{{ u.name.charAt(0) }}</div>
                        <strong style="font-size:13px;color:#14213D">{{ u.name }}</strong>
                      </div>
                    </td>
                    <td style="font-size:13px;color:#667085">{{ u.email }}</td>
                    <td>
                      <span class="badge" [class]="getRoleBadge(u.roles)" style="font-size:10.5px">
                        {{ getRoleLabel(u.roles) }}
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

        <!-- ── Formulário ────────────────────────────────────── -->
        <div class="card" style="flex:1;min-width:280px">
          <div class="card-header">
            <h3 style="font-size:14px;font-weight:600;color:#14213D">Novo usuário</h3>
          </div>
          <div class="form-group">
            <label class="form-label" for="user-name">Nome completo *</label>
            <input id="user-name" type="text" class="form-input"
              placeholder="Ex: Ana Silva"
              [value]="newName" (input)="newName = $any($event.target).value" />
          </div>
          <div class="form-group">
            <label class="form-label" for="user-email">E-mail *</label>
            <input id="user-email" type="email" class="form-input"
              placeholder="ana@empresa.com"
              [value]="newEmail" (input)="newEmail = $any($event.target).value" />
          </div>
          <div class="form-group">
            <label class="form-label" for="user-password">Senha inicial *</label>
            <input id="user-password" type="password" class="form-input"
              placeholder="Mínimo 6 caracteres"
              [value]="newPassword" (input)="newPassword = $any($event.target).value" />
          </div>
          <div class="form-group">
            <label class="form-label" for="user-role">Perfil de acesso *</label>
            <select id="user-role" class="form-select"
              [value]="newRole" (change)="newRole = $any($event.target).value">
              <option value="ROLE_USER">Solicitante</option>
              <option value="ROLE_AGENT">Agente de suporte</option>
              <option value="ROLE_ADMIN">Administrador</option>
            </select>
          </div>
          <button
            class="btn btn-yellow w-full"
            style="margin-top:4px"
            [disabled]="!newName.trim() || !newEmail.trim() || !newPassword || isSaving()"
            (click)="onCreate()"
          >
            @if (isSaving()) { Cadastrando... } @else { + Criar usuário }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 20px; }
    .settings-grid { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #082B55, #1976D2);
      color: #fff; font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    @media (max-width: 768px) { .settings-grid { flex-direction: column; } }
  `]
})
export class SettingsUsersComponent implements OnInit {
  private readonly svc = inject(TicketService);

  readonly users = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  newName = '';
  newEmail = '';
  newPassword = '';
  newRole = 'ROLE_AGENT';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.svc.getUsers().subscribe({
      next: (data) => { this.users.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  onCreate(): void {
    if (!this.newName.trim() || !this.newEmail.trim() || !this.newPassword) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.svc.createUser({
      name: this.newName.trim(),
      email: this.newEmail.trim(),
      password: this.newPassword,
      roles: [this.newRole]
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set(`Usuário "${this.newName.trim()}" criado com sucesso!`);
        this.newName = '';
        this.newEmail = '';
        this.newPassword = '';
        this.load();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.error?.message || 'Erro ao criar usuário.');
      }
    });
  }

  getRoleLabel(roles: string[]): string {
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles.includes('ROLE_AGENT')) return 'Agente';
    return 'Solicitante';
  }

  getRoleBadge(roles: string[]): string {
    if (roles.includes('ROLE_ADMIN')) return 'badge-warning';
    if (roles.includes('ROLE_AGENT')) return 'badge-info';
    return 'badge-neutral';
  }
}
