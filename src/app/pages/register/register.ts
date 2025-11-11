import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterPayload, UserType } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterPage implements OnInit {
  form!: FormGroup;
  loading = false;
  error = '';
  readonly userTypes: UserType[] = ['OWNER', 'EMPLOYEE'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      fName: ['', [Validators.required, Validators.minLength(2)]],
      lName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      userType: ['EMPLOYEE', Validators.required]
    });
  }

  submit(): void {
    if (this.loading) {
      return;
    }

    if (this.form.invalid || this.passwordsMismatch) {
      this.form.markAllAsTouched();
      return;
    }

    const trimmedFirstName = (this.form.value.fName as string).trim();
    const trimmedLastName = (this.form.value.lName as string).trim();
    const trimmedEmail = (this.form.value.email as string).trim();
    const trimmedUsername = (this.form.value.username as string).trim();

    if (trimmedFirstName.length < 2) {
      this.form.get('fName')?.setErrors({ minlength: true });
      this.form.markAllAsTouched();
      return;
    }

    if (trimmedLastName.length < 2) {
      this.form.get('lName')?.setErrors({ minlength: true });
      this.form.markAllAsTouched();
      return;
    }

    if (!trimmedEmail) {
      this.form.get('email')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    if (!trimmedUsername) {
      this.form.get('username')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    const payload: RegisterPayload = {
      fName: trimmedFirstName,
      f_name: trimmedFirstName,
      lName: trimmedLastName,
      l_name: trimmedLastName,
      email: trimmedEmail,
      phone: this.form.value.phone
        ? (this.form.value.phone as string).trim()
        : '',
      username: trimmedUsername,
      password: this.form.value.password,
      userType: this.form.value.userType as UserType
    };

    console.debug('Register payload', payload);

    this.loading = true;
    this.error = '';

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true', username: payload.username }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message || 'Nem sikerült létrehozni a felhasználót. Próbáld meg később.';
      }
    });
  }

  get passwordInvalid(): boolean {
    const control = this.form.get('password');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get emailInvalid(): boolean {
    const control = this.form.get('email');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get firstNameInvalid(): boolean {
    const control = this.form.get('fName');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get lastNameInvalid(): boolean {
    const control = this.form.get('lName');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get confirmPasswordInvalid(): boolean {
    const control = this.form.get('confirmPassword');
    return (
      !!control &&
      (control.invalid || this.passwordsMismatch) &&
      (control.dirty || control.touched)
    );
  }

  get usernameInvalid(): boolean {
    const control = this.form.get('username');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get passwordsMismatch(): boolean {
    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    return !!password && !!confirmPassword && password !== confirmPassword;
  }
}
