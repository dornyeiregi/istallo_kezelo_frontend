import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { FeedSchedService } from '../../services/feed-sched.service';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { HorseDTO } from '../../models/horse.model';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-stables',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent, RouterLink],
  templateUrl: './stables.html',
  styleUrls: ['./stables.css'],
})
export class StablesPage implements OnInit {
  stables: StableDTO[] = [];
  loading = true;
  error = '';
  editMode = false;
  editedNames: { [name: string]: string } = {};
  editedStrawUsage: { [name: string]: number | null } = {};
  dailyFeedTotals: Array<{ itemId: number; name: string; amount: number }> = [];
  dailyFeedLoading = false;

  deleteMode = false;
  confirmDeleteStable: StableDTO | null = null;

  toastMessage = '';
  toastVisible = false;

  constructor(
    private stableService: StableService,
    private router: Router,
    private feedSchedService: FeedSchedService,
    private itemService: ItemService,
  ) {}

  ngOnInit(): void {
    this.loadStables();
  }

  loadStables(): void {
    this.loading = true;

    this.stableService.getAll().subscribe({
      next: (data) => {
        this.stables = data;
        this.loadDailyFeedTotals();
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az istállókat.';
        this.loading = false;
      },
    });
  }

  addStable(): void {
    this.router.navigate(['/stables/new']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;

    if (this.editMode) {
      this.editedNames = this.stables.reduce(
        (acc, s) => {
          acc[s.stableName] = s.stableName;
          return acc;
        },
        {} as { [name: string]: string },
      );
      this.editedStrawUsage = this.stables.reduce(
        (acc, s) => {
          acc[s.stableName] = s.strawUsageKg ?? null;
          return acc;
        },
        {} as { [name: string]: number | null },
      );
    }
  }

  saveName(stable: StableDTO): void {
    const newName = this.editedNames[stable.stableName];
    const newStrawUsage = this.editedStrawUsage[stable.stableName];

    if (!newName || newName.trim() === '') return;

    if (!stable.stableId) {
      this.error = 'Hiányzik az istálló azonosítója (id)';
      return;
    }

    const dto: Partial<StableDTO> = {
      stableName: newName,
      strawUsageKg: newStrawUsage ?? null,
    };

    this.stableService.update(stable.stableId, dto).subscribe({
      next: () => {
        stable.stableName = newName;
        stable.strawUsageKg = newStrawUsage ?? null;
        this.editMode = false;
      },
      error: () => {
        this.error = 'Nem sikerült módosítani az istálló nevét.';
      },
    });
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  deleteStable(): void {
    this.deleteMode = !this.deleteMode;
    this.confirmDeleteStable = null;
  }

  confirmDelete(stable: StableDTO) {
    this.confirmDeleteStable = stable;
  }

  performDelete() {
    if (!this.confirmDeleteStable) return;

    this.stableService.delete(this.confirmDeleteStable.stableId!).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.confirmDeleteStable!.stableName} sikeresen törölve.`);

        this.loadStables();

        this.confirmDeleteStable = null;
        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni az istállót.');
        this.confirmDeleteStable = null;
        this.deleteMode = false;
      },
    });
  }

  cancelDelete() {
    this.confirmDeleteStable = null;
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  get totalHorseCount(): number {
    return this.stables.reduce((sum, stable) => {
      return sum + (stable.horses ? stable.horses.length : 0);
    }, 0);
  }

  get totalStrawUsageKg(): number {
    return this.stables.reduce((sum, stable) => {
      const usage = stable.strawUsageKg ?? 0;
      return sum + usage;
    }, 0);
  }

  get crudActions() {
    return [
      { label: 'Hozzáadás', icon: 'fa-plus', onClick: () => this.addStable() },
      { label: 'Szerkesztés', icon: 'fa-pen-to-square', onClick: () => this.toggleEditMode() },
      { label: 'Törlés', icon: 'fa-trash', onClick: () => this.deleteStable() },
    ];
  }

  private get activeHorses(): HorseDTO[] {
    return this.stables
      .flatMap((stable) => stable.horses ?? [])
      .filter((horse) => horse.isActive !== false);
  }

  private loadDailyFeedTotals(): void {
    const horses = this.activeHorses;
    if (!horses.length) {
      this.dailyFeedTotals = [];
      this.dailyFeedLoading = false;
      return;
    }

    this.dailyFeedLoading = true;
    const feedRequests = horses.map((h) => this.feedSchedService.getAllOfHorseById(h.id!));

    forkJoin({
      items: this.itemService.getAll(),
      feeds: feedRequests.length ? forkJoin(feedRequests) : of([]),
    }).subscribe({
      next: ({ items, feeds }) => {
        const totals = this.buildDailyTotals(items, feeds as FeedSchedDTO[][]);
        this.dailyFeedTotals = totals;
        this.dailyFeedLoading = false;
      },
      error: () => {
        this.dailyFeedTotals = [];
        this.dailyFeedLoading = false;
      },
    });
  }

  private buildDailyTotals(items: ItemDTO[], feedsByHorse: FeedSchedDTO[][]) {
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
}
