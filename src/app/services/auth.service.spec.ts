import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { API_BASE_URL } from '../config';
import { AuthResponse, AuthUser } from '../models/auth.model';

const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';
const RETURN_URL_KEY = 'auth.returnUrl';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('stores token and user on login', () => {
    const payload = { username: 'u', password: 'p' };
    const user: AuthUser = {
      id: 1,
      username: 'u',
      roles: ['ADMIN'],
    } as AuthUser;
    const response: AuthResponse = { token: 'tkn', user };

    service.login(payload).subscribe((res) => {
      expect(res).toEqual(response);
    });

    const req = httpMock.expectOne(`${API_BASE_URL}/api/auth/signin`);
    expect(req.request.method).toBe('POST');
    req.flush(response);

    expect(localStorage.getItem(TOKEN_KEY)).toBe('tkn');
    expect(JSON.parse(localStorage.getItem(USER_KEY) || '{}')).toEqual(user);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('sends register payload without mutating auth state', () => {
    const payload = {
      fName: 'Anna',
      f_name: 'Anna',
      lName: 'Nagy',
      l_name: 'Nagy',
      email: 'anna@example.com',
      phone: '',
      username: 'anna',
      password: 'secret123',
      userType: 'OWNER' as const,
    };
    const response: AuthResponse = {
      token: 'signup-token',
      user: { id: 1, username: 'anna' } as AuthUser,
    };

    service.register(payload).subscribe((data) => {
      expect(data).toEqual(response);
    });

    const req = httpMock.expectOne(`${API_BASE_URL}/api/auth/signup`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(response);

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('logout clears storage and current user', () => {
    localStorage.setItem(TOKEN_KEY, 'tkn');
    localStorage.setItem(USER_KEY, JSON.stringify({ id: 1, username: 'u' }));
    localStorage.setItem(RETURN_URL_KEY, '/x');

    service.logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(localStorage.getItem(RETURN_URL_KEY)).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('hasAnyRole returns true for empty or undefined roles', () => {
    expect(service.hasAnyRole(undefined)).toBeTrue();
    expect(service.hasAnyRole([])).toBeTrue();
  });

  it('hasAnyRole matches roles and userType', () => {
    const user = { id: 1, username: 'u', roles: ['ROLE_ADMIN'], userType: 'OWNER' } as AuthUser;
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.hasAnyRole(['ROLE_ADMIN'])).toBeTrue();
    expect(service.hasAnyRole(['OWNER'])).toBeTrue();
    expect(service.hasAnyRole(['EMPLOYEE'])).toBeFalse();
  });

  it('updates stored user with a partial patch', () => {
    const user = { id: 1, username: 'u', email: 'old@example.com' } as AuthUser;
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    service = new AuthService(TestBed.inject(HttpClient));
    service.updateStoredUser({ email: 'new@example.com', fullName: 'Updated User' });

    expect(JSON.parse(localStorage.getItem(USER_KEY) || '{}')).toEqual({
      id: 1,
      username: 'u',
      email: 'new@example.com',
      fullName: 'Updated User',
    });
  });

  it('consumeReturnUrl returns value once', () => {
    localStorage.setItem(RETURN_URL_KEY, '/home');
    expect(service.consumeReturnUrl()).toBe('/home');
    expect(service.consumeReturnUrl()).toBeNull();
  });

  it('sets return url explicitly', () => {
    service.setReturnUrl('/settings');
    expect(localStorage.getItem(RETURN_URL_KEY)).toBe('/settings');
  });

  it('changes password as text response', () => {
    service.changePassword('old-pass', 'new-pass').subscribe((data) => {
      expect(data).toBe('ok');
    });

    const req = httpMock.expectOne(`${API_BASE_URL}/api/auth/change-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      currentPassword: 'old-pass',
      newPassword: 'new-pass',
    });
    expect(req.request.responseType).toBe('text');
    req.flush('ok');
  });

  it('loadStoredUser clears invalid JSON', () => {
    localStorage.setItem(USER_KEY, '{invalid}');

    service = new AuthService(TestBed.inject(HttpClient));

    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });
});
