export interface LoginPayload {
  username: string;
  password: string;
}

export type UserType = 'OWNER' | 'EMPLOYEE' | 'ADMIN';

export interface AuthUser {
  id?: number;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  userType?: UserType;
  roles?: string[];
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}
