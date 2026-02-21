export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isApproved: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: { field: string; message: string }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}