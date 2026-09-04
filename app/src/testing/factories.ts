/**
 * Test Data Factories
 *
 * Centralized factory functions for building test domain objects.
 * All factories accept Partial overrides so callers can customise only what matters.
 */

import { Component } from '@angular/core';
import type { User } from '../app/core/models/auth.model';
import type { Ticket, TicketSummary, TicketComment, TicketHistoryItem } from '../app/core/models/ticket.model';
import type { Department, Priority, TicketType, Category } from '../app/core/models/catalog.model';
import type { ApiPaginatedResponse } from '../app/core/models/api.model';

@Component({ template: '' })
export class DummyComponent {}

// ─── Counters for auto-incrementing IDs ───────────────────────────────────────
let uid = 1;
const nextId = () => String(uid++);

/** Reset auto-increment counter (call in beforeEach when order matters) */
export function resetFactoryCounters(): void {
  uid = 1;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId(),
    name: 'Test User',
    email: 'user@test.com',
    tenantId: 'tenant-1',
    roles: ['ROLE_USER'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides
  };
}

export function makeAdminUser(overrides: Partial<User> = {}): User {
  return makeUser({ name: 'Admin User', email: 'admin@test.com', roles: ['ROLE_ADMIN'], ...overrides });
}

export function makeAgentUser(overrides: Partial<User> = {}): User {
  return makeUser({ name: 'Agent User', email: 'agent@test.com', roles: ['ROLE_AGENT'], ...overrides });
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    id: nextId(),
    name: 'TI',
    description: 'Departamento de TI',
    isActive: true,
    ...overrides
  };
}

export function makePriority(overrides: Partial<Priority> = {}): Priority {
  return {
    id: nextId(),
    name: 'Média',
    weight: 50,
    colorToken: 'medium',
    isActive: true,
    ...overrides
  };
}

export function makeTicketType(overrides: Partial<TicketType> = {}): TicketType {
  return {
    id: nextId(),
    departmentId: nextId(),
    name: 'Incidente',
    isActive: true,
    ...overrides
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: nextId(),
    name: 'Hardware',
    isActive: true,
    ...overrides
  };
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export function makeTicketSummary(overrides: Partial<TicketSummary> = {}): TicketSummary {
  const id = nextId();
  return {
    id,
    protocol: `TKT-${id.padStart(5, '0')}`,
    title: `Chamado de teste ${id}`,
    department: { id: nextId(), name: 'TI' },
    type: { id: nextId(), name: 'Incidente' },
    priority: { id: nextId(), name: 'Média', weight: 50, colorToken: 'medium' },
    stage: { id: nextId(), name: 'Novo', isInitial: true, isFinal: false },
    requester: { id: nextId(), name: 'João Silva' },
    assignedUser: null,
    assignedTeam: null,
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides
  };
}

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    ...makeTicketSummary(),
    description: 'Descrição detalhada do chamado de teste.',
    category: null,
    pipeline: { id: nextId(), name: 'Pipeline Padrão' },
    resolvedAt: null,
    closedAt: null,
    ...overrides
  };
}

export function makeTicketComment(overrides: Partial<TicketComment> = {}): TicketComment {
  return {
    id: nextId(),
    ticketId: nextId(),
    author: { id: nextId(), name: 'Agent User', email: 'agent@test.com' },
    body: 'Comentário de teste',
    visibility: 'public',
    createdAt: '2026-01-01T10:00:00Z',
    ...overrides
  };
}

export function makeTicketHistoryItem(overrides: Partial<TicketHistoryItem> = {}): TicketHistoryItem {
  return {
    id: nextId(),
    ticketId: nextId(),
    actor: { id: nextId(), name: 'Admin User' },
    action: 'ticket.created',
    beforeState: null,
    afterState: null,
    metadata: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides
  };
}

// ─── API Pagination ────────────────────────────────────────────────────────────

export function makePaginatedResponse<T>(
  items: T[],
  overrides: { page?: number; limit?: number; total?: number } = {}
): ApiPaginatedResponse<T> {
  return {
    items,
    pagination: {
      page: overrides.page ?? 1,
      limit: overrides.limit ?? 20,
      total: overrides.total ?? items.length
    }
  };
}
