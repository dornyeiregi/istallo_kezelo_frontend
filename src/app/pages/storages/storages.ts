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
  items: ItemDTO[] = [];
  itemsMap: { [id: number]: ItemDTO } = {};

  loading = true;
  error = '';
  editMode = false;
  deleteMode = false;

  editedValues: {
    [storageId: number]: { amountStored: number; amountInUse: number };
  } = {};

  confirmDeleteStorage: StorageDTO | null = null;

  // Toast
  toastMessage = '';
  toastVisible = false;

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
          if (item.itemId != null) {
            acc[item.itemId] = item;
          }
          return acc;
        }, {} as { [id: number]: ItemDTO });
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a tárolókat.';
        this.loading = false;
      }
    });
  }

  // ------- CRUD menü akciók -------

  addStorage(): void {
    this.router.navigate(['/storages/new']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;

    if (this.editMode) {
      this.editedValues = this.storages.reduce((acc, s) => {
        if (s.storageId != null) {
          acc[s.storageId] = {
            amountStored: s.amountStored,
            amountInUse: s.amountInUse
          };
        }
        return acc;
      }, {} as { [id: number]: { amountStored: number; amountInUse: number } });
    }
  }

  deleteStorageMode(): void {
    this.deleteMode = !this.deleteMode;
    this.confirmDeleteStorage = null;
  }

  // ------- Mentés (szerkesztés) -------

  saveStorage(storage: StorageDTO): void {
    if (storage.storageId == null) return;

    const edited = this.editedValues[storage.storageId];
    if (!edited) return;

    const dto: StorageDTO = {
      storageId: storage.storageId,
      amountStored: edited.amountStored,
      amountInUse: edited.amountInUse,
      itemId: storage.itemId
    };

    this.storageService.update(storage.storageId, dto).subscribe({
      next: () => {
        storage.amountStored = edited.amountStored;
        storage.amountInUse = edited.amountInUse;
        this.editMode = false;
        this.showToast('Tároló sikeresen frissítve.');
      },
      error: () => {
        this.error = 'Nem sikerült módosítani a tárolót.';
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
    if (!this.confirmDeleteStorage || this.confirmDeleteStorage.storageId == null) return;

    this.storageService.delete(this.confirmDeleteStorage.storageId).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.getItemName(this.confirmDeleteStorage!)} tároló törölve.`);
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

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  // ------- Kiíró segédmetódusok -------

  getItemName(storage: StorageDTO): string {
    const item = this.itemsMap[storage.itemId];
    return item ? item.name : 'Ismeretlen tétel';
  }

  getItemType(storage: StorageDTO): string {
    const item = this.itemsMap[storage.itemId];
    return item ? item.itemType : '-';
  }

  getItemCategory(storage: StorageDTO): string {
    const item = this.itemsMap[storage.itemId];
    return item ? item.itemCategory : '-';
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

  // ------- CRUD menü -------

  get crudActions() {
    return [
      { label: 'Új tároló', icon: 'add', onClick: () => this.addStorage() },
      { label: 'Szerkesztés', icon: 'edit', onClick: () => this.toggleEditMode() },
      { label: 'Törlés', icon: 'delete', onClick: () => this.deleteStorageMode() }
    ];
  }
}
