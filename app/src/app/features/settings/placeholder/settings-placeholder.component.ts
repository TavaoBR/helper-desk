import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  categories: { title: 'Categorias', subtitle: 'Organize os chamados em categorias.' },
  pipelines: { title: 'Pipelines', subtitle: 'Configure os fluxos de atendimento.' },
  teams: { title: 'Equipes', subtitle: 'Gerencie as equipes de atendimento.' },
  'queues-config': { title: 'Filas de atendimento', subtitle: 'Gerencie filas de atendimento.' },
  sla: { title: 'SLA', subtitle: 'Defina acordos de nível de serviço.' },
  automations: { title: 'Regras de automação', subtitle: 'Configure regras e gatilhos automáticos de atendimento.' },
  notifications: { title: 'Notificações', subtitle: 'Configure templates de e-mail e alertas do sistema.' },
  reports: { title: 'Relatórios', subtitle: 'Métricas, volumetria e relatórios operacionais.' },
  permissions: { title: 'Permissões e Perfis', subtitle: 'Gerencie matriz de permissões de cada perfil de acesso.' },
  general: { title: 'Configurações Gerais', subtitle: 'Parâmetros gerais do sistema e personalização.' }
};

@Component({
  selector: 'app-settings-placeholder',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-wrap">

      <div class="breadcrumb">
        <a routerLink="/settings">Cadastros</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">{{ pageTitle }}</span>
      </div>

      <div class="page-header">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageSubtitle }}</p>
        </div>
      </div>

      <div class="coming-soon-card">
        <div class="coming-soon-icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" stroke="#E5E7EB" stroke-width="2"/>
            <path d="M18 10v8l5 5" stroke="#B0BAC8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>Em breve</h2>
        <p>Esta seção está sendo desenvolvida e estará disponível em breve.</p>
        <a routerLink="/settings" class="btn btn-secondary">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Voltar aos cadastros
        </a>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 20px; }
    .coming-soon-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 64px 32px;
      background: #FFFFFF;
      border: 1px dashed #E5E7EB;
      border-radius: 10px;
      text-align: center;
    }
    .coming-soon-icon {
      width: 72px; height: 72px;
      border-radius: 16px;
      background: #F8FAFC;
      display: flex; align-items: center; justify-content: center;
    }
    .coming-soon-card h2 { font-size: 18px; font-weight: 700; color: #14213D; }
    .coming-soon-card p { font-size: 13px; color: #9CA3AF; max-width: 340px; margin: 0; }
  `]
})
export class SettingsPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  get segment(): string {
    const segments = this.route.snapshot.url;
    return segments[segments.length - 1]?.path ?? '';
  }

  get pageTitle(): string {
    return TITLES[this.segment]?.title ?? 'Cadastros';
  }

  get pageSubtitle(): string {
    return TITLES[this.segment]?.subtitle ?? 'Gerencie esta seção da plataforma.';
  }
}
