import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('adds Authorization header when token exists', (done) => {
    authService.getToken.and.returnValue('tkn');
    const req = new HttpRequest('GET', '/api/test');

    const next = (r: HttpRequest<any>) => {
      expect(r.headers.get('Authorization')).toBe('Bearer tkn');
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe(() => done());
    });
  });

  it('logs out and redirects on 401', (done) => {
    authService.getToken.and.returnValue(null);
    const req = new HttpRequest('GET', '/api/test');

    const next = () =>
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe({
        error: () => {
          expect(authService.logout).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        },
      });
    });
  });
});
