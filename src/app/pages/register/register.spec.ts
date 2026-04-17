import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterPage } from './register';
import { AuthService } from '../../services/auth.service';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not submit when form is invalid', () => {
    component.submit();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('blocks when passwords do not match', () => {
    component.form.setValue({
      fName: 'A',
      lName: 'B',
      email: 'a@b.com',
      phone: '',
      username: 'abc',
      password: 'password',
      confirmPassword: 'different',
      userType: 'OWNER'
    });

    component.submit();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('submits trimmed payload and navigates on success', () => {
    authService.register.and.returnValue(of(null as any));

    component.form.setValue({
      fName: '  Anna ',
      lName: '  Kovacs ',
      email: '  anna@ex.com ',
      phone: ' 123 ',
      username: '  annak ',
      password: 'password1',
      confirmPassword: 'password1',
      userType: 'OWNER'
    });

    component.submit();

    expect(authService.register).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { registered: 'true', username: 'annak' }
    });
  });

  it('shows error on failed registration', () => {
    authService.register.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));

    component.form.setValue({
      fName: 'Anna',
      lName: 'Kovacs',
      email: 'anna@ex.com',
      phone: '',
      username: 'annak',
      password: 'password1',
      confirmPassword: 'password1',
      userType: 'OWNER'
    });

    component.submit();

    expect(component.error).toBe('fail');
  });
});
