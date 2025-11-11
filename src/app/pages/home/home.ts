import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomePage implements OnInit {
  userType: string | null = null;
  
  tiles = [
    {
      icon: 'storefront',
      title: 'Istállók',
      description: 'Kapacitás, állapot és feladatok áttekintése.',
      link: '/stables',
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      icon: 'pets',
      title: 'Lovak',
      description: 'Lóadatok, állapot és tulajdonosi információk.',
      link: '/horses'
    },
    {
      icon: 'warehouse',
      title: 'Tárolók',
      description: 'Takarmány- és eszközkészletek naprakészen tartása.',
      link: '/storages',
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      icon: 'calendar_month',
      title: 'Naptár',
      description: 'Ütemezett oltások és kezelések megtekintése.',
      link: '/calendar'
    },
    {
      icon: 'group',
      title: 'Tagok',
      description: 'Munkatársak és partnerek jogosultságainak kezelése.',
      link: '/admin/users',
      roles: ['ADMIN']
    },
    {
      icon: 'settings',
      title: 'Beállítások',
      description: 'Szervezeti és rendszerbeállítások testreszabása.',
      link: '/settings'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
      this.authService.currentUser$.subscribe(user => {
        this.userType = user?.userType || null;
      });
  }

  // segédfüggvény a felh. típus szerinti megjelenítéshez
  canViewTile(tile: any): boolean {
    if (!tile.roles || tile.roles.length === 0) return true;
    return tile.roles.includes(this.userType || '');
  }
}
