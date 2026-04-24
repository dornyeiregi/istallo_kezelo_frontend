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
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.css'],
})
export class RequestsPage implements OnInit {
  loading = true;
  error = '';
  pendingCount = 0;

  horseRequests: HorseDTO[] = [];
  feedSchedRequests: FeedSchedChangeRequestDTO[] = [];
  horses: HorseDTO[] = [];
  items: ItemDTO[] = [];
  stables: StableDTO[] = [];
  feedScheds: FeedSchedDTO[] = [];
  private feedSchedItemsById = new Map<number, FeedSchedItemDTO[]>();
  selectedStableByHorse: Record<number, number> = {};
  selectedFeedSchedByHorse: Record<number, number | null> = {};

  toastMessage = '';
  toastVisible = false;

  constructor(
    private horseService: HorseService,
    private feedSchedService: FeedSchedService,
    private feedSchedItemService: FeedSchedItemService,
    private itemService: ItemService,
    private stableService: StableService,
    private router: Router,
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
      },
    });

    this.horseService.getAll().subscribe({
      next: (horses) => {
        this.horses = horses;
      },
      error: () => {
        this.horses = [];
      },
    });

    this.itemService.getAll().subscribe({
      next: (items) => {
        this.items = items;
      },
      error: () => {
        this.items = [];
      },
    });

    this.feedSchedService.getChangeRequests().subscribe({
      next: (requests) => {
        this.feedSchedRequests = requests;
        this.updatePendingCount();
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az etetési kéréseket.';
      },
    });

    this.stableService.getAll().subscribe({
      next: (stables) => {
        this.stables = stables;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az istállókat.';
      },
    });

    this.feedSchedService.getAll().subscribe({
      next: (feedScheds) => {
        this.feedScheds = feedScheds;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az etetési ütemterveket.';
      },
    });

    this.feedSchedItemService.getAll().subscribe({
      next: (items) => {
        this.feedSchedItemsById = this.groupItemsByFeed(items);
      },
      error: () => {
        this.feedSchedItemsById = new Map();
      },
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
        this.horseRequests = this.horseRequests.filter((h) => h.id !== horse.id);
        this.showToast(`A(z) ${horse.horseName} jóváhagyva.`);
      },
      error: () => this.showToast('Nem sikerült jóváhagyni a kérést.'),
    });
  }

  rejectHorseRequest(horse: HorseDTO): void {
    if (!horse.id) return;
    this.horseService.rejectRequest(horse.id).subscribe({
      next: () => {
        this.horseRequests = this.horseRequests.filter((h) => h.id !== horse.id);
        this.showToast(`A(z) ${horse.horseName} elutasítva.`);
      },
      error: () => this.showToast('Nem sikerült elutasítani a kérést.'),
    });
  }

  approveFeedSchedRequest(request: FeedSchedChangeRequestDTO): void {
    if (!request.id) return;
    this.feedSchedService.approveChangeRequest(request.id).subscribe({
      next: () => {
        this.feedSchedRequests = this.feedSchedRequests.filter((r) => r.id !== request.id);
        this.showToast('Etetési kérés jóváhagyva.');
        this.refreshAndNormalizeApprovedFeedSched(request);
      },
      error: () => this.showToast('Nem sikerült jóváhagyni a kérést.'),
    });
  }

  rejectFeedSchedRequest(request: FeedSchedChangeRequestDTO): void {
    if (!request.id) return;
    this.feedSchedService.rejectChangeRequest(request.id).subscribe({
      next: () => {
        this.feedSchedRequests = this.feedSchedRequests.filter((r) => r.id !== request.id);
        this.showToast('Etetési kérés elutasítva.');
      },
      error: () => this.showToast('Nem sikerült elutasítani a kérést.'),
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

  private getFeedTimesLabel(
    feed: Pick<FeedSchedDTO, 'feedMorning' | 'feedNoon' | 'feedEvening'>,
  ): string {
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
    const labels = items.map((item) => this.formatItemLabel(item));
    return `${base} — ${labels.join(', ')}`;
  }

  getFeedTimeLabelForRequest(request: FeedSchedChangeRequestDTO): string {
    const hasFlags =
      request.requestedMorning != null ||
      request.requestedNoon != null ||
      request.requestedEvening != null;
    if (hasFlags) {
      return this.getFeedTimesLabel({
        feedMorning: !!request.requestedMorning,
        feedNoon: !!request.requestedNoon,
        feedEvening: !!request.requestedEvening,
      });
    }
    const feed = this.getFeedSchedById(request.feedSchedId);
    return feed ? this.getFeedTimesLabel(feed) : '-';
  }

  getFeedDescriptionForRequest(request: FeedSchedChangeRequestDTO): string {
    if (request.description && request.description.trim().length > 0) {
      return request.description;
    }
    const feed = this.getFeedSchedById(request.feedSchedId);
    return feed?.description || '-';
  }

  getFeedItemLabelsForRequest(request: FeedSchedChangeRequestDTO): string[] {
    const items = this.feedSchedItemsById.get(request.feedSchedId || -1) || [];
    if (request.items && request.items.length > 0) {
      return request.items.map((item) => this.formatRequestedItemLabel(item.itemId, item.amount));
    }
    if (request.itemIds && request.itemIds.length > 0) {
      return request.itemIds.map((itemId) => {
        const withAmount = items.find((item) => item.itemId === itemId);
        if (withAmount) return this.formatItemLabel(withAmount);
        return this.getItemNameById(itemId);
      });
    }
    if (!items.length) return [];
    return items.map((item) => this.formatItemLabel(item));
  }

  getHorseNamesForRequest(request: FeedSchedChangeRequestDTO): string[] {
    if (!request.horseIds || request.horseIds.length === 0) return [];
    return request.horseIds.map((id) => this.getHorseNameById(id));
  }

  private getFeedSchedById(feedSchedId: number): FeedSchedDTO | undefined {
    return this.feedScheds.find((fs) => fs.feedSchedId === feedSchedId);
  }

  private getHorseNameById(horseId: number): string {
    const found = this.horses.find((h) => h.id === horseId);
    return found?.horseName || `Ló #${horseId}`;
  }

  private getItemNameById(itemId: number): string {
    const found = this.items.find((i) => i.itemId === itemId);
    return found?.name || `Tétel #${itemId}`;
  }

  private formatRequestedItemLabel(itemId: number, amount: number | null | undefined): string {
    const name = this.getItemNameById(itemId);
    if (amount == null || !Number.isFinite(amount)) {
      return name;
    }
    return `${name} (${amount})`;
  }

  formatRequestedAt(request: FeedSchedChangeRequestDTO): string {
    if (!request.requestedAt) return '-';
    const date = new Date(request.requestedAt);
    if (Number.isNaN(date.getTime())) return request.requestedAt;
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private groupItemsByFeed(feedItems: FeedSchedItemDTO[]): Map<number, FeedSchedItemDTO[]> {
    const map = new Map<number, FeedSchedItemDTO[]>();
    feedItems.forEach((fi) => {
      const list = map.get(fi.feedSchedId) || [];
      list.push(fi);
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

  private refreshAndNormalizeApprovedFeedSched(request: FeedSchedChangeRequestDTO): void {
    forkJoin({
      feedScheds: this.feedSchedService.getAll(),
      feedItems: this.feedSchedItemService.getAll(),
    }).subscribe({
      next: ({ feedScheds, feedItems }) => {
        this.feedScheds = feedScheds;
        this.feedSchedItemsById = this.groupItemsByFeed(feedItems);
        this.normalizeApprovedFeedSched(request);
      },
      error: () => {
        this.showToast('Nem sikerült frissíteni az etetési ütemterveket.');
      },
    });
  }

  private normalizeApprovedFeedSched(request: FeedSchedChangeRequestDTO): void {
    const approved = this.getFeedSchedById(request.feedSchedId);
    if (!approved) return;

    const horseIds =
      request.horseIds && request.horseIds.length > 0 ? request.horseIds : approved.horseIds || [];

    const hasRequestedFlags =
      request.requestedMorning != null ||
      request.requestedNoon != null ||
      request.requestedEvening != null;

    const flags = hasRequestedFlags
      ? {
          feedMorning: !!request.requestedMorning,
          feedNoon: !!request.requestedNoon,
          feedEvening: !!request.requestedEvening,
        }
      : {
          feedMorning: !!approved.feedMorning,
          feedNoon: !!approved.feedNoon,
          feedEvening: !!approved.feedEvening,
        };

    const tasks: Array<Observable<unknown>> = [];

    const ensureApprovedHasHorseIds = () => {
      const mergedHorseIds = Array.from(new Set([...(approved.horseIds || []), ...horseIds]));
      if (mergedHorseIds.length === (approved.horseIds || []).length) return;
      tasks.push(
        this.feedSchedService.update(
          approved.feedSchedId!,
          this.buildFeedSchedDto(approved, mergedHorseIds),
        ),
      );
    };

    const removeHorseFromOtherFeeds = (timeKey: keyof typeof flags) => {
      if (!flags[timeKey]) return;
      this.feedScheds.forEach((feed) => {
        if (feed.feedSchedId === approved.feedSchedId) return;
        if (!feed[timeKey]) return;
        if (!feed.horseIds || feed.horseIds.length === 0) return;

        const remainingHorseIds = feed.horseIds.filter((id) => !horseIds.includes(id));
        if (remainingHorseIds.length === feed.horseIds.length) return;

        if (remainingHorseIds.length === 0) {
          tasks.push(this.feedSchedService.delete(feed.feedSchedId!));
        } else {
          tasks.push(
            this.feedSchedService.update(
              feed.feedSchedId!,
              this.buildFeedSchedDto(feed, remainingHorseIds),
            ),
          );
        }
      });
    };

    ensureApprovedHasHorseIds();
    removeHorseFromOtherFeeds('feedMorning');
    removeHorseFromOtherFeeds('feedNoon');
    removeHorseFromOtherFeeds('feedEvening');

    if (!tasks.length) return;
    forkJoin(tasks).subscribe({
      error: () => this.showToast('Nem sikerült az etetési ütemtervek szinkronizálása.'),
    });
  }

  private buildFeedSchedDto(feed: FeedSchedDTO, horseIds: number[]): FeedSchedDTO {
    const feedItems = this.feedSchedItemsById.get(feed.feedSchedId || -1) || [];
    const items = feedItems.map((item) => ({
      itemId: item.itemId,
      amount: Number.isFinite(item.amount) ? Number(item.amount) : 0,
    }));
    const itemIds =
      feed.itemIds && feed.itemIds.length > 0
        ? [...feed.itemIds]
        : items.map((item) => item.itemId);

    return {
      feedMorning: !!feed.feedMorning,
      feedNoon: !!feed.feedNoon,
      feedEvening: !!feed.feedEvening,
      description: feed.description || '',
      horseIds,
      itemIds,
      items: items.length ? items : undefined,
    };
  }
}
