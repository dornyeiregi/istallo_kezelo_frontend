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
  styleUrls: ['./storage-item-create.css']
})
export class StorageItemCreatePage {
  loading = false;
  error: string | null = null;
  success = false;

  // Backend enumok
  itemTypes = ['HAY', 'FEED', 'SUPPLEMENT', 'MACHINE', 'ACCESSORY', 'BEDDING'];
  itemCategories = ['CONSUMABLE', 'OBJECT'];

  // Szűrt típuslista
  filteredItemTypes: string[] = [];

  // Feliratok
  itemTypeLabels: { [key: string]: string } = {
    HAY: 'Szálas takarmány',
    FEED: 'Abraktakarmány',
    SUPPLEMENT: 'Táplálékkiegészítő',
    MACHINE: 'Gép',
    ACCESSORY: 'Kellék',
    BEDDING: 'Alom'
  };

  itemCategoryLabels: { [key: string]: string } = {
    CONSUMABLE: 'Takarmány',
    OBJECT: 'Eszköz'
  };

  form = {
    name: '',
    itemType: '',
    itemCategory: '',
    feedUnitAmount: 1,
    packageCount: 0,
    packageSize: 0
  };

  get totalStored(): number {
    const count = Number(this.form.packageCount) || 0;
    const size = Number(this.form.packageSize) || 0;
    return count * size;
  }

  constructor(
    private itemService: ItemService,
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.filteredItemTypes = []; // kezdetben üres
  }

  onCategoryChange(): void {
    const category = this.form.itemCategory;

    if (category === 'CONSUMABLE') {
      this.filteredItemTypes = ['HAY', 'FEED', 'SUPPLEMENT'];
    } else if (category === 'OBJECT') {
      this.filteredItemTypes = ['MACHINE', 'ACCESSORY', 'BEDDING'];
    } else {
      this.filteredItemTypes = [];
    }

    // Ha más kategóriára váltottunk, törölni kell az előző itemType-ot
    this.form.itemType = '';
  }

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
      feedUnitAmount: this.form.feedUnitAmount
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
          amountInUse: 0
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
          }
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'A tétel létrehozása nem sikerült.';
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/storages']);
    }
  }
}
