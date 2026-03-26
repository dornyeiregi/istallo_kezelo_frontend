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
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-storages',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './storages.html',
  styleUrls: ['./storages.css']
})
export class StoragesPage implements OnInit {

  // ========================
  //   ADATOK
  // ========================
  storages: StorageDTO[] = [];
  consumableStorages: StorageDTO[] = [];
  objectStorages: StorageDTO[] = [];
  items: ItemDTO[] = [];
  itemsMap: { [id: number]: ItemDTO } = {};

  loading = true;
  error = '';

  editMode = false;
  deleteMode = false;

  editedNames: { [storageId: number]: string } = {};
  confirmDeleteStorage: StorageDTO | null = null;

  toastMessage = '';
  toastVisible = false;
  syncing = false;

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

  constructor(
    private storageService: StorageService,
    private itemService: ItemService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ======================
  //   ADATOK BETÖLTÉSE
  // ======================
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

        this.consumableStorages = storages.filter(
          s => this.getItemCategory(s) === 'Takarmány'
        );

        this.objectStorages = storages.filter(
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

  // ================================
  //   CRUD MŰVELETEK
  // ================================
  addItemWithStorage(): void {
    this.router.navigate(['/storages/new-item']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;

    if (this.editMode) {
      this.deleteMode = false;
      this.confirmDeleteStorage = null;

      this.editedNames = this.storages.reduce((acc, s) => {
        if (s.storageId != null) {
          acc[s.storageId] = this.getItemName(s);
        }
        return acc;
      }, {} as { [id: number]: string });
    }
  }

  deleteStorageMode(): void {
    this.deleteMode = !this.deleteMode;
    if (this.deleteMode) this.editMode = false;
    this.confirmDeleteStorage = null;
  }

  saveStorage(storage: StorageDTO): void {
    if (!storage.storageId || !storage.itemId) return;

    const newName = this.editedNames[storage.storageId];
    if (!newName || newName.trim() === '') {
      this.error = 'A név nem lehet üres.';
      return;
    }

    const item = this.itemsMap[storage.itemId];

    const dto: ItemDTO = {
      itemId: item.itemId!,
      name: newName,
      itemType: item.itemType,
      itemCategory: item.itemCategory
    };

    this.itemService.update(item.itemId!, dto).subscribe({
      next: () => {
        this.showToast('Tétel neve sikeresen módosítva.');
        this.editMode = false;
        this.loadData();
      },
      error: () => {
        this.error = 'Nem sikerült módosítani a tétel nevét.';
      }
    });
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  confirmDelete(storage: StorageDTO): void {
    this.confirmDeleteStorage = storage;
  }

  performDelete(): void {
    const storage = this.confirmDeleteStorage;
    if (!storage?.storageId) return;

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

  // ======================
  //   TOAST
  // ======================
  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => (this.toastVisible = false), 3000);
  }

  syncStorages(): void {
    if (this.syncing) return;
    this.syncing = true;

    this.storageService.sync().subscribe({
      next: () => {
        this.showToast('Tárolók szinkronizálva.');
        this.loadData();
        this.syncing = false;
      },
      error: () => {
        this.showToast('Nem sikerült szinkronizálni a tárolókat.');
        this.syncing = false;
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  // ======================
  //   SEGÉD FÜGGVÉNYEK
  // ======================
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

  // ======================
  //   ÖSSZEGZŐ ADATOK
  // ======================
  get totalStored(): number {
    return this.storages.reduce((sum, s) => sum + (s.amountStored || 0), 0);
  }

  get totalInUse(): number {
    return this.storages.reduce((sum, s) => sum + (s.amountInUse || 0), 0);
  }

  get totalItems(): number {
    return this.storages.length;
  }

  // ======================
  //   KÁRTYA KATTINTÁS
  // ======================
  onStorageClick(storage: StorageDTO): void {
    if (this.editMode) return;
    if (this.deleteMode) {
      this.confirmDelete(storage);
      return;
    }

    this.router.navigate(['/items', storage.itemId], {
      state: { storage }
    });
  }

  // ======================
  //   CRUD MENÜ
  // ======================
  get crudActions() {
    return [
      {
        label: 'Tétel hozzáadása',
        icon: 'fa-plus',
        onClick: () => this.addItemWithStorage()
      },
      {
        label: 'Szerkesztés',
        icon: 'fa-pen-to-square',
        onClick: () => this.toggleEditMode()
      },
      {
        label: 'Törlés',
        icon: 'fa-trash',
        onClick: () => this.deleteStorageMode()
      }
    ];
  }
}
