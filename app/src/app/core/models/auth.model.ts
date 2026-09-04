export interface Tenant {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceIdentifier?: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
  sessionId?: string;
  expiresAt?: string;
}

export interface UserResponse {
  user: User;
}

export interface ActiveSession {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceIdentifier: string | null;
  isCurrent: boolean;
}
