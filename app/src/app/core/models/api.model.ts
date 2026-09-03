export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiPaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string> | ApiErrorDetail[];
  };
}
