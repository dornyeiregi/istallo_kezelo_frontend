import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';

@Component({
  selector: 'app-feed-sched-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-sched-edit.html',
  styleUrls: ['./feed-sched-edit.css']
})
export class FeedSchedEditPage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;

  feedSchedId: number | null = null;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();
  items: ItemDTO[] = [];
  selectedItemIds: Set<number> = new Set();

  feedTimes = ['MORNING', 'NOON', 'EVENING'];

  form: FeedSchedDTO = {
    feedSchedId: undefined,
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
    const id = Number(this.route.snapshot.paramMap.get('feedSchedId'));
    if (!id) {
      this.error = 'Érvénytelen etetési ütemterv azonosító.';
      return;
    }

    this.feedSchedId = id;
    this.loading = true;

    forkJoin({
      feedSched: this.feedSchedService.getById(id),
      horses: this.horseService.getAll(),
      items: this.itemService.getAll()
    }).subscribe({
      next: ({ feedSched, horses, items }) => {
        this.form = {
          feedSchedId: feedSched.feedSchedId,
          feedTime: feedSched.feedTime,
          description: feedSched.description || '',
          horseIds: feedSched.horseIds || [],
          itemIds: feedSched.itemIds || []
        };

        this.horses = horses;
        this.items = items;
        this.selectedHorseIds = new Set(feedSched.horseIds || []);
        this.selectedItemIds = new Set(feedSched.itemIds || []);
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az etetési ütemtervet.';
        this.loading = false;
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

    if (!this.form.feedTime || !this.feedSchedId) {
      this.error = 'Az etetési időpont megadása kötelező.';
      return;
    }

    this.loading = true;

    const horseIds = Array.from(this.selectedHorseIds).filter(id => Number.isFinite(id));
    const itemIds = Array.from(this.selectedItemIds).filter(id => Number.isFinite(id));

    const dto: FeedSchedDTO = {
      feedSchedId: this.feedSchedId,
      feedTime: this.form.feedTime,
      description: this.form.description || '',
      horseIds,
      itemIds
    };

    this.feedSchedService.update(this.feedSchedId, dto).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(
            ['/feed-scheds', this.feedSchedId],
            { state: { fromEdit: true } }
          );
        }, 800);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült frissíteni az etetési ütemtervet.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/feed-scheds']);
  }
}
