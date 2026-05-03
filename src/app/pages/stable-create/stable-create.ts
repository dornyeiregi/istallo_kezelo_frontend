import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StableService } from '../../services/stable.service';
import { StableDTO, StableItemDTO } from '../../models/stable.model';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';

@Component({
  selector: 'app-stable-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stable-create.html',
  styleUrls: ['./stable-create.css'],
})
export class StableCreatePage implements OnInit {
  stable: StableDTO = {
    stableName: '',
    strawUsageKg: null,
    horses: [],
  } as StableDTO;
  beddingItems: ItemDTO[] = [];
  stableBeddingItems: Array<{ itemId: number | null; usageKg: number | null }> = [];

  loading = false;
  error = '';
  success = false;

  constructor(
    private stableService: StableService,
    private itemService: ItemService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/stables']);
    }
  }

  addStableBeddingRow(): void {
    this.stableBeddingItems = [...this.stableBeddingItems, { itemId: null, usageKg: null }];
  }

  removeStableBeddingRow(index: number): void {
    this.stableBeddingItems = this.stableBeddingItems.filter((_, i) => i !== index);
  }

  get totalBeddingUsage(): number {
    return this.stableBeddingItems.reduce((sum, row) => {
      const value = Number.isFinite(row.usageKg as number) ? (row.usageKg as number) : 0;
      return sum + value;
    }, 0);
  }

  onSubmit(): void {
    this.error = '';
    this.success = false;

    const stableItems = this.buildStableItems();
    if (!stableItems) {
      return;
    }

    const payload: StableDTO = {
      ...this.stable,
      strawUsageKg: stableItems.length ? this.totalBeddingUsage : null,
      stableItems,
    };

    this.loading = true;

    this.stableService.create(payload).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;

        setTimeout(() => this.router.navigate(['/stables']), 1500);
      },
      error: (err) => {
        console.error('Mentési hiba:', err);
        this.error = 'Nem sikerült létrehozni az istállót.';
        this.loading = false;
      },
    });
  }

  private loadItems(): void {
    this.itemService.getAll().subscribe({
      next: (items) => {
        this.beddingItems = items.filter(
          (item) => (item.itemType || '').toUpperCase() === 'BEDDING',
        );
      },
      error: () => {
        this.beddingItems = [];
      },
    });
  }

  private buildStableItems(): StableItemDTO[] | null {
    const seenItemIds = new Set<number>();
    const stableItems: StableItemDTO[] = [];

    for (const row of this.stableBeddingItems) {
      const hasItem = row.itemId != null;
      const hasUsage = row.usageKg != null;

      if (!hasItem && !hasUsage) {
        continue;
      }

      if (!hasItem) {
        this.error = 'Ha megadsz napi alom mennyiséget, válassz hozzá tételt is.';
        return null;
      }

      if (seenItemIds.has(row.itemId as number)) {
        this.error = 'Ugyanaz az alom tétel csak egyszer szerepelhet.';
        return null;
      }
      seenItemIds.add(row.itemId as number);

      const usage = Number.isFinite(row.usageKg as number) ? Number(row.usageKg) : 0;
      if (usage <= 0) {
        this.error = 'Minden kiválasztott alom tételhez adj meg pozitív napi mennyiséget.';
        return null;
      }

      stableItems.push({
        itemId: row.itemId as number,
        usageKg: usage,
      });
    }

    return stableItems;
  }
}
