import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from '../models/auth.model';
import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';
const RETURN_URL_KEY = 'auth.returnUrl';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiBase = `${API_BASE_URL}/api/auth`;
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/signin`, payload).pipe(
      tap((response) => {
        this.storeToken(response.token);
        this.storeUser(response.user);
        this.currentUserSubject.next(response.user);
      }),
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/signup`, payload);
  }

  logout(): void {
    this.clearToken();
    this.clearStoredUser();
    localStorage.removeItem(RETURN_URL_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.value;
  }

  hasAnyRole(requiredRoles: string[] | undefined): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = this.currentUserSubject.value;
    if (!user) {
      return false;
    }

    if (user.roles && user.roles.some((role) => requiredRoles.includes(role))) {
      return true;
    }

    if (user.userType && requiredRoles.includes(user.userType)) {
      return true;
    }

    return false;
  }

  updateStoredUser(patch: Partial<AuthUser>): void {
    const current = this.currentUserSubject.value;
    if (!current) return;

    const next: AuthUser = {
      ...current,
      ...patch,
    };

    this.storeUser(next);
    this.currentUserSubject.next(next);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<string> {
    return this.http.post(
      `${this.apiBase}/change-password`,
      { currentPassword, newPassword },
      { responseType: 'text' },
    ) as Observable<string>;
  }

  setReturnUrl(url: string): void {
    localStorage.setItem(RETURN_URL_KEY, url);
  }

  consumeReturnUrl(): string | null {
    const url = localStorage.getItem(RETURN_URL_KEY);
    if (url) {
      localStorage.removeItem(RETURN_URL_KEY);
    }
    return url;
  }

  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  private storeUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearStoredUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  private loadStoredUser(): AuthUser | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
