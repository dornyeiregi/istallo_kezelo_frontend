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
      icon: 'fa-house',
      title: 'Istállók',
      description: 'Kapacitás, állapot és feladatok áttekintése.',
      link: '/stables',
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      icon: 'fa-horse-head',
      title: 'Lovak',
      description: 'Lóadatok, állapot és tulajdonosi információk.',
      link: '/horses'
    },
    {
      icon: 'fa-warehouse',
      title: 'Tárolók',
      description: 'Takarmány- és eszközkészletek naprakészen tartása.',
      link: '/storages',
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      icon: 'fa-syringe',
      title: 'Oltások',
      description: 'Megtörtént oltások archívuma',
      link: '/shots',
      roles: ['ADMIN']
    },
    {
      icon: 'fa-briefcase-medical',
      title: 'Kezelések',
      description: 'Rögzített kezelések áttekintése.',
      link: '/treatments',
      roles: ['ADMIN']
    },
    {
      icon: 'fa-hammer',
      title: 'Patkolási időpontok',
      description: 'Patkolások és karbantartások listája.',
      link: '/farrier-apps',
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      icon: 'fa-bowl-rice',
      title: 'Etetési ütemtervek',
      description: 'Napi etetési ütemezések kezelése.',
      link: '/feed-scheds',
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      icon: 'fa-calendar-days',
      title: 'Naptár',
      description: 'Ütemezett oltások és kezelések megtekintése.',
      link: '/calendar'
    },
    {
      icon: 'fa-user-group',
      title: 'Tagok',
      description: 'Munkatársak és partnerek jogosultságainak kezelése.',
      link: '/admin/users',
      roles: ['ADMIN']
    },
    {
      icon: 'fa-gear',
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
