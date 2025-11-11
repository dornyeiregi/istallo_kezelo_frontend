import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';
import { AuthUser } from './models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="nav-left">
        <a
          routerLink="/"
          class="brand"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          StableManager
        </a>

        <!-- Navigáció, ha be van jelentkezve -->
        <ng-container *ngIf="isAuthenticated$ | async">
          <!-- <a routerLink="/" routerLinkActive="active">Kezdőlap</a> -->
          <!-- <a routerLink="/stables" routerLinkActive="active">Istállók</a>
          <a routerLink="/horses" routerLinkActive="active">Lovak</a> -->
        </ng-container>
      </div>

      <div class="nav-right">
        <!-- Felhasználónév + kijelentkezés -->
        <ng-container *ngIf="user$ | async as user; else guest">
          <span class="user-chip">{{ user.username }}</span>
          <button
            type="button"
            class="logout-button"
            (click)="logout()"
          >
            Kijelentkezés
          </button>
        </ng-container>

        <!-- Vendégnézet -->
        <ng-template #guest>
          <a
            routerLink="/login"
            class="login-link"
            routerLinkActive="active"
          >
            Bejelentkezés
          </a>
        </ng-template>
      </div>
    </nav>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: ['./app.css'],
})
export class AppComponent {
  user$!: Observable<AuthUser | null>;
  isAuthenticated$!: Observable<boolean>;

  constructor(private authService: AuthService, private router: Router) {
    // Az AuthService Observable-jeit a konstruktorban állítjuk be
    this.user$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
