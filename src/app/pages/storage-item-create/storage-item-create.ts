import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { StorageService } from '../../services/storage.service';
import { ItemDTO } from '../../models/item.model';
import { StorageDTO } from '../../models/storage.model';

@Component({
  selector: 'app-storage-item-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './storage-item-create.html',
  styleUrls: ['./storage-item-create.css'],
})
/**
 * Handles creation of a new inventory item and its initial storage record.
 */
export class StorageItemCreatePage {
  loading = false;
  error: string | null = null;
  success = false;

  /**
   * Backend item type values available in the item creation form.
   */
  itemTypes = ['HAY', 'FEED', 'SUPPLEMENT', 'MACHINE', 'ACCESSORY', 'BEDDING'];

  /**
   * Backend item category values available in the item creation form.
   */
  itemCategories = ['CONSUMABLE', 'OBJECT'];

  /**
   * Item types filtered by the currently selected category.
   */
  filteredItemTypes: string[] = [];

  /**
   * User-facing labels for backend item type values.
   */
  itemTypeLabels: { [key: string]: string } = {
    HAY: 'Szálas takarmány',
    FEED: 'Abraktakarmány',
    SUPPLEMENT: 'Táplálékkiegészítő',
    MACHINE: 'Gép',
    ACCESSORY: 'Kellék',
    BEDDING: 'Alom',
  };

  itemCategoryLabels: { [key: string]: string } = {
    CONSUMABLE: 'Takarmány',
    OBJECT: 'Eszköz',
  };

  form = {
    name: '',
    itemType: '',
    itemCategory: '',
    feedUnitAmount: 1,
    packageCount: 0,
    packageSize: 0,
  };

  /**
   * Calculates the initial stored amount from package count and package size.
   */
  get totalStored(): number {
    const count = Number(this.form.packageCount) || 0;
    const size = Number(this.form.packageSize) || 0;
    return count * size;
  }

  constructor(
    private itemService: ItemService,
    private storageService: StorageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.filteredItemTypes = [];
  }

  /**
   * Refreshes the available item types when the selected category changes.
   */
  onCategoryChange(): void {
    const category = this.form.itemCategory;

    if (category === 'CONSUMABLE') {
      this.filteredItemTypes = ['HAY', 'FEED', 'SUPPLEMENT'];
    } else if (category === 'OBJECT') {
      this.filteredItemTypes = ['MACHINE', 'ACCESSORY', 'BEDDING'];
    } else {
      this.filteredItemTypes = [];
    }

    this.form.itemType = '';
  }

  /**
   * Validates the form, creates the item, and creates the matching storage row.
   */
  onSubmit(): void {
    this.error = null;

    if (!this.form.name || !this.form.itemType || !this.form.itemCategory) {
      this.error = 'Minden szükséges mezőt ki kell tölteni.';
      return;
    }

    if (this.totalStored <= 0) {
      this.error = 'A tároló mennyiségnek pozitívnak kell lennie.';
      return;
    }

    if (this.form.feedUnitAmount <= 0) {
      this.error = 'Az etetési adag mennyiségnek pozitívnak kell lennie.';
      return;
    }

    this.loading = true;

    const itemDto: ItemDTO = {
      name: this.form.name,
      itemType: this.form.itemType,
      itemCategory: this.form.itemCategory,
      feedUnitAmount: this.form.feedUnitAmount,
    };

    this.itemService.create(itemDto).subscribe({
      next: (createdItem) => {
        if (!createdItem.itemId) {
          this.loading = false;
          this.error = 'Nem sikerült a tétel azonosítóját lekérni.';
          return;
        }

        const storageDto: StorageDTO = {
          itemId: createdItem.itemId,
          amountStored: this.totalStored,
          amountInUse: 0,
        };

        this.storageService.create(storageDto).subscribe({
          next: () => {
            this.loading = false;
            this.success = true;

            setTimeout(() => this.router.navigate(['/storages']), 1000);
          },
          error: () => {
            this.loading = false;
            this.error = 'A tároló létrehozása nem sikerült.';
          },
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'A tétel létrehozása nem sikerült.';
      },
    });
  }

  /**
   * Returns to the previous screen or the storage overview.
   */
  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/storages']);
    }
  }
}
