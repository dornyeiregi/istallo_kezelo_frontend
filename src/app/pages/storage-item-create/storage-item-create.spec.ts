import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { StorageItemCreatePage } from './storage-item-create';
import { ItemService } from '../../services/item.service';
import { StorageService } from '../../services/storage.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('StorageItemCreatePage', () => {
  let fixture: ComponentFixture<StorageItemCreatePage>;
  let component: StorageItemCreatePage;
  let itemService: jasmine.SpyObj<ItemService>;
  let storageService: jasmine.SpyObj<StorageService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent() {
    await configurePageTest(StorageItemCreatePage, {
      emptyTemplate: true,
      providers: [
        { provide: ItemService, useValue: itemService },
        { provide: StorageService, useValue: storageService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(StorageItemCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['create']);
    storageService = jasmine.createSpyObj<StorageService>('StorageService', ['create']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    itemService.create.and.returnValue(of({ itemId: 5 } as any));
    storageService.create.and.returnValue(of({} as any));
  });

  it('filters item types by selected category and resets type', async () => {
    await createComponent();

    component.form.itemCategory = 'CONSUMABLE';
    component.form.itemType = 'HAY';
    component.onCategoryChange();

    expect(component.filteredItemTypes).toEqual(['HAY', 'FEED', 'SUPPLEMENT']);
    expect(component.form.itemType).toBe('');
  });

  it('validates required fields before submit', async () => {
    await createComponent();

    component.onSubmit();

    expect(itemService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('Minden szükséges mezőt ki kell tölteni.');
  });

  it('shows error when created item has no id', async () => {
    itemService.create.and.returnValue(of({} as any));

    await createComponent();

    component.form = {
      name: 'Szena',
      itemType: 'HAY',
      itemCategory: 'CONSUMABLE',
      packageCount: 2,
      packageSize: 5,
    };

    component.onSubmit();

    expect(storageService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('Nem sikerült a tétel azonosítóját lekérni.');
  });

  it('shows error when storage creation fails', async () => {
    storageService.create.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.form = {
      name: 'Szena',
      itemType: 'HAY',
      itemCategory: 'CONSUMABLE',
      packageCount: 2,
      packageSize: 5,
    };

    component.onSubmit();

    expect(component.error).toBe('A tároló létrehozása nem sikerült.');
    expect(component.loading).toBeFalse();
  });

  it('navigates back to storages after successful creation', fakeAsync(async () => {
    await createComponent();

    component.form = {
      name: 'Szena',
      itemType: 'HAY',
      itemCategory: 'CONSUMABLE',
      packageCount: 2,
      packageSize: 5,
    };

    component.onSubmit();
    tick(1000);

    expect(itemService.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ feedUnitAmount: 1 }),
    );
    expect(storageService.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ itemId: 5, amountStored: 10 }),
    );
    expect(component.success).toBeTrue();
    expect(router.navigate).toHaveBeenCalledWith(['/storages']);
  }));
});
