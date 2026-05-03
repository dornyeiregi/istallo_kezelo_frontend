import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { StableCreatePage } from './stable-create';
import { StableService } from '../../services/stable.service';
import { configurePageTest } from '../../testing/page-test-helpers';
import { ItemService } from '../../services/item.service';

describe('StableCreatePage', () => {
  let fixture: ComponentFixture<StableCreatePage>;
  let component: StableCreatePage;
  let stableService: jasmine.SpyObj<StableService>;
  let itemService: jasmine.SpyObj<ItemService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent() {
    await configurePageTest(StableCreatePage, {
      emptyTemplate: true,
      providers: [
        { provide: StableService, useValue: stableService },
        { provide: ItemService, useValue: itemService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(StableCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    stableService = jasmine.createSpyObj<StableService>('StableService', ['create']);
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    stableService.create.and.returnValue(of({ stableId: 1 } as any));
    itemService.getAll.and.returnValue(of([]));
  });

  it('shows error when creation fails', async () => {
    stableService.create.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.onSubmit();

    expect(component.error).toBe('Nem sikerült létrehozni az istállót.');
    expect(component.loading).toBeFalse();
  });

  it('goes back in browser history when available', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(2);

    component.goBack();

    expect(window.history.back).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the stable list when there is no browser history', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/stables']);
  });

  it('clears previous state and keeps loading until the create request resolves', async () => {
    const create$ = new Subject<any>();
    stableService.create.and.returnValue(create$);

    await createComponent();

    component.error = 'régi hiba';
    component.success = true;
    component.onSubmit();

    expect(component.error).toBe('');
    expect(component.success).toBeFalse();
    expect(component.loading).toBeTrue();
    expect(stableService.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        stableName: component.stable.stableName,
        strawUsageKg: null,
        stableItems: [],
      }),
    );
  });

  it('navigates to stable list after successful creation', fakeAsync(async () => {
    await createComponent();

    component.stable.stableName = 'Main';
    component.onSubmit();
    tick(1500);

    expect(stableService.create).toHaveBeenCalledWith(jasmine.objectContaining({ stableName: 'Main' }));
    expect(component.success).toBeTrue();
    expect(router.navigate).toHaveBeenCalledWith(['/stables']);
  }));

  it('allows creating a stable without bedding data', async () => {
    await createComponent();

    component.stable.stableName = 'Main';
    component.onSubmit();

    expect(stableService.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        stableName: 'Main',
        strawUsageKg: null,
        stableItems: [],
      }),
    );
    expect(component.error).toBe('');
  });

  it('includes selected bedding items in the create payload', async () => {
    await createComponent();

    component.stable.stableName = 'Main';
    component.stableBeddingItems = [{ itemId: 10, usageKg: 2.5 }];
    component.onSubmit();

    expect(stableService.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        strawUsageKg: 2.5,
        stableItems: [{ itemId: 10, usageKg: 2.5 }],
      }),
    );
  });

  it('shows validation error when bedding usage is provided without selecting an item', async () => {
    await createComponent();

    component.stable.stableName = 'Main';
    component.stableBeddingItems = [{ itemId: null, usageKg: 2 }];
    component.onSubmit();

    expect(stableService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('Ha megadsz napi alom mennyiséget, válassz hozzá tételt is.');
    expect(component.loading).toBeFalse();
  });
});
