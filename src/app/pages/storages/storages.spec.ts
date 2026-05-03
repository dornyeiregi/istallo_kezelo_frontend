import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { StoragesPage } from './storages';
import { StorageService } from '../../services/storage.service';
import { ItemService } from '../../services/item.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('StoragesPage', () => {
  let fixture: ComponentFixture<StoragesPage>;
  let component: StoragesPage;
  let storageService: jasmine.SpyObj<StorageService>;
  let itemService: jasmine.SpyObj<ItemService>;
  let router: jasmine.SpyObj<Router>;

  const item = {
    itemId: 2,
    name: 'Szena',
    itemType: 'HAY',
    itemCategory: 'CONSUMABLE',
    feedUnitAmount: 2,
  };

  const storage = {
    storageId: 1,
    itemId: 2,
    amountStored: 10,
    amountInUse: 0,
  };

  async function createComponent() {
    await configurePageTest(StoragesPage, {
      emptyTemplate: true,
      providers: [
        { provide: StorageService, useValue: storageService },
        { provide: ItemService, useValue: itemService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(StoragesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    storageService = jasmine.createSpyObj<StorageService>('StorageService', [
      'getAll',
      'update',
      'delete',
    ]);
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['getAll', 'update']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    storageService.getAll.and.returnValue(of([storage] as any));
    storageService.update.and.returnValue(of('ok'));
    storageService.delete.and.returnValue(of('ok'));
    itemService.getAll.and.returnValue(of([item] as any));
    itemService.update.and.returnValue(of(item as any));
  });

  it('shows error when data loading fails', async () => {
    storageService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a tárolókat.');
    expect(component.loading).toBeFalse();
  });

  it('caps available amount at zero', async () => {
    await createComponent();

    expect(
      component.getAvailableAmount({ ...storage, amountStored: 3, amountInUse: 5 } as any),
    ).toBe(0);
    expect(component.getAvailableAmount({ ...storage, amountStored: 8, amountInUse: 5 } as any)).toBe(3);
  });

  it('sums daily in-use amounts by item type', async () => {
    storageService.getAll.and.returnValue(
      of([
        { storageId: 1, itemId: 2, amountStored: 10, amountInUse: 2 },
        { storageId: 2, itemId: 3, amountStored: 8, amountInUse: 1.5 },
        { storageId: 3, itemId: 4, amountStored: 12, amountInUse: 4 },
      ] as any),
    );
    itemService.getAll.and.returnValue(
      of([
        { itemId: 2, name: 'Szena', itemType: 'HAY', itemCategory: 'CONSUMABLE' },
        { itemId: 3, name: 'Abrak', itemType: 'FEED', itemCategory: 'CONSUMABLE' },
        { itemId: 4, name: 'Forgacs', itemType: 'BEDDING', itemCategory: 'OBJECT' },
      ] as any),
    );

    await createComponent();

    expect(component.getDailyInUseByType('HAY')).toBe(2);
    expect(component.getDailyInUseByType('FEED')).toBe(1.5);
    expect(component.getDailyInUseByType('BEDDING')).toBe(4);
  });

  it('validates empty edited storage name', async () => {
    await createComponent();

    component.editedNames[1] = '   ';
    component.saveStorage(storage as any);

    expect(itemService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('A név nem lehet üres.');
  });

  it('does not select storage on click in normal mode', async () => {
    await createComponent();

    component.onStorageClick(storage as any);

    expect(component.selectedStorage).toBeNull();
  });

  it('shows toast when add stock modal is opened without selection', async () => {
    await createComponent();

    component.openAddStockModal();

    expect(component.toastMessage).toBe('Válassz ki egy tételt a készlet módosításához.');
    expect(component.showAddStockModal).toBeFalse();
  });

  it('opens add stock modal with selected item defaults', async () => {
    await createComponent();

    component.selectedStorage = storage as any;
    component.openAddStockModal();

    expect(component.showAddStockModal).toBeTrue();
    expect(component.addStockServingKg).toBe(2);
    expect(component.modalError).toBeNull();
  });

  it('activates add stock mode from CRUD menu and opens modal on card click', async () => {
    await createComponent();

    component.toggleStockActionMode('add');

    expect(component.editMode).toBeTrue();
    expect(component.stockActionMode).toBe('add');

    component.onStorageClick(storage as any);

    expect(component.selectedStorage).toEqual(storage as any);
    expect(component.showAddStockModal).toBeTrue();
  });

  it('validates add stock modal input', async () => {
    await createComponent();

    component.selectedStorage = storage as any;
    component.addStockServings = 0;
    component.addStockServingKg = 2;

    component.confirmAddStock();

    expect(storageService.update).not.toHaveBeenCalled();
    expect(component.modalError).toBe('Add meg az adagok számát és az adag tömegét.');
  });

  it('updates stock amount on successful add stock', async () => {
    await createComponent();

    component.toggleStockActionMode('add');
    component.onStorageClick({ ...storage } as any);
    component.addStockServings = 2;
    component.addStockServingKg = 3;

    component.confirmAddStock();

    expect(storageService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ amountStored: 16 }),
    );
    expect(component.selectedStorage).toBeNull();
    expect(component.showAddStockModal).toBeFalse();
    expect(component.stockActionMode).toBeNull();
    expect(component.editMode).toBeFalse();
    expect(component.toastMessage).toBe('Készlet sikeresen hozzáadva.');
  });

  it('shows error when add stock update fails', async () => {
    storageService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.selectedStorage = { ...storage } as any;
    component.addStockServings = 1;
    component.addStockServingKg = 2;
    component.confirmAddStock();

    expect(component.modalError).toBe('Nem sikerült frissíteni a készletet.');
  });

  it('validates remove stock against negative result', async () => {
    await createComponent();

    component.selectedStorage = storage as any;
    component.stockChangeAmount = 20;

    component.confirmRemoveStock();

    expect(storageService.update).not.toHaveBeenCalled();
    expect(component.modalError).toBe('Nincs ennyi készlet raktáron.');
  });

  it('updates stock amount on successful remove stock', async () => {
    await createComponent();

    component.toggleStockActionMode('remove');
    component.onStorageClick({ ...storage } as any);
    component.stockChangeAmount = 4;

    component.confirmRemoveStock();

    expect(storageService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ amountStored: 6 }),
    );
    expect(component.selectedStorage).toBeNull();
    expect(component.showRemoveStockModal).toBeFalse();
    expect(component.stockActionMode).toBeNull();
    expect(component.editMode).toBeFalse();
    expect(component.toastMessage).toBe('Készlet sikeresen levonva.');
  });

  it('shows error when storage rename update fails', async () => {
    itemService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.editedNames[1] = 'Lucerna';
    component.saveStorage(storage as any);

    expect(component.error).toBe('Nem sikerült módosítani a tétel nevét.');
  });

  it('deletes storage and clears selection on success', fakeAsync(async () => {
    await createComponent();

    component.selectedStorage = storage as any;
    component.confirmDeleteStorage = storage as any;
    component.deleteMode = true;
    spyOn(component, 'loadData');

    component.performDelete();
    tick();

    expect(storageService.delete).toHaveBeenCalledWith(1);
    expect(component.selectedStorage).toBeNull();
    expect(component.confirmDeleteStorage).toBeNull();
    expect(component.deleteMode).toBeFalse();
    expect(component.loadData).toHaveBeenCalled();
  }));

  it('shows toast when delete fails', async () => {
    storageService.delete.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.confirmDeleteStorage = storage as any;
    component.deleteMode = true;
    component.performDelete();

    expect(component.toastMessage).toBe('Nem sikerült törölni a tárolót.');
    expect(component.confirmDeleteStorage).toBeNull();
    expect(component.deleteMode).toBeFalse();
  });
});
