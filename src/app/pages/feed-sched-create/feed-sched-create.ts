import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';

@Component({
  selector: 'app-feed-sched-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-sched-create.html',
  styleUrls: ['./feed-sched-create.css']
})
export class FeedSchedCreatePage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();
  items: ItemDTO[] = [];
  selectedItemIds: Set<number> = new Set();

  feedTimes = ['MORNING', 'NOON', 'EVENING'];

  form: FeedSchedDTO = {
    feedTime: '',
    description: '',
    horseIds: [],
    itemIds: []
  };

  constructor(
    private feedSchedService: FeedSchedService,
    private horseService: HorseService,
    private itemService: ItemService,
    private router: Router,
    private route: ActivatedRoute
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
  }

  loadHorses() {
    this.horseService.getAll().subscribe({
      next: (horses) => {
        this.horses = horses;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a lovakat.';
      }
    });
  }

  loadItems() {
    this.itemService.getAll().subscribe({
      next: (items) => {
        this.items = items;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a tételeket.';
      }
    });
  }

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
    } else {
      this.selectedItemIds.add(itemId);
    }
  }

  getItemsByType(type: string): ItemDTO[] {
    const key = (type || '').toUpperCase();
    return this.items.filter(i => (i.itemType || '').toUpperCase() === key);
  }

  onSubmit() {
    this.error = null;

    if (!this.form.feedTime) {
      this.error = 'Az etetési időpont megadása kötelező.';
      return;
    }

    this.loading = true;

    const horseIds = Array.from(this.selectedHorseIds).filter(id => Number.isFinite(id));
    const itemIds = Array.from(this.selectedItemIds).filter(id => Number.isFinite(id));

    const dto: FeedSchedDTO = {
      feedTime: this.form.feedTime,
      description: this.form.description || '',
      horseIds,
      itemIds
    };

    this.feedSchedService.create(dto).subscribe({
      next: () => {
        this.finishSuccess();
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült létrehozni az etetési ütemtervet.';
      }
    });
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/feed-scheds']);
    }
  }

  private finishSuccess() {
    this.loading = false;
    this.success = true;

    setTimeout(() => {
      this.router.navigate(['/feed-scheds']);
    }, 1000);
  }
}
