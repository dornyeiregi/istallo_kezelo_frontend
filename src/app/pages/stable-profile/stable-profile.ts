import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StableService } from '../../services/stable.service';
import { StableDTO, StableItemDTO } from '../../models/stable.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { AuthService } from '../../services/auth.service';
import { HorseDTO } from '../../models/horse.model';
import { HorseService } from '../../services/horse.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';
import { forkJoin, of } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stable-profile',
  standalone: true,
  imports: [CommonModule, CrudMenuComponent, FormsModule],
  templateUrl: './stable-profile.html',
  styleUrls: ['./stable-profile.css'],
})
export class StableProfilePage implements OnInit {
  stable?: StableDTO;
  loading = true;
  error = '';
  dailyFeedTotals: Array<{ itemId: number; name: string; amount: number }> = [];
  dailyFeedLoading = false;
  editMode = false;
  deleteMode = false;
  items: ItemDTO[] = [];
  beddingItems: ItemDTO[] = [];
  stableEditItems: Array<{ itemId: number | null; usageKg: number | null }> = [];
  stableEditError = '';

  confirmDeleteHorse: HorseDTO | null = null;
  toastMessage = '';
  toastVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stableService: StableService,
    private horseService: HorseService,
    private authService: AuthService,
    private feedSchedService: FeedSchedService,
    private itemService: ItemService,
  ) {}

  ngOnInit(): void {
    const navStable = this.router.getCurrentNavigation()?.extras.state?.['stable'] as
      | StableDTO
      | undefined;
    if (navStable) {
      this.stable = navStable;
      this.loading = false;
      this.loadDailyFeedTotals();
      this.prepareStableEdit();
      return;
    }

    const stableName = this.route.snapshot.paramMap.get('stableName');
    if (!stableName) {
      this.error = 'Nincs kiválasztott istálló.';
      this.loading = false;
      return;
    }

    this.fetchStable(stableName);
    this.loadItems();
  }

  get horseCount(): number {
    return this.activeHorses.length;
  }

  get activeHorses(): HorseDTO[] {
    if (!this.stable?.horses) return [];
    return this.stable.horses.filter((horse) => horse.isActive !== false);
  }

  get canDelete(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  get canCreateHorse(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  get canManageStable(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/stables']);
    }
  }

  private fetchStable(stableName: string): void {
    this.stableService.getAll().subscribe({
      next: (stables) => {
        this.stable = stables.find((stable) => stable.stableName === stableName);
        if (!this.stable) {
          this.error = 'Nem található ilyen nevű istálló.';
        } else {
          this.loadDailyFeedTotals();
          this.prepareStableEdit();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az istálló adatait.';
        this.loading = false;
      },
    });
  }

  private loadItems(): void {
    this.itemService.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.beddingItems = items.filter((i) => (i.itemType || '').toUpperCase() === 'BEDDING');
      },
      error: () => {
        this.items = [];
        this.beddingItems = [];
      },
    });
  }

  onHorseClick(horse: HorseDTO): void {
    if (this.deleteMode) {
      this.confirmDelete(horse);
      return;
    }

    if (this.editMode) {
      this.router.navigate(['/horses/edit', horse.id], {
        state: { returnToStable: this.stable?.stableName },
      });
    } else {
      this.router.navigate(['/horses', horse.horseName], { state: { horse } });
    }
  }

  private loadDailyFeedTotals(): void {
    const horses = this.activeHorses;
    if (!horses.length) {
      this.dailyFeedTotals = [];
      return;
    }

    this.dailyFeedLoading = true;
    const feedRequests = horses.map((h) => this.feedSchedService.getAllOfHorseById(h.id!));

    forkJoin({
      items: this.itemService.getAll(),
      feeds: feedRequests.length ? forkJoin(feedRequests) : of([]),
    }).subscribe({
      next: ({ items, feeds }) => {
        const totals = this.buildDailyTotals(items, feeds as FeedSchedDTO[][], horses);
        this.dailyFeedTotals = totals;
        this.dailyFeedLoading = false;
      },
      error: () => {
        this.dailyFeedTotals = [];
        this.dailyFeedLoading = false;
      },
    });
  }

  private buildDailyTotals(items: ItemDTO[], feedsByHorse: FeedSchedDTO[][], horses: HorseDTO[]) {
    const itemNameById = new Map<number, string>();
    items.forEach((item) => {
      if (item.itemId != null) itemNameById.set(item.itemId, item.name);
    });

    const totals = new Map<number, number>();

    const pickLatest = (feeds: FeedSchedDTO[], predicate: (f: FeedSchedDTO) => boolean) => {
      const matches = feeds.filter(predicate);
      if (matches.length === 0) return null;
      return matches.reduce((latest, current) => {
        const latestId = latest.feedSchedId ?? -1;
        const currentId = current.feedSchedId ?? -1;
        return currentId > latestId ? current : latest;
      });
    };

    const addFeed = (feed: FeedSchedDTO | null) => {
      if (!feed) return;
      if (feed.items && feed.items.length > 0) {
        feed.items.forEach((item) => {
          const id = item.itemId;
          if (id == null) return;
          const amount = Number.isFinite(item.amount) ? item.amount : 0;
          totals.set(id, (totals.get(id) || 0) + amount);
        });
        return;
      }
      if (feed.itemIds && feed.itemIds.length > 0) {
        feed.itemIds.forEach((id) => {
          totals.set(id, (totals.get(id) || 0) + 1);
        });
      }
    };

    feedsByHorse.forEach((feeds) => {
      const morning = pickLatest(feeds, (f) => !!f.feedMorning);
      const noon = pickLatest(feeds, (f) => !!f.feedNoon);
      const evening = pickLatest(feeds, (f) => !!f.feedEvening);
      addFeed(morning);
      addFeed(noon);
      addFeed(evening);
    });

    return Array.from(totals.entries())
      .map(([itemId, amount]) => ({
        itemId,
        name: itemNameById.get(itemId) || `Tétel #${itemId}`,
        amount,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.deleteMode = false;
    if (this.editMode) {
      this.prepareStableEdit();
      if (this.beddingItems.length === 0) {
        this.loadItems();
      }
    } else {
      this.stableEditError = '';
    }
  }

  toggleDeleteMode(): void {
    this.deleteMode = !this.deleteMode;
    this.editMode = false;
    this.confirmDeleteHorse = null;
  }

  confirmDelete(horse: HorseDTO): void {
    this.confirmDeleteHorse = horse;
  }

  performDelete(mode: 'delete' | 'deactivate'): void {
    if (!this.confirmDeleteHorse?.id) return;

    const action$ =
      mode === 'deactivate'
        ? this.horseService.deactivate(this.confirmDeleteHorse.id)
        : this.horseService.delete(this.confirmDeleteHorse.id);

    action$.subscribe({
      next: () => {
        const message =
          mode === 'deactivate'
            ? `A(z) ${this.confirmDeleteHorse?.horseName} eltávolítva az istállóból.`
            : `A(z) ${this.confirmDeleteHorse?.horseName} törölve.`;
        this.showToast(message);
        this.confirmDeleteHorse = null;

        if (this.stable?.stableName) {
          this.fetchStable(this.stable.stableName);
        }

        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni a lovat.');
        this.confirmDeleteHorse = null;
        this.deleteMode = false;
      },
    });
  }

  cancelDelete(): void {
    this.confirmDeleteHorse = null;
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  private prepareStableEdit(): void {
    if (!this.stable) return;
    const items = this.stable.stableItems || [];
    this.stableEditItems = items.length
      ? items.map((link) => ({ itemId: link.itemId, usageKg: link.usageKg }))
      : [];
  }

  addStableBeddingRow(): void {
    this.stableEditItems = [...this.stableEditItems, { itemId: null, usageKg: null }];
  }

  removeStableBeddingRow(index: number): void {
    this.stableEditItems = this.stableEditItems.filter((_, i) => i !== index);
  }

  saveStableEdits(): void {
    if (!this.stable?.stableId) return;
    this.stableEditError = '';

    const seenItemIds = new Set<number>();
    const stableItems: StableItemDTO[] = [];
    for (const row of this.stableEditItems) {
      if (row.itemId == null) continue;
      if (seenItemIds.has(row.itemId)) {
        this.stableEditError = 'Ugyanaz az alom tétel csak egyszer szerepelhet.';
        return;
      }
      seenItemIds.add(row.itemId);
      const usage = Number.isFinite(row.usageKg as number) ? (row.usageKg as number) : 0;
      if (usage <= 0) {
        this.stableEditError =
          'Minden kiválasztott alom tételhez adj meg pozitív napi mennyiséget.';
        return;
      }
      stableItems.push({
        itemId: row.itemId as number,
        usageKg: usage,
      });
    }

    const dto: Partial<StableDTO> = {
      strawUsageKg: this.totalBeddingUsage,
      stableItems,
    };

    this.stableService.update(this.stable.stableId, dto).subscribe({
      next: (updated) => {
        this.stable = updated;
        this.showToast('Istálló adatok frissítve.');
        this.prepareStableEdit();
        this.loadDailyFeedTotals();
        this.editMode = false;
      },
      error: () => {
        this.stableEditError = 'Nem sikerült menteni az istálló adatokat.';
      },
    });
  }

  get totalBeddingUsage(): number {
    return this.stableEditItems.reduce((sum, row) => {
      const value = Number.isFinite(row.usageKg as number) ? (row.usageKg as number) : 0;
      return sum + value;
    }, 0);
  }

  get crudActions() {
    const actions = [
      {
        label: 'Hozzáadás',
        icon: 'fa-plus',
        onClick: () => {
          this.router.navigate(['/horses/new'], {
            state: {
              preselectStableId: this.stable?.stableId,
              preselectStableName: this.stable?.stableName,
            },
          });
        },
      },
      {
        label: 'Szerkesztés',
        icon: 'fa-pen-to-square',
        onClick: () => this.toggleEditMode(),
      },
      {
        label: 'Törlés',
        icon: 'fa-trash',
        onClick: () => this.toggleDeleteMode(),
      },
    ];

    if (!this.canManageStable) {
      return [];
    }

    return actions;
  }

  getSexLabel(sex: string | undefined): string {
    switch (sex) {
      case 'M':
        return 'Csődör';
      case 'F':
        return 'Kanca';
      case 'G':
        return 'Herélt';
      default:
        return sex ?? '';
    }
  }
}
