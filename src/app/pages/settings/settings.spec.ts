import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SettingsPage } from './settings';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ThemeService } from '../../services/theme.service';
import { SettingsService } from '../../services/settings.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let component: SettingsPage;
  let authService: {
    currentUser$: any;
    hasAnyRole: jasmine.Spy;
    updateStoredUser: jasmine.Spy;
    changePassword: jasmine.Spy;
  };
  let userService: jasmine.SpyObj<UserService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent(currentUser: any) {
    await configurePageTest(SettingsPage, {
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UserService, useValue: userService },
        { provide: SettingsService, useValue: settingsService },
        { provide: ThemeService, useValue: themeService },
        { provide: Router, useValue: router },
      ],
    });

    authService.currentUser$ = of(currentUser);

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    authService = {
      currentUser$: of(null),
      hasAnyRole: jasmine.createSpy('hasAnyRole').and.returnValue(false),
      updateStoredUser: jasmine.createSpy('updateStoredUser'),
      changePassword: jasmine.createSpy('changePassword').and.returnValue(of('ok')),
    };

    userService = jasmine.createSpyObj<UserService>('UserService', [
      'getByUsername',
      'update',
    ]);
    userService.getByUsername.and.returnValue(
      of({
        userId: 1,
        username: 'anna',
        email: 'anna@example.com',
        userType: 'OWNER',
      } as any),
    );
    userService.update.and.returnValue(of({ userId: 1 } as any));

    settingsService = jasmine.createSpyObj<SettingsService>('SettingsService', [
      'getEmployeeAccess',
      'updateEmployeeAccess',
    ]);
    settingsService.getEmployeeAccess.and.returnValue(
      of({
        viewShots: false,
        viewTreatments: false,
        viewFarrierApps: false,
      }),
    );
    settingsService.updateEmployeeAccess.and.returnValue(
      of({
        viewShots: true,
        viewTreatments: true,
        viewFarrierApps: true,
      }),
    );

    themeService = jasmine.createSpyObj<ThemeService>('ThemeService', ['getTheme', 'setTheme']);
    themeService.getTheme.and.returnValue('sage');

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  });

  it('shows error when there is no logged in user', async () => {
    await createComponent(null);

    expect(component.error).toBe('Nem található bejelentkezett felhasználó.');
    expect(component.loading).toBeFalse();
  });

  it('shows access error when employee access settings cannot be loaded', async () => {
    authService.hasAnyRole.and.returnValue(true);
    settingsService.getEmployeeAccess.and.returnValue(throwError(() => new Error('fail')));

    await createComponent({ username: 'anna' });

    expect(component.accessError).toBe('Nem sikerült betölteni az alkalmazotti hozzáféréseket.');
    expect(component.accessLoading).toBeFalse();
  });

  it('shows error when user details cannot be loaded', async () => {
    userService.getByUsername.and.returnValue(throwError(() => new Error('fail')));

    await createComponent({ username: 'anna' });

    expect(component.error).toBe('Nem sikerült betölteni a felhasználói adatokat.');
    expect(component.loading).toBeFalse();
  });

  it('saves profile and updates stored auth data', async () => {
    userService.update.and.returnValue(
      of({
        userId: 1,
        username: 'anna',
        email: 'new@example.com',
        phone: '+36123',
      } as any),
    );
    await createComponent({ username: 'anna', fullName: 'Old Name' });

    component.form.firstName = 'Anna';
    component.form.lastName = 'Teszt';
    component.form.email = 'new@example.com';
    component.form.phone = '+36123';
    component.editMode = true;

    component.saveProfile();

    expect(userService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({
        email: 'new@example.com',
        phone: '+36123',
        userFname: 'Anna',
        userLname: 'Teszt',
      }),
    );
    expect(authService.updateStoredUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      phone: '+36123',
      fullName: 'Teszt Anna',
    });
    expect(component.successMessage).toBe('Adatok sikeresen frissítve.');
    expect(component.editMode).toBeFalse();
    expect(component.loading).toBeFalse();
  });

  it('shows error when profile save is attempted without user id', async () => {
    userService.getByUsername.and.returnValue(
      of({
        username: 'anna',
        email: 'anna@example.com',
        userType: 'OWNER',
      } as any),
    );
    await createComponent({ username: 'anna' });

    component.saveProfile();

    expect(userService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Hiányzik a felhasználó azonosítója.');
  });

  it('shows error when profile save is attempted without email', async () => {
    await createComponent({ username: 'anna' });

    component.form.email = '';
    component.saveProfile();

    expect(userService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Az email megadása kötelező.');
  });

  it('shows error when profile update fails', async () => {
    userService.update.and.returnValue(throwError(() => new Error('fail')));
    await createComponent({ username: 'anna' });

    component.form.email = 'anna@example.com';
    component.saveProfile();

    expect(component.error).toBe('Nem sikerült frissíteni a felhasználói adatokat.');
    expect(component.loading).toBeFalse();
  });

  it('does not change password when required values are missing', async () => {
    await createComponent({ username: 'anna' });

    component.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    component.savePassword();

    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(component.error).toBe('A jelenlegi és az új jelszó megadása kötelező.');
  });

  it('does not change password when the new password is too short', async () => {
    await createComponent({ username: 'anna' });

    component.passwordForm = {
      currentPassword: 'secret123',
      newPassword: 'short',
      confirmPassword: 'short',
    };

    component.savePassword();

    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(component.error).toBe('Az új jelszó legalább 8 karakter legyen.');
  });

  it('does not change password when confirmation does not match', async () => {
    await createComponent({ username: 'anna' });

    component.passwordForm = {
      currentPassword: 'secret123',
      newPassword: 'newsecret',
      confirmPassword: 'different',
    };

    component.savePassword();

    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(component.error).toBe('Az új jelszavak nem egyeznek.');
  });

  it('shows success and resets password form after password change', async () => {
    await createComponent({ username: 'anna' });

    component.passwordMode = true;
    component.passwordForm = {
      currentPassword: 'secret123',
      newPassword: 'newsecret123',
      confirmPassword: 'newsecret123',
    };

    component.savePassword();

    expect(authService.changePassword).toHaveBeenCalledWith('secret123', 'newsecret123');
    expect(component.successMessage).toBe('Jelszó sikeresen módosítva.');
    expect(component.passwordMode).toBeFalse();
    expect(component.passwordForm).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });

  it('shows error when password change fails', async () => {
    authService.changePassword.and.returnValue(throwError(() => new Error('fail')));
    await createComponent({ username: 'anna' });

    component.passwordForm = {
      currentPassword: 'secret123',
      newPassword: 'newsecret123',
      confirmPassword: 'newsecret123',
    };

    component.savePassword();

    expect(component.error).toBe('Nem sikerült módosítani a jelszót.');
    expect(component.loading).toBeFalse();
  });

  it('saves employee access for admins and clears the success message later', async () => {
    jasmine.clock().install();
    authService.hasAnyRole.and.returnValue(true);
    await createComponent({ username: 'anna' });

    component.employeeAccess = {
      viewShots: true,
      viewTreatments: false,
      viewFarrierApps: true,
    };

    component.saveEmployeeAccess();

    expect(settingsService.updateEmployeeAccess).toHaveBeenCalledWith({
      viewShots: true,
      viewTreatments: false,
      viewFarrierApps: true,
    });
    expect(component.accessMessage).toBe('Alkalmazotti hozzáférések frissítve.');
    jasmine.clock().tick(2000);
    expect(component.accessMessage).toBe('');
    jasmine.clock().uninstall();
  });

  it('shows access error when saving employee access fails', async () => {
    authService.hasAnyRole.and.returnValue(true);
    settingsService.updateEmployeeAccess.and.returnValue(throwError(() => new Error('fail')));
    await createComponent({ username: 'anna' });

    component.saveEmployeeAccess();

    expect(component.accessError).toBe('Nem sikerült menteni az alkalmazotti hozzáféréseket.');
    expect(component.accessLoading).toBeFalse();
  });

  it('does not save employee access for non-admin users', async () => {
    await createComponent({ username: 'anna' });

    component.saveEmployeeAccess();

    expect(settingsService.updateEmployeeAccess).not.toHaveBeenCalled();
  });

  it('delegates theme changes and home navigation', async () => {
    await createComponent({ username: 'anna' });

    component.setTheme('sage');
    component.goBack();

    expect(themeService.setTheme).toHaveBeenCalledWith('sage');
    expect(component.currentTheme).toBe('sage');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
