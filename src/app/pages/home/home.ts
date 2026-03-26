import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HorseService } from '../../services/horse.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { SettingsService } from '../../services/settings.service';
import { StorageService } from '../../services/storage.service';
import { EmployeeAccessSettingsDTO } from '../../models/employee-access-settings.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomePage implements OnInit {
  userType: string | null = null;
  requestBadge = 0;
  storageWarningCount = 0;
  storageWarningLevel: 'NONE' | 'YELLOW' | 'RED' = 'NONE';
  employeeAccess: EmployeeAccessSettingsDTO | null = null;
  
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
      roles: ['ADMIN', 'OWNER']
    },
    {
      icon: 'fa-briefcase-medical',
      title: 'Kezelések',
      description: 'Rögzített kezelések áttekintése.',
      link: '/treatments',
      roles: ['ADMIN', 'OWNER']
    },
    {
      icon: 'fa-hammer',
      title: 'Patkolási időpontok',
      description: 'Patkolások és karbantartások listája.',
      link: '/farrier-apps',
      roles: ['ADMIN', 'EMPLOYEE', 'OWNER']
    },
    {
      icon: 'fa-calendar-days',
      title: 'Naptár',
      description: 'Ütemezett oltások és kezelések megtekintése.',
      link: '/calendar'
    },
    {
      icon: 'fa-bell',
      title: 'Kérések',
      description: 'Ló- és etetési ütemterv kérelmek kezelése.',
      link: '/requests',
      roles: ['ADMIN']
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
    private route: ActivatedRoute,
    private horseService: HorseService,
    private feedSchedService: FeedSchedService,
    private settingsService: SettingsService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
      this.authService.currentUser$.subscribe(user => {
        this.userType = user?.userType || null;
        if (this.userType === 'ADMIN') {
          this.refreshRequestBadge();
        }
        if (this.userType === 'ADMIN' || this.userType === 'EMPLOYEE') {
          this.refreshStorageWarnings();
        }
        if (this.userType === 'EMPLOYEE') {
          this.settingsService.getEmployeeAccess().subscribe({
            next: (settings) => {
              this.employeeAccess = settings;
            },
            error: () => {
              this.employeeAccess = { viewShots: false, viewTreatments: false, viewFarrierApps: false };
            }
          });
        }
      });
  }

  // segédfüggvény a felh. típus szerinti megjelenítéshez
  canViewTile(tile: any): boolean {
    if (!tile.roles || tile.roles.length === 0) return true;
    const roleMatch = tile.roles.includes(this.userType || '');
    if (!roleMatch) return false;
    if (this.userType !== 'EMPLOYEE') return true;

    if (!this.employeeAccess) return false;
    switch (tile.link) {
      case '/shots':
        return this.employeeAccess.viewShots;
      case '/treatments':
        return this.employeeAccess.viewTreatments;
      case '/farrier-apps':
        return this.employeeAccess.viewFarrierApps;
      default:
        return true;
    }
  }

  private refreshRequestBadge(): void {
    this.horseService.getRequests().subscribe({
      next: (horses) => {
        const horseCount = horses.length;
        this.feedSchedService.getChangeRequests().subscribe({
          next: (requests) => {
            this.requestBadge = horseCount + requests.length;
          }
        });
      }
    });
  }

  private refreshStorageWarnings(): void {
    this.storageService.getAlerts().subscribe({
      next: (alerts) => {
        this.storageWarningCount = alerts.length;
        if (alerts.some(a => a.warningLevel === 'RED')) {
          this.storageWarningLevel = 'RED';
        } else if (alerts.length > 0) {
          this.storageWarningLevel = 'YELLOW';
        } else {
          this.storageWarningLevel = 'NONE';
        }
      },
      error: () => {
        this.storageWarningCount = 0;
        this.storageWarningLevel = 'NONE';
      }
    });
  }
}
