import { TestBed } from '@angular/core/testing';
import { GuardResult, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { EmployeeAccessSettingsDTO } from '../models/employee-access-settings.model';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let settingsService: jasmine.SpyObj<SettingsService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isLoggedIn',
      'setReturnUrl',
      'hasAnyRole',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'createUrlTree']);
    settingsService = jasmine.createSpyObj<SettingsService>('SettingsService', [
      'getEmployeeAccess',
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: SettingsService, useValue: settingsService },
      ],
    });
  });

  it('redirects to login when not authenticated', () => {
    authService.isLoggedIn.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/protected' } as any),
    );

    expect(authService.setReturnUrl).toHaveBeenCalledWith('/protected');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/protected' },
    });
    expect(result).toBeFalse();
  });

  it('redirects to stables when role is missing', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.hasAnyRole.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ data: { roles: ['ADMIN'] } } as any, { url: '/admin' } as any),
    );

    expect(router.navigate).toHaveBeenCalledWith(['/stables']);
    expect(result).toBeFalse();
  });

  it('checks employee access setting for employees', (done) => {
    authService.isLoggedIn.and.returnValue(true);
    authService.hasAnyRole.and.callFake(
      (roles?: string[]) => Array.isArray(roles) && roles.includes('EMPLOYEE'),
    );
    const tree = {} as UrlTree;
    router.createUrlTree.and.returnValue(tree);

    const settings: EmployeeAccessSettingsDTO = { calendar: false } as any;
    settingsService.getEmployeeAccess.and.returnValue(of(settings));

    const result$ = TestBed.runInInjectionContext(() =>
      authGuard(
        { data: { employeeAccessSetting: 'calendar' } } as any,
        { url: '/calendar' } as any,
      ),
    );

    if (result$ instanceof UrlTree || typeof result$ === 'boolean') {
      fail('Expected observable');
    }

    (result$ as Observable<GuardResult>).subscribe((result) => {
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(tree);
      done();
    });
  });

  it('allows when authenticated and role is ok', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.hasAnyRole.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ data: { roles: ['ADMIN'] } } as any, { url: '/admin' } as any),
    );

    expect(result).toBeTrue();
  });
});
