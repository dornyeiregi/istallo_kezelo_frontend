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

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  fName: string;
  lName: string;
  f_name?: string;
  l_name?: string;
  phone?: string;
  userType: UserType;
}
