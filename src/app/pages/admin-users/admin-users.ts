import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { UserDTO } from '../../models/user.model';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsersPage implements OnInit, OnDestroy {

  private sub?: Subscription;
  users: UserDTO[] = [];
  loading = false;
  error = '';
  currentUsername: string | null = null;

  showCreatePopup = false;

  form: FormGroup = new FormGroup({
    fName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    lName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl(''),
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
    userType: new FormControl('OWNER', Validators.required)
  });

  get f() {
    return this.form.controls;
  }

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe(user => {
      this.currentUsername = user?.username || null;

      if (user) {
        this.loadUsers();
      } else {
        this.users = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data.filter(u => u.username !== this.currentUsername);
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a felhasználókat.';
        this.loading = false;
      }
    });
  }

  updateRole(user: UserDTO, newRole: string): void {
    if (user.userType === newRole) return;

    this.adminService.updateUserRole(user.userId!, newRole).subscribe({
      next: (res) => {
        user.userType = newRole as any;
        alert(res);
      },
      error: () => alert('Sikertelen módosítás.')
    });
  }

  passwordsMismatch(): boolean {
    return this.f['password'].value !== this.f['confirmPassword'].value;
  }

  createUser(): void {
    if (this.form.invalid || this.passwordsMismatch()) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = {
      fName: this.f['fName'].value,
      lName: this.f['lName'].value,
      email: this.f['email'].value,
      phone: this.f['phone'].value,
      username: this.f['username'].value,
      password: this.f['password'].value,
      userType: this.f['userType'].value
    };

    this.adminService.createUser(dto).subscribe({
      next: (res) => {
        alert(res);
        this.showCreatePopup = false;
        this.form.reset({
          userType: 'OWNER'
        });
        this.loadUsers();
      },
      error: () => alert('Nem sikerült létrehozni a felhasználót.')
    });
  }

  deleteUser(user: UserDTO): void {
    if (!confirm(`Biztosan törlöd a felhasználót? (${user.username})`)) return;

    this.adminService.deleteUser(user.userId!).subscribe({
      next: (res) => {
        alert(res);
        this.loadUsers();
      },
      error: () => alert('Nem sikerült törölni a felhasználót.')
    });
  }

  getFullName(user: UserDTO): string {
    if (user.fullName) return user.fullName;

    const first = user.userFname
      ?? user.fName
      ?? user.firstName
      ?? (user as any).firstname
      ?? (user as any).f_name
      ?? (user as any).user_fname
      ?? '';

    const last = user.userLname
      ?? user.lName
      ?? user.lastName
      ?? (user as any).lastname
      ?? (user as any).l_name
      ?? (user as any).user_lname
      ?? '';

    const full = [first, last].filter(Boolean).join(' ').trim();
    return full || user.username || '-';
  }
}
