import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedDTO, FeedSchedItemAmountDTO } from '../../models/feed-sched.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';

@Component({
  selector: 'app-feed-sched-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-sched-create.html',
  styleUrls: ['./feed-sched-create.css'],
})
/**
 * Creates feeding schedules and links them to selected horses and inventory items.
 */
export class FeedSchedCreatePage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();
  items: ItemDTO[] = [];
  selectedItemIds: Set<number> = new Set();
  nextFeedSchedId: number | null = null;
  itemAmounts: Record<number, number | null> = {};

  form: FeedSchedDTO = {
    feedMorning: false,
    feedNoon: false,
    feedEvening: false,
    description: '',
    horseIds: [],
    itemIds: [],
  };

  constructor(
    private feedSchedService: FeedSchedService,
    private horseService: HorseService,
    private itemService: ItemService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const horseIdParam = this.route.snapshot.paramMap.get('horseId');
    if (horseIdParam) {
      const id = Number(horseIdParam);
      if (!Number.isNaN(id)) {
        this.selectedHorseIds.add(id);
      }
    }

    this.loadHorses();
    this.loadItems();
    this.loadNextFeedSchedId();
  }

  loadHorses() {
    this.horseService.getAll().subscribe({
      next: (horses) => {
        this.horses = horses;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a lovakat.';
      },
    });
  }

  loadItems() {
    this.itemService.getAll().subscribe({
      next: (items) => {
        this.items = items.filter((i) => (i.itemType || '').toUpperCase() !== 'BEDDING');
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a tételeket.';
      },
    });
  }

  loadNextFeedSchedId() {
    this.feedSchedService.getAll().subscribe({
      next: (feedScheds) => {
        const maxId = feedScheds.reduce((max, fs) => Math.max(max, fs.feedSchedId || 0), 0);
        this.nextFeedSchedId = maxId + 1;
      },
      error: () => {
        this.nextFeedSchedId = null;
      },
    });
  }

  /**
   * Preserves the template binding for feed-time checkbox changes.
   */
  onFeedTimeChange() {}

  toNumber(id: any): number {
    return Number(id);
  }

  toggleHorseSelection(horseId: number) {
    horseId = Number(horseId);

    if (this.selectedHorseIds.has(horseId)) {
      this.selectedHorseIds.delete(horseId);
    } else {
      this.selectedHorseIds.add(horseId);
    }
  }

  toggleItemSelection(itemId: number) {
    itemId = Number(itemId);

    if (this.selectedItemIds.has(itemId)) {
      this.selectedItemIds.delete(itemId);
      delete this.itemAmounts[itemId];
    } else {
      this.selectedItemIds.add(itemId);
      if (!Number.isFinite(this.itemAmounts[itemId] as number)) {
        this.itemAmounts[itemId] = 1;
      }
    }
  }

  getItemsByType(type: string): ItemDTO[] {
    const key = (type || '').toUpperCase();
    return this.items.filter((i) => (i.itemType || '').toUpperCase() === key);
  }

  onSubmit() {
    this.error = null;

    if (!this.form.feedMorning && !this.form.feedNoon && !this.form.feedEvening) {
      this.error = 'Az etetési időpont megadása kötelező.';
      return;
    }

    this.loading = true;

    const horseIds = Array.from(this.selectedHorseIds).filter((id) => Number.isFinite(id));
    const itemIds = Array.from(this.selectedItemIds).filter((id) => Number.isFinite(id));
    const items: FeedSchedItemAmountDTO[] = [];

    for (const itemId of itemIds) {
      const amount = this.itemAmounts[itemId];
      if (amount == null || !Number.isFinite(amount) || amount <= 0) {
        this.loading = false;
        this.error = 'Minden kiválasztott tételhez adj meg pozitív mennyiséget.';
        return;
      }
      items.push({ itemId, amount });
    }

    const dto: FeedSchedDTO = {
      feedMorning: this.form.feedMorning,
      feedNoon: this.form.feedNoon,
      feedEvening: this.form.feedEvening,
      description: this.form.description || '',
      horseIds,
      itemIds,
      items,
    };

    this.feedSchedService.create(dto).subscribe({
      next: () => {
        this.finishSuccess();
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült létrehozni az etetési ütemtervet.';
      },
    });
  }

  getSuggestedName(): string | null {
    if (!this.nextFeedSchedId) return null;
    const parts: string[] = [];
    if (this.form.feedMorning) parts.push('REGGEL');
    if (this.form.feedNoon) parts.push('DÉL');
    if (this.form.feedEvening) parts.push('ESTE');
    if (parts.length === 0) return null;
    return `${parts.join('+')}_${this.nextFeedSchedId}`;
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/horses']);
    }
  }

  private finishSuccess() {
    this.loading = false;
    this.success = true;

    setTimeout(() => {
      const horseIdParam = this.route.snapshot.paramMap.get('horseId');
      if (horseIdParam) {
        const horseId = Number(horseIdParam);
        if (!Number.isNaN(horseId)) {
          this.horseService.getById(horseId).subscribe({
            next: (horse) => {
              this.router.navigate(['/horses', horse.horseName], { state: { horse } });
            },
            error: () => {
              this.router.navigate(['/horses']);
            },
          });
          return;
        }
      }
      this.router.navigate(['/horses']);
    }, 1000);
  }
}
