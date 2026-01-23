import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { AuthService } from '../../services/auth.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedItemService } from '../../services/feed-sched-item.service';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { FeedSchedItemDTO } from '../../models/feed-sched-item.model';

@Component({
  selector: 'app-feed-scheds',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './feed-scheds.html',
  styleUrls: ['./feed-scheds.css']
})
export class FeedSchedsPage implements OnInit {
  feedScheds: FeedSchedDTO[] = [];
  loading = true;
  error = '';
  editMode = false;
  deleteMode = false;
  confirmDelete: FeedSchedDTO | null = null;
  toastMessage = '';
  toastVisible = false;

  constructor(
    private feedSchedService: FeedSchedService,
    private router: Router,
    private authService: AuthService,
    private feedSchedItemService: FeedSchedItemService
  ) {}

  ngOnInit(): void {
    this.loadFeedScheds();
  }

  loadFeedScheds(): void {
    this.loading = true;

    forkJoin([
      this.feedSchedService.getAll(),
      this.feedSchedItemService.getAll()
    ]).subscribe({
      next: ([feedScheds, feedItems]) => {
        const itemsByFeed = this.groupItemsByFeed(feedItems);

        this.feedScheds = feedScheds
          .map(f => {
            const itemNames = itemsByFeed.get(f.feedSchedId || -1) || [];
            return {
              ...f,
              itemIds: f.itemIds || [],
              itemNames
            } as FeedSchedDTO;
          })
          .sort((a, b) =>
            (b.feedSchedId || 0) - (a.feedSchedId || 0)
          );
        this.loading = false;
        this.error = '';
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az etetési ütemterveket.';
        this.loading = false;
      }
    });
  }

  private groupItemsByFeed(feedItems: FeedSchedItemDTO[]): Map<number, string[]> {
    const map = new Map<number, string[]>();
    feedItems.forEach(fi => {
      const list = map.get(fi.feedSchedId) || [];
      list.push(fi.itemName);
      map.set(fi.feedSchedId, list);
    });
    return map;
  }

  addFeedSched(): void {
    this.router.navigate(['/feed-scheds/new']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.deleteMode = false;
      this.confirmDelete = null;
      this.toastVisible = false;
    }
  }

  onCardClick(feed: FeedSchedDTO): void {
    if (this.deleteMode) {
      this.confirmDelete = feed;
      return;
    }

    if (this.editMode) {
      if (feed.feedSchedId != null) {
        this.router.navigate(['/feed-scheds/edit', feed.feedSchedId]);
      }
      this.editMode = false;
      return;
    }

    if (feed.feedSchedId != null) {
      this.router.navigate(['/feed-scheds', feed.feedSchedId]);
    }
  }

  performDelete() {
    if (!this.confirmDelete?.feedSchedId) return;

    this.feedSchedService.delete(this.confirmDelete.feedSchedId).subscribe({
      next: () => {
        this.showToast(`Az etetési ütemterv törölve.`);
        this.feedScheds = this.feedScheds.filter(f => f.feedSchedId !== this.confirmDelete!.feedSchedId);
        this.confirmDelete = null;
        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni az ütemtervet.');
        this.confirmDelete = null;
        this.deleteMode = false;
      }
    });
  }

  cancelDelete() {
    this.confirmDelete = null;
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  get crudActions() {
    const isAllowed = this.authService.hasAnyRole([
      'ADMIN',
      'OWNER',
      'ROLE_ADMIN',
      'ROLE_OWNER'
    ]);

    if (!isAllowed) return [];

    return [
      {
        label: 'Új etetési ütemterv',
        icon: 'fa-circle-plus',
        onClick: () => {
          this.editMode = false;
          this.deleteMode = false;
          this.confirmDelete = null;
          this.addFeedSched();
        }
      },
      {
        label: 'Szerkesztés',
        icon: 'fa-pen-to-square',
        onClick: () => this.toggleEditMode()
      },
      {
        label: 'Törlés mód',
        icon: 'fa-trash',
        onClick: () => {
          this.deleteMode = !this.deleteMode;
          this.editMode = false;
          this.confirmDelete = null;
          this.toastVisible = false;
        }
      }
    ];
  }

  feedTimeLabels: { [key: string]: string } = {
    MORNING: 'Reggel',
    NOON: 'Dél',
    EVENING: 'Este'
  };

  getFeedTimeLabel(feed: FeedSchedDTO): string {
    return this.feedTimeLabels[feed.feedTime] || feed.feedTime;
  }
}
