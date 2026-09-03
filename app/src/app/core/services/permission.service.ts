import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type UserRole = 'ROLE_ADMIN' | 'ROLE_AGENT' | 'ROLE_USER';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ROLE_ADMIN: [
    'ticket.create',
    'ticket.view_all',
    'ticket.view_queue',
    'ticket.assign',
    'ticket.move_pipeline',
    'ticket.comment_public',
    'ticket.comment_internal',
    'user.manage',
    'user.view',
    'request_type.manage',
    'settings.view',
    'settings.manage'
  ],
  ROLE_AGENT: [
    'ticket.create',
    'ticket.view_all',
    'ticket.view_queue',
    'ticket.assign',
    'ticket.move_pipeline',
    'ticket.comment_public',
    'ticket.comment_internal',
    'user.view'
  ],
  ROLE_USER: [
    'ticket.create',
    'ticket.comment_public'
  ]
};

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly auth = inject(AuthService);

  readonly currentUser = this.auth.currentUser;

  /**
   * Primary role of the current user.
   */
  readonly primaryRole = computed<UserRole>(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return 'ROLE_USER';
    if (user.roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
    if (user.roles.includes('ROLE_AGENT')) return 'ROLE_AGENT';
    return 'ROLE_USER';
  });

  /**
   * Human-readable label for the user's role.
   */
  readonly roleLabel = computed<string>(() => {
    switch (this.primaryRole()) {
      case 'ROLE_ADMIN':
        return 'Administrador';
      case 'ROLE_AGENT':
        return 'Agente de Atendimento';
      case 'ROLE_USER':
        return 'Solicitante';
      default:
        return 'Usuário';
    }
  });

  /**
   * Badge style class for the role.
   */
  readonly roleBadgeClass = computed<string>(() => {
    switch (this.primaryRole()) {
      case 'ROLE_ADMIN':
        return 'badge-admin';
      case 'ROLE_AGENT':
        return 'badge-agent';
      case 'ROLE_USER':
        return 'badge-user';
      default:
        return 'badge-neutral';
    }
  });

  /**
   * Check whether the user has a specific permission.
   * Centralized check: checks if user has ROLE_ADMIN, direct permission in roles, or mapped in matrix.
   */
  can(permission: string): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Admin has all permissions
    if (user.roles.includes('ROLE_ADMIN')) {
      return true;
    }

    // Direct permission in user roles array
    if (user.roles.includes(permission)) {
      return true;
    }

    // Matrix lookup based on assigned roles
    for (const role of user.roles) {
      const allowed = ROLE_PERMISSIONS[role as UserRole];
      if (allowed && allowed.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check whether the user has ANY of the specified permissions.
   */
  canAny(permissions: string[]): boolean {
    return permissions.some(p => this.can(p));
  }

  /**
   * Check whether the user has ALL of the specified permissions.
   */
  canAll(permissions: string[]): boolean {
    return permissions.every(p => this.can(p));
  }

  /**
   * Check if user has a specific role.
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return !!user && user.roles.includes(role);
  }
}
