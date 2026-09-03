import { Department, Priority, TicketType, Category, PipelineStage } from './catalog.model';
import { User } from './auth.model';

export interface TicketSummary {
  id: string;
  protocol: string;
  title: string;
  department: Pick<Department, 'id' | 'name'>;
  type: Pick<TicketType, 'id' | 'name'>;
  priority: Pick<Priority, 'id' | 'name' | 'weight' | 'colorToken'>;
  stage: Pick<PipelineStage, 'id' | 'name' | 'isInitial' | 'isFinal'>;
  requester: Pick<User, 'id' | 'name'>;
  assignedUser?: Pick<User, 'id' | 'name'> | null;
  assignedTeam?: { id: string; name: string } | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket extends TicketSummary {
  description: string;
  category?: Pick<Category, 'id' | 'name'> | null;
  pipeline: { id: string; name: string };
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  departmentId: string;
  typeId: string;
  categoryId?: string | null;
  priorityId: string;
}

export interface AssignTicketRequest {
  userId?: string | null;
  teamId?: string | null;
  expectedVersion: number;
}

export interface MoveTicketStageRequest {
  toStageId: string;
  expectedVersion: number;
}

export interface ChangeTicketPriorityRequest {
  priorityId: string;
  expectedVersion: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: Pick<User, 'id' | 'name' | 'email'>;
  body: string;
  visibility: 'public' | 'internal';
  createdAt: string;
}

export interface CreateCommentRequest {
  body: string;
  visibility: 'public' | 'internal';
}

export interface TicketHistoryItem {
  id: string;
  ticketId: string;
  actor: Pick<User, 'id' | 'name'>;
  action: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  uploader: Pick<User, 'id' | 'name'>;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  typeId?: string;
  priorityId?: string;
  stageId?: string;
  assignedUserId?: string;
  requesterId?: string;
}
