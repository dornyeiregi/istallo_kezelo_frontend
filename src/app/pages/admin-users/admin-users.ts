import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { UserDTO } from '../../models/user.model';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsersPage implements OnInit, OnDestroy {
  private sub?: Subscription;
  users: UserDTO[] = [];
  loading = false;
  error = '';
  currentUsername: string | null = null;

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
      next: (response: string) => {
        user.userType = newRole as any;
        alert(response);
      },
      error: () => {
        alert('Sikertelen módosítás.');
      }
    });
  }
}
