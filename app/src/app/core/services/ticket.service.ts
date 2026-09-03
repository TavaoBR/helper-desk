import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Ticket,
  TicketSummary,
  CreateTicketRequest,
  AssignTicketRequest,
  MoveTicketStageRequest,
  ChangeTicketPriorityRequest,
  TicketComment,
  CreateCommentRequest,
  TicketHistoryItem,
  TicketFilters
} from '../models/ticket.model';
import { ApiPaginatedResponse } from '../models/api.model';
import { Department, Priority, TicketType, Category } from '../models/catalog.model';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private readonly api = inject(ApiService);

  listTickets(filters: TicketFilters = {}): Observable<ApiPaginatedResponse<TicketSummary>> {
    const params: Record<string, string | number | undefined> = {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      search: filters.search,
      departmentId: filters.departmentId,
      typeId: filters.typeId,
      priorityId: filters.priorityId,
      stageId: filters.stageId,
      assignedUserId: filters.assignedUserId,
      requesterId: filters.requesterId
    };
    return this.api.get<ApiPaginatedResponse<TicketSummary>>('/tickets', params);
  }

  getTicket(id: string): Observable<Ticket> {
    return this.api.get<Ticket>(`/tickets/${id}`);
  }

  createTicket(payload: CreateTicketRequest): Observable<Ticket> {
    return this.api.post<Ticket>('/tickets', payload);
  }

  assignTicket(id: string, payload: AssignTicketRequest): Observable<Ticket> {
    return this.api.post<Ticket>(`/tickets/${id}/assignment`, payload);
  }

  moveStage(id: string, payload: MoveTicketStageRequest): Observable<Ticket> {
    return this.api.post<Ticket>(`/tickets/${id}/transitions`, payload);
  }

  changePriority(id: string, payload: ChangeTicketPriorityRequest): Observable<Ticket> {
    return this.api.post<Ticket>(`/tickets/${id}/priority`, payload);
  }

  getComments(ticketId: string): Observable<TicketComment[]> {
    return this.api.get<TicketComment[]>(`/tickets/${ticketId}/comments`);
  }

  addComment(ticketId: string, payload: CreateCommentRequest): Observable<TicketComment> {
    return this.api.post<TicketComment>(`/tickets/${ticketId}/comments`, payload);
  }

  getHistory(ticketId: string): Observable<TicketHistoryItem[]> {
    return this.api.get<TicketHistoryItem[]>(`/tickets/${ticketId}/history`);
  }

  // Catalog methods
  getDepartments(): Observable<Department[]> {
    return this.api.get<Department[]>('/ticket-settings/departments');
  }

  getTicketTypes(departmentId?: string): Observable<TicketType[]> {
    return this.api.get<TicketType[]>('/ticket-settings/types', { departmentId });
  }

  getCategories(departmentId?: string, typeId?: string): Observable<Category[]> {
    return this.api.get<Category[]>('/ticket-settings/categories', { departmentId, typeId });
  }

  getPriorities(): Observable<Priority[]> {
    return this.api.get<Priority[]>('/ticket-settings/priorities');
  }

  createTicketType(departmentId: string, name: string): Observable<TicketType> {
    return this.api.post<TicketType>('/ticket-settings/types', { departmentId, name });
  }

  createDepartment(payload: { name: string; description?: string }): Observable<Department> {
    return this.api.post<Department>('/ticket-settings/departments', payload);
  }

  createPriority(payload: { name: string; weight: number }): Observable<Priority> {
    return this.api.post<Priority>('/ticket-settings/priorities', payload);
  }

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  createUser(payload: { name: string; email: string; password: string; roles: string[] }): Observable<User> {
    return this.api.post<User>('/users', payload);
  }

  getSlaPolicies(): Observable<{ items: any[] }> {
    return this.api.get<{ items: any[] }>('/sla-policies');
  }

  createSlaPolicy(payload: any): Observable<any> {
    return this.api.post<any>('/sla-policies', payload);
  }

  deleteSlaPolicy(id: string): Observable<any> {
    return this.api.delete<any>(`/sla-policies/${id}`);
  }

  getReportKpis(period: string = '30d', department?: string): Observable<any> {
    return this.api.get<any>('/reports/kpis', { period, department });
  }

  getReportVolume(period: string = '30d'): Observable<any> {
    return this.api.get<any>('/reports/volume', { period });
  }

  getReportDepartments(): Observable<{ items: any[] }> {
    return this.api.get<{ items: any[] }>('/reports/departments');
  }

  getReportAgents(): Observable<{ items: any[] }> {
    return this.api.get<{ items: any[] }>('/reports/agents');
  }

  getReportCsat(): Observable<any> {
    return this.api.get<any>('/reports/csat');
  }

  getNotificationSettings(): Observable<{ items: any[] }> {
    return this.api.get<{ items: any[] }>('/notifications/settings');
  }

  updateNotificationSettings(items: any[]): Observable<any> {
    return this.api.put<any>('/notifications/settings', { items });
  }

  sendTestNotification(): Observable<any> {
    return this.api.post<any>('/notifications/test', {});
  }

  getInAppNotifications(): Observable<{ items: any[]; unreadCount: number }> {
    return this.api.get<{ items: any[]; unreadCount: number }>('/notifications/in-app');
  }

  markNotificationRead(id: string): Observable<any> {
    return this.api.patch<any>(`/notifications/in-app/${id}/read`, {});
  }

  getAutomationRules(): Observable<{ items: any[] }> {
    return this.api.get<{ items: any[] }>('/automations');
  }

  createAutomationRule(payload: any): Observable<any> {
    return this.api.post<any>('/automations', payload);
  }

  updateAutomationRule(id: string, payload: any): Observable<any> {
    return this.api.put<any>(`/automations/${id}`, payload);
  }

  toggleAutomationRule(id: string): Observable<any> {
    return this.api.patch<any>(`/automations/${id}/toggle`, {});
  }

  deleteAutomationRule(id: string): Observable<any> {
    return this.api.delete<any>(`/automations/${id}`);
  }
}
