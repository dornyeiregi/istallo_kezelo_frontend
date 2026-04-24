import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginPage } from './login';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.model';

const routeWithParams = (params: Record<string, string | null>) => ({
  snapshot: {
    queryParamMap: convertToParamMap(params),
  },
});

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let navigateByUrlSpy: jasmine.Spy;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'consumeReturnUrl']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: ActivatedRoute, useValue: routeWithParams({}) },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not submit when form is invalid', () => {
    component.submit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('redirects to returnUrl on successful login', () => {
    const response: AuthResponse = { token: 't', user: { id: 1, username: 'u' } as any };
    authService.login.and.returnValue(of(response));

    component.form.setValue({ username: 'u', password: 'p' });
    component.submit();

    expect(authService.login).toHaveBeenCalled();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/home');
  });

  it('shows error on failed login', () => {
    authService.login.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));

    component.form.setValue({ username: 'u', password: 'p' });
    component.submit();

    expect(component.error).toBe('fail');
  });

  it('uses explicit returnUrl from query params', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: ActivatedRoute, useValue: routeWithParams({ returnUrl: '/x' }) },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const response: AuthResponse = { token: 't', user: { id: 1, username: 'u' } as any };
    authService.login.and.returnValue(of(response));

    component.form.setValue({ username: 'u', password: 'p' });
    component.submit();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/x');
  });
});
