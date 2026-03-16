import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HorseService } from '../../services/horse.service';
import { StableService } from '../../services/stable.service';
import { AuthService } from '../../services/auth.service';
import { HorseDTO } from '../../models/horse.model';
import { StableDTO } from '../../models/stable.model';
import { UserDTO } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { FeedSchedItemService } from '../../services/feed-sched-item.service';
import { FeedSchedItemDTO } from '../../models/feed-sched-item.model';

@Component({
  selector: 'app-horse-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horse-create.html',
  styleUrls: ['./horse-create.css']
})
export class HorseCreatePage implements OnInit {

  horse: Partial<HorseDTO> = {
    horseName: '',
    dob: '',
    sex: undefined,
    passportNum: '',
    microchipNum: '',
    additional: '',
    stableName: '',
    ownerId: undefined,
    feedSchedId: undefined
  };

  stables: StableDTO[] = [];
  users: UserDTO[] = [];
  feedScheds: FeedSchedDTO[] = [];
  private feedSchedItemsById = new Map<number, string[]>();
  loading = false;
  error = '';
  success = false;

  preselectStableName: string | null = null;

  constructor(
    private horseService: HorseService,
    private stableService: StableService,
    private userService: UserService,
    private authService: AuthService,
    private feedSchedService: FeedSchedService,
    private feedSchedItemService: FeedSchedItemService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.preselectStableName = history.state['preselectStableName'] || null;

    if (this.preselectStableName) {
      this.horse.stableName = this.preselectStableName;
    }

    if (this.isAdmin) {
      this.stableService.getAll().subscribe({
        next: (data) => (this.stables = data),
        error: () => (this.error = 'Nem sikerült betölteni az istállókat.')
      });

      this.feedSchedService.getAll().subscribe({
        next: (data) => (this.feedScheds = data),
        error: () => (this.error = 'Nem sikerült betölteni az etetési ütemterveket.')
      });

      this.feedSchedItemService.getAll().subscribe({
        next: (items) => {
          this.feedSchedItemsById = this.groupItemsByFeed(items);
        },
        error: () => {
          this.feedSchedItemsById = new Map();
        }
      });
    }

    if (this.isAdmin) {
      this.userService.getAll().subscribe({
        next: (data) => (this.users = data),
        error: () => (this.error = 'Nem sikerült betölteni a felhasználókat.')
      });
    }
  }

  get isAdmin(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/horses']);
    }
  }

  onSubmit(): void {
    this.error = '';
    this.success = false;
    this.loading = true;

    this.horseService.create(this.horse as HorseDTO).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/horses'], { state: { requestSent: true } });
        }, 1200);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Nem sikerült létrehozni a lovat.';
        this.loading = false;
      }
    });
  }

  getFeedSchedDisplayName(feed: FeedSchedDTO): string {
    const timeLabel = this.getFeedTimesLabel(feed);
    const idPart = feed.feedSchedId != null ? `_${feed.feedSchedId}` : '';
    return `${timeLabel}${idPart}`;
  }

  private getFeedTimesLabel(feed: FeedSchedDTO): string {
    const parts: string[] = [];
    if (feed.feedMorning) parts.push('REGGEL');
    if (feed.feedNoon) parts.push('DÉL');
    if (feed.feedEvening) parts.push('ESTE');
    return parts.length ? parts.join('+') : '-';
  }

  getFeedSchedSelectLabel(feed: FeedSchedDTO): string {
    const base = this.getFeedSchedDisplayName(feed);
    const items = this.feedSchedItemsById.get(feed.feedSchedId || -1) || [];
    if (!items.length) return base;
    return `${base} — ${items.join(', ')}`;
  }

  private groupItemsByFeed(feedItems: FeedSchedItemDTO[]): Map<number, string[]> {
    const map = new Map<number, string[]>();
    feedItems.forEach(fi => {
      const list = map.get(fi.feedSchedId) || [];
      list.push(this.formatItemLabel(fi));
      map.set(fi.feedSchedId, list);
    });
    return map;
  }

  private formatItemLabel(item: FeedSchedItemDTO): string {
    const amount = item.amount;
    if (amount == null || !Number.isFinite(amount)) {
      return item.itemName;
    }
    return `${item.itemName} (${amount})`;
  }
}
