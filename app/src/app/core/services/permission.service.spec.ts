import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    });
    authService = TestBed.inject(AuthService);
    service = TestBed.inject(PermissionService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return false for permissions when not logged in', () => {
    expect(service.can('ticket.create')).toBe(false);
    expect(service.can('settings.view')).toBe(false);
  });

  it('should grant all permissions for ROLE_ADMIN', () => {
    const adminUser = {
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      tenantId: 't1',
      roles: ['ROLE_ADMIN'],
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z'
    };
    authService.setSession('mock_token', adminUser);

    expect(service.can('ticket.create')).toBe(true);
    expect(service.can('ticket.assign')).toBe(true);
    expect(service.can('settings.view')).toBe(true);
    expect(service.can('user.manage')).toBe(true);
    expect(service.primaryRole()).toBe('ROLE_ADMIN');
    expect(service.roleLabel()).toBe('Administrador');
  });

  it('should restrict permissions for ROLE_USER (requester)', () => {
    const regularUser = {
      id: '2',
      name: 'User',
      email: 'user@test.com',
      tenantId: 't1',
      roles: ['ROLE_USER'],
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z'
    };
    authService.setSession('mock_token', regularUser);

    expect(service.can('ticket.create')).toBe(true);
    expect(service.can('ticket.comment_public')).toBe(true);
    expect(service.can('ticket.assign')).toBe(false);
    expect(service.can('ticket.view_queue')).toBe(false);
    expect(service.can('settings.view')).toBe(false);
    expect(service.can('ticket.comment_internal')).toBe(false);
    expect(service.primaryRole()).toBe('ROLE_USER');
    expect(service.roleLabel()).toBe('Solicitante');
  });

  it('should allow operational permissions for ROLE_AGENT', () => {
    const agentUser = {
      id: '3',
      name: 'Agent',
      email: 'agent@test.com',
      tenantId: 't1',
      roles: ['ROLE_AGENT'],
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z'
    };
    authService.setSession('mock_token', agentUser);

    expect(service.can('ticket.create')).toBe(true);
    expect(service.can('ticket.view_queue')).toBe(true);
    expect(service.can('ticket.assign')).toBe(true);
    expect(service.can('ticket.comment_internal')).toBe(true);
    expect(service.can('settings.view')).toBe(false);
    expect(service.can('user.manage')).toBe(false);
    expect(service.primaryRole()).toBe('ROLE_AGENT');
    expect(service.roleLabel()).toBe('Agente de Atendimento');
  });
});
