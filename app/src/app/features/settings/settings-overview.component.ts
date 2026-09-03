import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface SettingsCard {
  route: string;
  icon: string;
  color: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-settings-overview',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-wrap">

      <!-- ── Page Header ─────────────────────────────────── -->
      <div class="page-header">
        <div>
          <h1>Cadastros operacionais</h1>
          <p>Gerencie os cadastros que estruturam o módulo de chamados.</p>
        </div>
      </div>

      <!-- ── Grid de cards ──────────────────────────────────── -->
      <div class="catalog-grid">
        @for (card of cards; track card.route) {
          <a [routerLink]="card.route" class="catalog-card">
            <div class="catalog-card-icon" [style.background]="card.color + '18'">
              <span class="catalog-icon-wrap" [style.color]="card.color" [innerHTML]="card.icon"></span>
            </div>
            <div class="catalog-card-body">
              <strong class="catalog-card-title">{{ card.title }}</strong>
              <p class="catalog-card-desc">{{ card.description }}</p>
            </div>
            <svg class="catalog-card-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        }
      </div>

    </div>
  `,
  styles: [`
    .page-wrap {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }

    .catalog-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.12s ease;
      text-align: left;
      text-decoration: none;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .catalog-card:hover {
      border-color: #1976D2;
      box-shadow: 0 2px 8px rgba(25,118,210,0.08);
      transform: translateY(-1px);
    }

    .catalog-card-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .catalog-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }

    :host ::ng-deep .catalog-icon-wrap svg {
      width: 18px;
      height: 18px;
    }

    .catalog-card-body {
      flex: 1;
      min-width: 0;
    }

    .catalog-card-title {
      display: block;
      font-size: 13.5px;
      font-weight: 600;
      color: #14213D;
      margin-bottom: 2px;
    }

    .catalog-card-desc {
      font-size: 12px;
      color: #9CA3AF;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .catalog-card-arrow {
      color: #D1D5DB;
      flex-shrink: 0;
      transition: color 0.12s ease;
    }

    .catalog-card:hover .catalog-card-arrow {
      color: #1976D2;
    }

    @media (max-width: 768px) {
      .catalog-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 480px) {
      .catalog-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SettingsOverviewComponent {
  readonly cards: SettingsCard[] = [
    {
      route: '/settings/departments',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 5V4a3 3 0 016 0v1" stroke="currentColor" stroke-width="1.4"/></svg>`,
      color: '#1976D2',
      title: 'Departamentos',
      description: 'Gerencie os departamentos da empresa.'
    },
    {
      route: '/settings/types',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 7h8M5 10h8M5 13h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
      color: '#7C3AED',
      title: 'Tipos de chamado',
      description: 'Cadastre os tipos de chamados por departamento.'
    },
    {
      route: '/settings/categories',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
      color: '#0891B2',
      title: 'Categorias',
      description: 'Organize os chamados por categorias.'
    },
    {
      route: '/settings/priorities',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l2 5h5l-4 3 1.5 5L9 12.5 4.5 15 6 10 2 7h5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
      color: '#DC2626',
      title: 'Prioridades',
      description: 'Defina a matriz de prioridades dos chamados.'
    },
    {
      route: '/settings/pipelines',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9h14M2 9l4-4M2 9l4 4M16 9l-4-4M16 9l-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      color: '#059669',
      title: 'Pipelines',
      description: 'Configure os fluxos de atendimento.'
    },
    {
      route: '/settings/teams',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M1 16a6 6 0 0112 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="14" cy="6" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M16.5 12.5A4 4 0 0114 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
      color: '#D97706',
      title: 'Equipes',
      description: 'Gerencie as equipes de atendimento.'
    },
    {
      route: '/settings/queues-config',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 5h14M2 9h9M2 13h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      color: '#0891B2',
      title: 'Filas',
      description: 'Gerencie filas de atendimento.'
    },
    {
      route: '/settings/users',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="4" stroke="currentColor" stroke-width="1.4"/><path d="M2 17a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      color: '#1976D2',
      title: 'Usuários',
      description: 'Cadastre e gerencie colaboradores.'
    },
    {
      route: '/settings/sla',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M9 5v4l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      color: '#DC2626',
      title: 'SLA',
      description: 'Defina acordos de nível de serviço.'
    }
  ];
}
