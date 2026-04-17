import { TestBed } from '@angular/core/testing';
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
      providers: [AuthService]
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
      roles: ['ADMIN']
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
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.hasAnyRole(['ROLE_ADMIN'])).toBeTrue();
    expect(service.hasAnyRole(['OWNER'])).toBeTrue();
    expect(service.hasAnyRole(['EMPLOYEE'])).toBeFalse();
  });

  it('consumeReturnUrl returns value once', () => {
    localStorage.setItem(RETURN_URL_KEY, '/home');
    expect(service.consumeReturnUrl()).toBe('/home');
    expect(service.consumeReturnUrl()).toBeNull();
  });

  it('loadStoredUser clears invalid JSON', () => {
    localStorage.setItem(USER_KEY, '{invalid}');
    const removeSpy = spyOn(localStorage, 'removeItem').and.callThrough();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(removeSpy).toHaveBeenCalledWith(USER_KEY);
    expect(service.isLoggedIn()).toBeFalse();
  });
});
