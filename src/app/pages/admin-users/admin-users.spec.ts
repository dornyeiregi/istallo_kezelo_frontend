import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AdminUsersPage } from './admin-users';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('AdminUsersPage', () => {
  let fixture: ComponentFixture<AdminUsersPage>;
  let component: AdminUsersPage;
  let adminService: jasmine.SpyObj<AdminService>;
  let router: jasmine.SpyObj<Router>;
  let currentUser$: any;

  async function createComponent(currentUser: any = { username: 'anna' }) {
    currentUser$ = of(currentUser);

    await configurePageTest(AdminUsersPage, {
      providers: [
        { provide: AdminService, useValue: adminService },
        {
          provide: AuthService,
          useValue: {
            currentUser$,
          },
        },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(AdminUsersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getAllUsers',
      'updateUserRole',
      'createUser',
      'deleteUser',
    ]);

    adminService.getAllUsers.and.returnValue(of([]));
    adminService.updateUserRole.and.returnValue(of('ok'));
    adminService.createUser.and.returnValue(of('ok'));
    adminService.deleteUser.and.returnValue(of('ok'));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    currentUser$ = of({ username: 'anna' });
  });

  it('loads users on init', async () => {
    await createComponent();

    expect(adminService.getAllUsers).toHaveBeenCalled();
  });

  it('clears the list when there is no logged in user', async () => {
    await createComponent(null);

    expect(adminService.getAllUsers).not.toHaveBeenCalled();
    expect(component.users).toEqual([]);
  });

  it('filters out the current user from the loaded list', async () => {
    adminService.getAllUsers.and.returnValue(
      of([
        { userId: 1, username: 'anna', userType: 'ADMIN' },
        { userId: 2, username: 'bela', userType: 'OWNER' },
      ] as any),
    );

    await createComponent();

    expect(component.users.map((user) => user.username)).toEqual(['bela']);
  });

  it('shows load error when users cannot be fetched', async () => {
    adminService.getAllUsers.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a felhasználókat.');
    expect(component.loading).toBeFalse();
  });

  it('navigates back to the home page', async () => {
    await createComponent();

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('does not update role when the selected role matches the current one', async () => {
    await createComponent();

    component.updateRole({ userId: 1, username: 'anna', userType: 'ADMIN' } as any, 'admin');

    expect(adminService.updateUserRole).not.toHaveBeenCalled();
  });

  it('does not create user when form is invalid', async () => {
    await createComponent();

    component.createUser();

    expect(adminService.createUser).not.toHaveBeenCalled();
  });

  it('does not create user when passwords do not match', async () => {
    await createComponent();

    component.form.setValue({
      fName: 'Anna',
      lName: 'Admin',
      email: 'anna@example.com',
      phone: '+36123',
      username: 'annaadmin',
      password: 'secret123',
      confirmPassword: 'different',
      userType: 'OWNER',
    });

    component.createUser();

    expect(adminService.createUser).not.toHaveBeenCalled();
  });

  it('creates a user, resets the form and reloads the list', async () => {
    await createComponent();
    spyOn(component, 'loadUsers');
    const alertSpy = spyOn(window, 'alert');

    component.form.setValue({
      fName: 'Anna',
      lName: 'Admin',
      email: 'anna@example.com',
      phone: '+36123',
      username: 'annaadmin',
      password: 'secret123',
      confirmPassword: 'secret123',
      userType: 'EMPLOYEE',
    });

    component.showCreatePopup = true;
    component.createUser();

    expect(adminService.createUser).toHaveBeenCalledWith({
      fName: 'Anna',
      lName: 'Admin',
      email: 'anna@example.com',
      phone: '+36123',
      username: 'annaadmin',
      password: 'secret123',
      userType: 'EMPLOYEE',
    });
    expect(alertSpy).toHaveBeenCalledWith('ok');
    expect(component.showCreatePopup).toBeFalse();
    expect(component.form.get('userType')?.value).toBe('OWNER');
    expect(component.loadUsers).toHaveBeenCalled();
  });

  it('alerts when user creation fails', async () => {
    adminService.createUser.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();
    const alertSpy = spyOn(window, 'alert');

    component.form.setValue({
      fName: 'Anna',
      lName: 'Admin',
      email: 'anna@example.com',
      phone: '+36123',
      username: 'annaadmin',
      password: 'secret123',
      confirmPassword: 'secret123',
      userType: 'EMPLOYEE',
    });

    component.createUser();

    expect(alertSpy).toHaveBeenCalledWith('Nem sikerült létrehozni a felhasználót.');
  });

  it('alerts when user id is missing during role update', async () => {
    await createComponent();

    const alertSpy = spyOn(window, 'alert');

    component.updateRole({ username: 'no-id', userType: 'OWNER' } as any, 'ADMIN');

    expect(adminService.updateUserRole).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Hiányzó felhasználó azonosító.');
  });

  it('updates a user role and shows the backend response', async () => {
    await createComponent();
    const alertSpy = spyOn(window, 'alert');
    const user = { userId: 2, username: 'bela', userType: 'OWNER' } as any;

    component.updateRole(user, 'employee');

    expect(adminService.updateUserRole).toHaveBeenCalledWith(2, 'EMPLOYEE');
    expect(user.userType).toBe('EMPLOYEE');
    expect(alertSpy).toHaveBeenCalledWith('ok');
  });

  it('shows backend error text when role update fails', async () => {
    adminService.updateUserRole.and.returnValue(throwError(() => ({ error: 'Role fail' })));
    await createComponent();
    const alertSpy = spyOn(window, 'alert');

    component.updateRole({ userId: 2, username: 'bela', userType: 'OWNER' } as any, 'admin');

    expect(alertSpy).toHaveBeenCalledWith('Role fail');
  });

  it('does not delete when confirmation is cancelled', async () => {
    await createComponent();
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteUser({ userId: 2, username: 'bela' } as any);

    expect(adminService.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes a user and reloads the list after confirmation', async () => {
    await createComponent();
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'loadUsers');
    const alertSpy = spyOn(window, 'alert');

    component.deleteUser({ userId: 2, username: 'bela' } as any);

    expect(adminService.deleteUser).toHaveBeenCalledWith(2);
    expect(alertSpy).toHaveBeenCalledWith('ok');
    expect(component.loadUsers).toHaveBeenCalled();
  });

  it('alerts when user deletion fails', async () => {
    adminService.deleteUser.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();
    spyOn(window, 'confirm').and.returnValue(true);
    const alertSpy = spyOn(window, 'alert');

    component.deleteUser({ userId: 2, username: 'bela' } as any);

    expect(alertSpy).toHaveBeenCalledWith('Nem sikerült törölni a felhasználót.');
  });

  it('builds a full name from fallback fields', async () => {
    await createComponent();

    expect(
      component.getFullName({ username: 'bela', userFname: 'Bela', userLname: 'Nagy' } as any),
    ).toBe('Nagy Bela');
  });
});
