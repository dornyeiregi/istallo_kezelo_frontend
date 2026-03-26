import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';
import { FeedSchedItemService } from '../../services/feed-sched-item.service';
import { FeedSchedItemDTO } from '../../models/feed-sched-item.model';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-feed-sched-profile',
  standalone: true,
  imports: [CommonModule, CrudMenuComponent],
  templateUrl: './feed-sched-profile.html',
  styleUrls: ['./feed-sched-profile.css']
})
export class FeedSchedProfilePage implements OnInit {
  feedSched?: FeedSchedDTO;
  loading = true;
  error: string | null = null;
  horses: HorseDTO[] = [];
  assignedHorses: HorseDTO[] = [];
  items: ItemDTO[] = [];
  assignedItems: ItemDTO[] = [];
  feedItems: FeedSchedItemDTO[] = [];
  private amountByItemId = new Map<number, number>();

  editHorsesMode = false;
  selectedHorseIds: Set<number> = new Set();
  selectedItemIds: Set<number> = new Set();
  saving = false;
  successMessage = '';

  itemTypeLabels: { [key: string]: string } = {
    HAY: 'Szálas takarmány',
    FEED: 'Abraktakarmány',
    SUPPLEMENT: 'Táplálékkiegészítő',
    MACHINE: 'Gép',
    ACCESSORY: 'Kellék',
    BEDDING: 'Alom'
  };

  constructor(
    private route: ActivatedRoute,
    private feedSchedService: FeedSchedService,
    private horseService: HorseService,
    private itemService: ItemService,
    private feedSchedItemService: FeedSchedItemService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('feedSchedId'));
    if (!id) {
      this.error = 'Érvénytelen etetési ütemterv azonosító.';
      this.loading = false;
      return;
    }

    this.loadFeedSched(id);
  }

  loadFeedSched(id: number): void {
    this.loading = true;

    this.feedSchedService.getById(id).subscribe({
      next: (data) => {
        this.feedSched = data;

        forkJoin([
          this.horseService.getAll(),
          this.itemService.getAll(),
          this.feedSchedItemService.getAll()
        ]).subscribe({
          next: ([horses, items, feedItems]) => {
            this.horses = horses;
            this.items = items;
            this.feedItems = feedItems.filter(f => f.feedSchedId === id);
            this.amountByItemId = new Map(
              this.feedItems
                .filter(f => f.itemId != null && f.amount != null)
                .map(f => [Number(f.itemId), Number(f.amount)])
            );

            this.selectedHorseIds = new Set(this.feedSched!.horseIds || []);
            this.selectedItemIds = new Set(this.feedSched!.itemIds || []);

            this.updateAssignedHorses();
            this.updateAssignedItems();

            this.loading = false;
          },
          error: () => {
            this.error = 'Nem sikerült betölteni az adatokat.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az etetési ütemtervet.';
        this.loading = false;
      }
    });
  }

  private updateAssignedHorses() {
    this.assignedHorses = this.horses.filter(
      h => this.selectedHorseIds.has(h.id!)
    );
  }

  private updateAssignedItems() {
    this.assignedItems = this.items.filter(
      i => i.itemId != null && this.selectedItemIds.has(Number(i.itemId))
    );
  }

  goBack(): void {
    if (history.state?.fromEdit) {
      this.router.navigate(['/horses']);
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/horses']);
    }
  }

  getHorseNameById(id: number): string | null {
    const horse = this.horses.find(h => h.id === id);
    return horse ? horse.horseName : null;
  }

  getKnownHorseIds(ids?: number[] | null): number[] {
    if (!ids || ids.length === 0) return [];
    const known = new Set(this.horses.map(h => h.id));
    return ids.filter(id => known.has(id));
  }

  deleteFeedSched(): void {
    if (!this.feedSched?.feedSchedId) return;

    if (!confirm('Biztosan törlöd ezt az etetési ütemtervet?')) return;

    this.feedSchedService.delete(this.feedSched.feedSchedId).subscribe({
      next: () => {
        this.router.navigate(['/horses']);
      },
      error: () => {
        alert('Nem sikerült törölni az ütemtervet.');
      }
    });
  }

  toggleHorseAssignment(horseId: number) {
    if (this.selectedHorseIds.has(horseId)) {
      this.selectedHorseIds.delete(horseId);
    } else {
      this.selectedHorseIds.add(horseId);
    }
  }

  toggleItemAssignment(itemId: number) {
    if (this.selectedItemIds.has(itemId)) {
      this.selectedItemIds.delete(itemId);
    } else {
      this.selectedItemIds.add(itemId);
    }
  }

  saveHorseAssignments() {
    if (!this.feedSched?.feedSchedId) return;
    this.saving = true;

    const dto: Partial<FeedSchedDTO> = {
      horseIds: Array.from(this.selectedHorseIds),
      itemIds: Array.from(this.selectedItemIds)
    };

    this.feedSchedService.update(this.feedSched.feedSchedId, dto as FeedSchedDTO).subscribe({
      next: () => {
        if (this.isAdmin) {
          this.feedSched!.horseIds = Array.from(this.selectedHorseIds);
          this.feedSched!.itemIds = Array.from(this.selectedItemIds);
          this.updateAssignedHorses();
          this.updateAssignedItems();
          this.successMessage = 'Lovak sikeresen frissítve.';
        } else {
          this.successMessage = 'Kérés elküldve. Jóváhagyás után lép életbe.';
          this.loadFeedSched(this.feedSched!.feedSchedId!);
        }
        this.saving = false;
        this.editHorsesMode = false;

        setTimeout(() => this.successMessage = '', 2000);
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni a lovakat.';
        this.saving = false;
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  getFeedTimeLabel(): string {
    if (!this.feedSched) return '-';
    return this.getFeedTimesLabel(this.feedSched);
  }

  private getFeedTimesLabel(feed: FeedSchedDTO): string {
    const parts: string[] = [];
    if (feed.feedMorning) parts.push('Reggel');
    if (feed.feedNoon) parts.push('Dél');
    if (feed.feedEvening) parts.push('Este');
    return parts.length ? parts.join(' + ') : '-';
  }

  getItemTypeLabel(item: ItemDTO): string {
    const key = (item.itemType || '').toUpperCase();
    return this.itemTypeLabels[key] || item.itemType || '-';
  }

  getItemNames(): string[] {
    return this.assignedItems.map(i => this.getItemLabel(i));
  }

  getItemLabel(item: ItemDTO): string {
    const amount = this.amountByItemId.get(Number(item.itemId));
    if (amount == null || Number.isNaN(amount)) {
      return item.name;
    }
    return `${item.name} (${amount})`;
  }

  getItemsByType(type: string): ItemDTO[] {
    const key = (type || '').toUpperCase();
    return this.items.filter(i => (i.itemType || '').toUpperCase() === key);
  }

  get crudActions() {
    return [
      {
        label: 'Csatolt lovak szerkesztése',
        icon: 'fa-pen-to-square',
        onClick: () => {
          this.editHorsesMode = true;
        }
      },
      {
        label: 'Ütemterv törlése',
        icon: 'fa-trash',
        onClick: () => this.deleteFeedSched(),
      }
    ];
  }
}
