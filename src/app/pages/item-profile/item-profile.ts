import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ItemService } from '../../services/item.service';
import { StorageService } from '../../services/storage.service';
import { ItemDTO } from '../../models/item.model';
import { StorageDTO } from '../../models/storage.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';

@Component({
  selector: 'app-item-profile',
  standalone: true,
  imports: [CommonModule, CrudMenuComponent, FormsModule],
  templateUrl: './item-profile.html',
  styleUrls: ['./item-profile.css'],
})
export class ItemProfilePage implements OnInit {
  item?: ItemDTO;
  storage?: StorageDTO;

  loading = true;
  error: string | null = null;

  // Modal állapotok
  showAddStockModal = false;
  showRemoveStockModal = false;
  showEditItemModal = false;
  showDeleteItemModal = false;

  stockChangeAmount = 0;
  addStockServings = 0;
  addStockServingKg: number | null = null;
  modalError: string | null = null;

  editItemName = '';
  editItemType: string = '';
  editItemCategory: string = '';
  editFeedUnitAmount: number | null = null;

  toastMessage = '';
  toastVisible = false;

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

  itemTypeKeys: string[] = [];
  itemCategoryKeys: string[] = [];
  filteredItemTypeKeys: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.itemTypeKeys = Object.keys(this.itemTypeLabels);
    this.itemCategoryKeys = Object.keys(this.itemCategoryLabels);

    const itemId = Number(this.route.snapshot.paramMap.get('itemId'));

    if (!itemId) {
      this.error = 'Ismeretlen tétel.';
      this.loading = false;
      return;
    }

    const navStorage = this.router.getCurrentNavigation()?.extras.state?.[
      'storage'
    ] as StorageDTO | undefined;
    if (navStorage) {
      this.storage = navStorage;
    }

    this.fetchData(itemId);
  }

  private fetchData(itemId: number): void {
    this.loading = true;
    this.error = null;

    this.itemService.getItemById(itemId).subscribe({
      next: (item) => {
        this.item = item;

        this.storageService.getAll().subscribe({
          next: (storages) => {
            this.storage = storages.find((s) => s.itemId === itemId);
            this.loading = false;
          },
          error: () => {
            this.error = 'Nem sikerült betölteni a tároló adatokat.';
            this.loading = false;
          },
        });
      },
      error: () => {
        this.error = 'A tétel nem található.';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/storages']);
    }
  }

  // ========================
  //   Számított értékek
  // ========================

  get available(): number {
    if (!this.storage) return 0;
    return (this.storage.amountStored || 0) - (this.storage.amountInUse || 0);
  }

  get estimatedDailyUse(): number {
    if (!this.storage) return 0;
    return this.storage.amountInUse || 0;
  }

  get remainingDays(): number {
    if (this.estimatedDailyUse <= 0) return Infinity;
    return this.available / this.estimatedDailyUse;
  }

  get isRemainingInfinite(): boolean {
    return !isFinite(this.remainingDays);
  }

  // ========================
  //   Készlet hozzáadása
  // ========================

  openAddStockModal(): void {
    if (!this.storage) {
      this.error = 'Ehhez a tételhez nincs tároló bejegyzés.';
      return;
    }
    this.stockChangeAmount = 0;
    this.addStockServings = 0;
    this.addStockServingKg = this.item?.feedUnitAmount ?? null;
    this.modalError = null;
    this.showAddStockModal = true;
  }

  closeAddStockModal(): void {
    this.showAddStockModal = false;
    this.modalError = null;
  }

  confirmAddStock(): void {
    if (!this.storage) {
      this.modalError = 'A mennyiségnek pozitívnak kell lennie.';
      return;
    }
    if (this.addStockServings <= 0 || !this.addStockServingKg || this.addStockServingKg <= 0) {
      this.modalError = 'Add meg az adagok számát és az adag tömegét.';
      return;
    }
    this.stockChangeAmount = this.addStockServings * this.addStockServingKg;
    if (this.stockChangeAmount <= 0) {
      this.modalError = 'A mennyiségnek pozitívnak kell lennie.';
      return;
    }

    const newStored = (this.storage.amountStored || 0) + this.stockChangeAmount;

    const dto: StorageDTO = {
      ...this.storage,
      amountStored: newStored,
    };

    this.storageService.update(this.storage.storageId!, dto).subscribe({
      next: () => {
        this.storage!.amountStored = newStored;
        this.closeAddStockModal();
        this.showToast('Készlet sikeresen hozzáadva.');
      },
      error: () => {
        this.modalError = 'Nem sikerült frissíteni a készletet.';
      }
    });
  }


  // ========================
  //   Készlet levonása
  // ========================

  openRemoveStockModal(): void {
    if (!this.storage) {
      this.error = 'Ehhez a tételhez nincs tároló bejegyzés.';
      return;
    }
    this.stockChangeAmount = 0;
    this.modalError = null;
    this.showRemoveStockModal = true;
  }

  closeRemoveStockModal(): void {
    this.showRemoveStockModal = false;
    this.modalError = null;
  }

  confirmRemoveStock(): void {
    if (!this.storage || this.stockChangeAmount <= 0) {
      this.modalError = 'A mennyiségnek pozitívnak kell lennie.';
      return;
    }

    if (this.stockChangeAmount > this.available) {
      this.modalError = 'Nem vonhatsz le több készletet, mint amennyi elérhető.';
      return;
    }

    const newStored =
      (this.storage.amountStored || 0) - this.stockChangeAmount;

    const dto: StorageDTO = {
      ...this.storage,
      amountStored: newStored,
    };

    this.storageService.update(this.storage.storageId!, dto).subscribe({
      next: () => {
        this.storage!.amountStored = newStored;
        this.closeRemoveStockModal();
        this.showToast('Készlet sikeresen levonva.');
      },
      error: () => {
        this.modalError = 'Nem sikerült frissíteni a készletet.';
      },
    });
  }

  // ========================
  //   Tétel szerkesztése
  // ========================

  openEditItemModal(): void {
    if (!this.item) return;

    this.editItemName = this.item.name;
    this.editItemType = this.item.itemType;
    this.editItemCategory = this.item.itemCategory;
    this.editFeedUnitAmount = this.item.feedUnitAmount ?? null;
    this.updateFilteredItemTypes();
    this.modalError = null;
    this.showEditItemModal = true;
  }

  closeEditItemModal(): void {
    this.showEditItemModal = false;
    this.modalError = null;
  }

  saveEditedItem(): void {
    if (!this.item || !this.item.itemId) return;

    if (!this.editItemName || this.editItemName.trim() === '') {
      this.modalError = 'A név nem lehet üres.';
      return;
    }

    if (!this.editItemType || !this.editItemCategory) {
      this.modalError = 'Típus és kategória megadása kötelező.';
      return;
    }

    if (this.editFeedUnitAmount != null && this.editFeedUnitAmount <= 0) {
      this.modalError = 'Az etetési adag mennyiségnek pozitívnak kell lennie.';
      return;
    }

    if (!this.isItemTypeAllowed(this.editItemCategory, this.editItemType)) {
      this.modalError = 'A kiválasztott típus nem engedélyezett ehhez a kategóriához.';
      return;
    }

    const dto: ItemDTO = {
      itemId: this.item.itemId,
      name: this.editItemName.trim(),
      itemType: this.editItemType as any,
      itemCategory: this.editItemCategory as any,
      feedUnitAmount: this.editFeedUnitAmount ?? null,
    };

    this.itemService.update(this.item.itemId, dto).subscribe({
      next: () => {
        this.item = {
          ...this.item!,
          name: dto.name,
          itemType: dto.itemType,
          itemCategory: dto.itemCategory,
          feedUnitAmount: dto.feedUnitAmount ?? null,
        };
        this.showToast('Tétel adatai sikeresen módosítva.');
        this.closeEditItemModal();
      },
      error: () => {
        this.modalError = 'Nem sikerült módosítani a tételt.';
      },
    });
  }

  onEditCategoryChange(): void {
    this.updateFilteredItemTypes();
    if (this.editItemType && !this.isItemTypeAllowed(this.editItemCategory, this.editItemType)) {
      this.editItemType = '';
    }
  }

  private updateFilteredItemTypes(): void {
    if (this.editItemCategory === 'CONSUMABLE') {
      this.filteredItemTypeKeys = ['HAY', 'FEED', 'SUPPLEMENT'];
      return;
    }
    if (this.editItemCategory === 'OBJECT') {
      this.filteredItemTypeKeys = ['MACHINE', 'ACCESSORY', 'BEDDING'];
      return;
    }
    this.filteredItemTypeKeys = [];
  }

  private isItemTypeAllowed(category: string, type: string): boolean {
    if (category === 'CONSUMABLE') {
      return type === 'HAY' || type === 'FEED' || type === 'SUPPLEMENT';
    }
    if (category === 'OBJECT') {
      return type === 'MACHINE' || type === 'ACCESSORY' || type === 'BEDDING';
    }
    return false;
  }

  // ========================
  //   Tétel törlése
  // ========================

  openDeleteItemModal(): void {
    this.showDeleteItemModal = true;
  }

  closeDeleteItemModal(): void {
    this.showDeleteItemModal = false;
  }

  confirmDeleteItem(): void {
    if (!this.item || !this.item.itemId) return;

    const itemId = this.item.itemId;

    const deleteItem = () => {
      this.itemService.delete(itemId).subscribe({
        next: () => {
          this.showToast('Tétel sikeresen törölve.');
          this.showDeleteItemModal = false;
          this.router.navigate(['/storages']);
        },
        error: () => {
          this.showToast('Nem sikerült törölni a tételt.');
          this.showDeleteItemModal = false;
        },
      });
    };

    if (this.storage?.storageId) {
      this.storageService.delete(this.storage.storageId).subscribe({
        next: () => {
          deleteItem();
        },
        error: () => {
          this.showToast('Nem sikerült törölni a tároló bejegyzést.');
          this.showDeleteItemModal = false;
        },
      });
    } else {
      deleteItem();
    }
  }

  // ========================
  //         Toast
  // ========================

  private showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3000);
  }

  // ========================
  //       CRUD menü
  // ========================

  get crudActions() {
    return [
      {
        label: 'Készlet hozzáadása',
        icon: 'fa-plus',
        onClick: () => this.openAddStockModal(),
      },
      {
        label: 'Készlet levonása',
        icon: 'fa-minus',
        onClick: () => this.openRemoveStockModal(),
      },
      {
        label: 'Szerkesztés',
        icon: 'fa-pen-to-square',
        onClick: () => this.openEditItemModal(),
      },
      {
        label: 'Tétel törlése',
        icon: 'fa-trash',
        onClick: () => this.openDeleteItemModal(),
      },
    ];
  }
}
