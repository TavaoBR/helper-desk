import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tickets/ticket-list.component').then(m => m.TicketListComponent)
  },
  {
    path: 'tickets/new',
    canActivate: [authGuard, permissionGuard('ticket.create')],
    loadComponent: () => import('./features/tickets/ticket-create.component').then(m => m.TicketCreateComponent)
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tickets/ticket-detail.component').then(m => m.TicketDetailComponent)
  },
  {
    path: 'queues',
    canActivate: [authGuard, permissionGuard('ticket.view_queue')],
    loadComponent: () => import('./features/queues/queue-list.component').then(m => m.QueueListComponent)
  },

  // ── Settings: hub ────────────────────────────────────────────────
  {
    path: 'settings',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/settings-overview.component').then(m => m.SettingsOverviewComponent)
  },

  // ── Settings: sub-rotas dedicadas ────────────────────────────────
  {
    path: 'settings/departments',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/departments/settings-departments.component').then(m => m.SettingsDepartmentsComponent)
  },
  {
    path: 'settings/types',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/types/settings-types.component').then(m => m.SettingsTypesComponent)
  },
  {
    path: 'settings/priorities',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/priorities/settings-priorities.component').then(m => m.SettingsPrioritiesComponent)
  },
  {
    path: 'settings/users',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/users/settings-users.component').then(m => m.SettingsUsersComponent)
  },

  // ── Settings: seções em desenvolvimento (placeholder) ────────────
  {
    path: 'settings/categories',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/placeholder/settings-placeholder.component').then(m => m.SettingsPlaceholderComponent)
  },
  {
    path: 'settings/pipelines',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/placeholder/settings-placeholder.component').then(m => m.SettingsPlaceholderComponent)
  },
  {
    path: 'settings/teams',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/placeholder/settings-placeholder.component').then(m => m.SettingsPlaceholderComponent)
  },
  {
    path: 'settings/queues-config',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/placeholder/settings-placeholder.component').then(m => m.SettingsPlaceholderComponent)
  },
  {
    path: 'sla',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/sla/settings-sla.component').then(m => m.SettingsSlaComponent)
  },
  {
    path: 'settings/sla',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/sla/settings-sla.component').then(m => m.SettingsSlaComponent)
  },
  {
    path: 'automations',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/automations/settings-automations.component').then(m => m.SettingsAutomationsComponent)
  },
  {
    path: 'settings/automations',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/automations/settings-automations.component').then(m => m.SettingsAutomationsComponent)
  },
  {
    path: 'notifications',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/notifications/settings-notifications.component').then(m => m.SettingsNotificationsComponent)
  },
  {
    path: 'settings/notifications',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/notifications/settings-notifications.component').then(m => m.SettingsNotificationsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/reports/reports-overview.component').then(m => m.ReportsOverviewComponent)
  },
  {
    path: 'settings/reports',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/reports/reports-overview.component').then(m => m.ReportsOverviewComponent)
  },
  {
    path: 'settings/permissions',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/placeholder/settings-placeholder.component').then(m => m.SettingsPlaceholderComponent)
  },
  {
    path: 'settings/general',
    canActivate: [authGuard, permissionGuard('settings.view')],
    loadComponent: () => import('./features/settings/placeholder/settings-placeholder.component').then(m => m.SettingsPlaceholderComponent)
  },

  // ── Fallbacks ────────────────────────────────────────────────────
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
