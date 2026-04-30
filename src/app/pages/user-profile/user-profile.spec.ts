import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserProfilePage } from './user-profile';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('UserProfilePage', () => {
  let fixture: ComponentFixture<UserProfilePage>;
  let component: UserProfilePage;
  let authService: {
    currentUser$: any;
    updateStoredUser: jasmine.Spy;
    changePassword: jasmine.Spy;
  };
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent(user: any) {
    authService.currentUser$ = of(user);

    await configurePageTest(UserProfilePage, {
      emptyTemplate: true,
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(UserProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    authService = {
      currentUser$: of(null),
      updateStoredUser: jasmine.createSpy('updateStoredUser'),
      changePassword: jasmine.createSpy('changePassword').and.returnValue(of('ok')),
    };
    userService = jasmine.createSpyObj<UserService>('UserService', ['getByUsername', 'update']);
    userService.getByUsername.and.returnValue(
      of({
        userId: 1,
        username: 'anna',
        email: 'anna@example.com',
        phone: '123',
        userType: 'OWNER',
        userFname: 'Anna',
        userLname: 'Nagy',
      } as any),
    );
    userService.update.and.returnValue(of({ userId: 1 } as any));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  });

  it('shows error when there is no logged in user', async () => {
    await createComponent(null);

    expect(component.error).toBe('Nem található bejelentkezett felhasználó.');
    expect(component.loading).toBeFalse();
  });

  it('shows error when user details cannot be loaded', async () => {
    userService.getByUsername.and.returnValue(throwError(() => new Error('fail')));

    await createComponent({ username: 'anna' });

    expect(component.error).toBe('Nem sikerült betölteni a felhasználói adatokat.');
    expect(component.loading).toBeFalse();
  });

  it('requires email before saving profile', async () => {
    await createComponent({ username: 'anna' });

    component.form.email = '';
    component.saveProfile();

    expect(userService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Az email megadása kötelező.');
  });

  it('updates stored user data after successful profile save', async () => {
    await createComponent({ username: 'anna', fullName: 'Nagy Anna' });

    component.form.firstName = 'Anna';
    component.form.lastName = 'Teszt';
    component.form.email = 'new@example.com';
    component.form.phone = '456';
    component.saveProfile();

    expect(userService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ email: 'new@example.com', phone: '456' }),
    );
    expect(authService.updateStoredUser).toHaveBeenCalledWith(
      jasmine.objectContaining({ email: 'new@example.com', phone: '456', fullName: 'Teszt Anna' }),
    );
    expect(component.successMessage).toBe('Adatok sikeresen frissítve.');
    expect(component.editMode).toBeFalse();
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

  it('shows error when profile update fails', async () => {
    userService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent({ username: 'anna' });

    component.form.email = 'anna@example.com';
    component.saveProfile();

    expect(component.error).toBe('Nem sikerült frissíteni a felhasználói adatokat.');
    expect(component.loading).toBeFalse();
  });

  it('toggles edit mode, clears password mode and restores the form from the loaded user', async () => {
    await createComponent({ username: 'anna' });

    component.passwordMode = true;
    component.successMessage = 'régi üzenet';
    component.form.firstName = 'Más';
    component.toggleEditMode();

    expect(component.editMode).toBeTrue();
    expect(component.passwordMode).toBeFalse();
    expect(component.successMessage).toBe('');
    expect(component.form.firstName).toBe('Anna');
    expect(component.form.lastName).toBe('Nagy');
  });

  it('toggles password mode, clears errors and resets the password form', async () => {
    await createComponent({ username: 'anna' });

    component.editMode = true;
    component.successMessage = 'régi üzenet';
    component.error = 'régi hiba';
    component.passwordForm = {
      currentPassword: 'old',
      newPassword: 'newpassword',
      confirmPassword: 'newpassword',
    };

    component.togglePasswordMode();

    expect(component.passwordMode).toBeTrue();
    expect(component.editMode).toBeFalse();
    expect(component.successMessage).toBe('');
    expect(component.error).toBeNull();
    expect(component.passwordForm).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });

  it('exposes a fallback full name when only username is available', async () => {
    userService.getByUsername.and.returnValue(
      of({
        userId: 1,
        username: 'anna',
        email: 'anna@example.com',
        userType: 'OWNER',
      } as any),
    );

    await createComponent({ username: 'anna' });

    expect(component.fullName).toBe('anna');
  });

  it('requires current and new password before change', async () => {
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

  it('requires a sufficiently long new password', async () => {
    await createComponent({ username: 'anna' });

    component.passwordForm = {
      currentPassword: 'oldpass123',
      newPassword: 'short',
      confirmPassword: 'short',
    };
    component.savePassword();

    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(component.error).toBe('Az új jelszó legalább 8 karakter legyen.');
  });

  it('validates password confirmation before change', async () => {
    await createComponent({ username: 'anna' });

    component.passwordForm = {
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'otherpass123',
    };
    component.savePassword();

    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(component.error).toBe('Az új jelszavak nem egyeznek.');
  });

  it('resets password form after successful password change', async () => {
    await createComponent({ username: 'anna' });

    component.passwordMode = true;
    component.passwordForm = {
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    };
    component.savePassword();

    expect(authService.changePassword).toHaveBeenCalledWith('oldpass123', 'newpass123');
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
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    };
    component.savePassword();

    expect(component.error).toBe('Nem sikerült módosítani a jelszót.');
    expect(component.loading).toBeFalse();
  });

  it('navigates back to the home page', async () => {
    await createComponent({ username: 'anna' });

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
