import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ThemeService, AppTheme } from '../../services/theme.service';
import { AuthUser } from '../../models/auth.model';
import { UserDTO } from '../../models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsPage implements OnInit {
  loading = true;
  error: string | null = null;
  successMessage = '';

  authUser: AuthUser | null = null;
  user: UserDTO | null = null;
  editMode = false;
  passwordMode = false;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  themes: { value: AppTheme; label: string; description: string }[] = [
    {
      value: 'rose',
      label: 'Rose',
      description: 'Rózsaszín téma'
    },
    {
      value: 'sage',
      label: 'Sage',
      description: 'Zöldes paletta'
    }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (!user) {
        this.error = 'Nem található bejelentkezett felhasználó.';
        this.loading = false;
        return;
      }

      this.authUser = user;
      this.loadUserDetails(user);
    });
  }

  private loadUserDetails(authUser: AuthUser): void {
    this.loading = true;

    this.userService.getByUsername(authUser.username).subscribe({
      next: (match) => {
        this.user = match;
        this.populateForm(match);
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a felhasználói adatokat.';
        this.loading = false;
      }
    });
  }

  private populateForm(user: UserDTO): void {
    this.form.firstName = this.getFirstName(user);
    this.form.lastName = this.getLastName(user);
    this.form.email = user.email || '';
    this.form.phone = user.phone || '';
  }

  get fullName(): string {
    if (this.user?.fullName) return this.user.fullName;
    const full = [this.getLastName(this.user), this.getFirstName(this.user)]
      .filter(Boolean)
      .join(' ')
      .trim();
    return full || this.user?.username || '-';
  }

  private getFirstName(user?: UserDTO | null): string {
    if (!user) return '';
    return (
      user.userFname ??
      user.fName ??
      user.firstName ??
      (user as any).firstname ??
      (user as any).f_name ??
      (user as any).user_fname ??
      ''
    );
  }

  private getLastName(user?: UserDTO | null): string {
    if (!user) return '';
    return (
      user.userLname ??
      user.lName ??
      user.lastName ??
      (user as any).lastname ??
      (user as any).l_name ??
      (user as any).user_lname ??
      ''
    );
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.passwordMode = false;
    }
    if (this.editMode && this.user) {
      this.populateForm(this.user);
      this.successMessage = '';
    }
  }

  togglePasswordMode(): void {
    this.passwordMode = !this.passwordMode;
    if (this.passwordMode) {
      this.editMode = false;
      this.successMessage = '';
      this.error = null;
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  }

  saveProfile(): void {
    if (!this.user?.userId) {
      this.error = 'Hiányzik a felhasználó azonosítója.';
      return;
    }

    if (!this.form.email) {
      this.error = 'Az email megadása kötelező.';
      return;
    }

    this.loading = true;
    this.error = null;

    const dto: UserDTO = {
      userId: this.user.userId,
      username: this.user.username,
      email: this.form.email,
      phone: this.form.phone,
      userType: this.user.userType,
      userFname: this.form.firstName,
      userLname: this.form.lastName,
      fName: this.form.firstName,
      lName: this.form.lastName
    };

    this.userService.update(this.user.userId, dto).subscribe({
      next: (updated) => {
        this.user = {
          ...this.user!,
          ...updated,
          userFname: this.form.firstName,
          userLname: this.form.lastName
        };

        const fullName = [this.form.lastName, this.form.firstName]
          .filter(Boolean)
          .join(' ')
          .trim();

        this.authService.updateStoredUser({
          email: this.form.email,
          phone: this.form.phone,
          fullName: fullName || this.authUser?.fullName
        });

        this.successMessage = 'Adatok sikeresen frissítve.';
        this.editMode = false;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni a felhasználói adatokat.';
        this.loading = false;
      }
    });
  }

  savePassword(): void {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
      this.error = 'A jelenlegi és az új jelszó megadása kötelező.';
      return;
    }

    if (this.passwordForm.newPassword.length < 8) {
      this.error = 'Az új jelszó legalább 8 karakter legyen.';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.error = 'Az új jelszavak nem egyeznek.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.authService.changePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Jelszó sikeresen módosítva.';
        this.passwordMode = false;
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült módosítani a jelszót.';
      }
    });
  }

  setTheme(theme: AppTheme): void {
    this.themeService.setTheme(theme);
  }

  get currentTheme(): AppTheme {
    return this.themeService.getTheme();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  get crudActions() {
    return [
      {
        label: 'Adatok szerkesztése',
        icon: 'fa-pen-to-square',
        onClick: () => this.toggleEditMode()
      },
      {
        label: 'Jelszó módosítása',
        icon: 'fa-key',
        onClick: () => this.togglePasswordMode()
      }
    ];
  }
}
