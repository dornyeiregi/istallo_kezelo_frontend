import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HorseDTO } from '../../models/horse.model';
import { FeedSchedChangeRequestDTO } from '../../models/feed-sched-change-request.model';
import { HorseService } from '../../services/horse.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedItemService } from '../../services/feed-sched-item.service';
import { FeedSchedItemDTO } from '../../models/feed-sched-item.model';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';
import { FeedSchedDTO } from '../../models/feed-sched.model';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.css']
})
export class RequestsPage implements OnInit {
  loading = true;
  error = '';
  pendingCount = 0;

  horseRequests: HorseDTO[] = [];
  feedSchedRequests: FeedSchedChangeRequestDTO[] = [];
  stables: StableDTO[] = [];
  feedScheds: FeedSchedDTO[] = [];
  private feedSchedItemsById = new Map<number, string[]>();
  selectedStableByHorse: Record<number, number> = {};
  selectedFeedSchedByHorse: Record<number, number | null> = {};

  toastMessage = '';
  toastVisible = false;

  constructor(
    private horseService: HorseService,
    private feedSchedService: FeedSchedService,
    private feedSchedItemService: FeedSchedItemService,
    private stableService: StableService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  loadRequests(): void {
    this.loading = true;
    this.error = '';

    this.horseService.getRequests().subscribe({
      next: (horses) => {
        this.horseRequests = horses;
        this.updatePendingCount();
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a ló kéréseket.';
        this.loading = false;
      }
    });

    this.feedSchedService.getChangeRequests().subscribe({
      next: (requests) => {
        this.feedSchedRequests = requests;
        this.updatePendingCount();
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az etetési kéréseket.';
      }
    });

    this.stableService.getAll().subscribe({
      next: (stables) => {
        this.stables = stables;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az istállókat.';
      }
    });

    this.feedSchedService.getAll().subscribe({
      next: (feedScheds) => {
        this.feedScheds = feedScheds;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az etetési ütemterveket.';
      }
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

  private updatePendingCount(): void {
    this.pendingCount = (this.horseRequests?.length || 0) + (this.feedSchedRequests?.length || 0);
  }

  approveHorseRequest(horse: HorseDTO): void {
    if (!horse.id) return;
    const stableId = this.selectedStableByHorse[horse.id];
    const feedSchedId = this.selectedFeedSchedByHorse[horse.id] ?? null;
    if (!stableId) {
      this.showToast('Istálló kiválasztása kötelező.');
      return;
    }
    this.horseService.approveRequest(horse.id, { stableId, feedSchedId }).subscribe({
      next: () => {
        this.horseRequests = this.horseRequests.filter(h => h.id !== horse.id);
        this.showToast(`A(z) ${horse.horseName} jóváhagyva.`);
      },
      error: () => this.showToast('Nem sikerült jóváhagyni a kérést.')
    });
  }

  rejectHorseRequest(horse: HorseDTO): void {
    if (!horse.id) return;
    this.horseService.rejectRequest(horse.id).subscribe({
      next: () => {
        this.horseRequests = this.horseRequests.filter(h => h.id !== horse.id);
        this.showToast(`A(z) ${horse.horseName} elutasítva.`);
      },
      error: () => this.showToast('Nem sikerült elutasítani a kérést.')
    });
  }

  approveFeedSchedRequest(request: FeedSchedChangeRequestDTO): void {
    if (!request.id) return;
    this.feedSchedService.approveChangeRequest(request.id).subscribe({
      next: () => {
        this.feedSchedRequests = this.feedSchedRequests.filter(r => r.id !== request.id);
        this.showToast('Etetési kérés jóváhagyva.');
      },
      error: () => this.showToast('Nem sikerült jóváhagyni a kérést.')
    });
  }

  rejectFeedSchedRequest(request: FeedSchedChangeRequestDTO): void {
    if (!request.id) return;
    this.feedSchedService.rejectChangeRequest(request.id).subscribe({
      next: () => {
        this.feedSchedRequests = this.feedSchedRequests.filter(r => r.id !== request.id);
        this.showToast('Etetési kérés elutasítva.');
      },
      error: () => this.showToast('Nem sikerült elutasítani a kérést.')
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
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
