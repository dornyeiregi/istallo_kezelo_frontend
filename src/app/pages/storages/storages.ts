import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { StorageDTO } from '../../models/storage.model';
import { StorageService } from '../../services/storage.service';
import { ItemDTO } from '../../models/item.model';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-storages',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './storages.html',
  styleUrls: ['./storages.css']
})
export class StoragesPage implements OnInit {
  storages: StorageDTO[] = [];
  consumableStorages: StorageDTO[] = [];
  objectStorages: StorageDTO[] = [];
  items: ItemDTO[] = [];
  itemsMap: { [id: number]: ItemDTO } = {};

  loading = true;
  error = '';
  editMode = false;
  deleteMode = false;

  // Csak a név szerkesztéséhez
  editedNames: { [storageId: number]: string } = {};

  confirmDeleteStorage: StorageDTO | null = null;

  // Toast
  toastMessage = '';
  toastVisible = false;

  itemTypeLabels: { [key: string]: string } = {
    HAY: 'Szálas takarmány',
    FEED: 'Abraktakarmány',
    SUPPLEMENT: 'Táplálékkiegészítő',
    MACHINE: 'Gép'
  };

  itemCategoryLabels: { [key: string]: string } = {
    CONSUMABLE: 'Takarmány',
    OBJECT: 'Eszköz'
  };

  constructor(
    private storageService: StorageService,
    private itemService: ItemService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    forkJoin([
      this.storageService.getAll(),
      this.itemService.getAll()
    ]).subscribe({
      next: ([storages, items]) => {
        this.storages = storages;
        this.items = items;

        this.itemsMap = items.reduce((acc, item) => {
          if (item.itemId != null) acc[item.itemId] = item;
          return acc;
        }, {} as { [id: number]: ItemDTO });

        // Szétválasztás kategória szerint
        this.consumableStorages = this.storages.filter(
          s => this.getItemCategory(s) === 'Takarmány'
        );

        this.objectStorages = this.storages.filter(
          s => this.getItemCategory(s) === 'Eszköz'
        );

        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a tárolókat.';
        this.loading = false;
      }
    });
  }

  // ------- CRUD -------

  addItemWithStorage(): void {
    this.router.navigate(['/storages/new-item']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;

    if (this.editMode) {
      this.editedNames = this.storages.reduce((acc, s) => {
        if (s.storageId != null) {
          acc[s.storageId] = this.getItemName(s); // Jelenlegi item név
        }
        return acc;
      }, {} as { [id: number]: string });
    }
  }

  deleteStorageMode(): void {
    this.deleteMode = !this.deleteMode;
    this.confirmDeleteStorage = null;
  }

  // ------- Tároló név mentése (Item frissítés) -------

  saveStorage(storage: StorageDTO): void {
    if (!storage.storageId) return;

    const itemId = storage.itemId;
    if (!itemId) return;

    const newName = this.editedNames[storage.storageId];
    if (!newName || newName.trim().length === 0) {
      this.error = 'A név nem lehet üres.';
      return;
    }

    // teljes ItemDTO összeállítása
    const item = this.itemsMap[itemId];

    const dto: ItemDTO = {
      itemId: itemId,
      name: newName,
      itemType: item.itemType,           // 🔥 KELL
      itemCategory: item.itemCategory    // 🔥 KELL
    };

    this.itemService.update(itemId, dto).subscribe({
      next: () => {
        this.itemsMap[itemId].name = newName;
        this.showToast('Tétel neve sikeresen módosítva.');
        this.editMode = false;
      },
      error: () => {
        this.error = 'Nem sikerült módosítani a tétel nevét.';
      }
    });
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  // ------- Törlés -------

  confirmDelete(storage: StorageDTO): void {
    this.confirmDeleteStorage = storage;
  }

  performDelete(): void {
    const storage = this.confirmDeleteStorage;
    if (!storage || !storage.storageId) return;

    this.storageService.delete(storage.storageId).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.getItemName(storage)} tároló törölve.`);
        this.loadData();
        this.confirmDeleteStorage = null;
        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni a tárolót.');
        this.confirmDeleteStorage = null;
        this.deleteMode = false;
      }
    });
  }

  cancelDelete(): void {
    this.confirmDeleteStorage = null;
  }

  // ------- Toast -------

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => { this.toastVisible = false; }, 3000);
  }

  // ------- Kiíró segédmetódusok -------

  getItemName(storage: StorageDTO): string {
    const item = this.itemsMap[storage.itemId];
    return item ? item.name : 'Ismeretlen tétel';
  }

  getItemType(storage: StorageDTO): string {
    const item = this.itemsMap[storage.itemId];
    return item ? this.itemTypeLabels[item.itemType] : '-';
  }

  getItemCategory(storage: StorageDTO): string {
    const item = this.itemsMap[storage.itemId];
    return item ? this.itemCategoryLabels[item.itemCategory] : '-';
  }

  get totalStored(): number {
    return this.storages.reduce((sum, s) => sum + (s.amountStored || 0), 0);
  }

  get totalInUse(): number {
    return this.storages.reduce((sum, s) => sum + (s.amountInUse || 0), 0);
  }

  get totalItems(): number {
    return this.storages.length;
  }

  // ------- Kártya kattintás -------

  onStorageClick(storage: StorageDTO): void {

    // 1) Szerkesztés módban nem történik kattintás
    if (this.editMode) return;

    // 2) Törlés módban törlés indul
    if (this.deleteMode) {
      this.confirmDelete(storage);
      return;
    }

    // 3) Normál esetben navigáció
    this.router.navigate(['/items', storage.itemId], {
      state: { storage }
    });
  }


  // ------- CRUD menü -------

  get crudActions() {
    return [
      {
        label: 'Tétel hozzáadása',
        icon: 'add',
        onClick: () => this.addItemWithStorage()
      },
      {
        label: 'Szerkesztés',
        icon: 'edit',
        onClick: () => this.toggleEditMode()
      },
      {
        label: 'Törlés',
        icon: 'delete',
        onClick: () => this.deleteStorageMode()
      }
    ];
  }
}
