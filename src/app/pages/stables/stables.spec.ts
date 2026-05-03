import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { StablesPage } from './stables';
import { StableService } from '../../services/stable.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { ItemService } from '../../services/item.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('StablesPage', () => {
  let fixture: ComponentFixture<StablesPage>;
  let component: StablesPage;
  let stableService: jasmine.SpyObj<StableService>;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;
  let itemService: jasmine.SpyObj<ItemService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let stable: any;

  async function createComponent() {
    await configurePageTest(StablesPage, {
      emptyTemplate: true,
      providers: [
        { provide: StableService, useValue: stableService },
        { provide: FeedSchedService, useValue: feedSchedService },
        { provide: ItemService, useValue: itemService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(StablesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    stable = {
      stableId: 1,
      stableName: 'Main',
      strawUsageKg: 5,
      horses: [{ id: 1, horseName: 'Csillag', isActive: true }],
    };

    stableService = jasmine.createSpyObj<StableService>('StableService', [
      'getAll',
      'update',
      'delete',
    ]);
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', [
      'getAllOfHorseById',
    ]);
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['getAll']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    stableService.getAll.and.returnValue(of([stable] as any));
    stableService.update.and.returnValue(of({} as any));
    stableService.delete.and.returnValue(of('ok'));
    feedSchedService.getAllOfHorseById.and.returnValue(of([]));
    itemService.getAll.and.returnValue(of([]));
    authService.hasAnyRole.and.returnValue(true);
  });

  it('shows error when stables cannot be loaded', async () => {
    stableService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az istállókat.');
    expect(component.loading).toBeFalse();
  });

  it('navigates to create and home pages from actions', async () => {
    await createComponent();

    component.addStable();
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/stables/new']);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('hides stable management actions without admin permission', async () => {
    authService.hasAnyRole.and.returnValue(false);

    await createComponent();

    expect(component.crudActions).toEqual([]);
  });

  it('populates editable values when edit mode is enabled', async () => {
    await createComponent();

    component.toggleEditMode();

    expect(component.editMode).toBeTrue();
    expect(component.editedNames['Main']).toBe('Main');
    expect(component.editedStrawUsage['Main']).toBe(5);
  });

  it('does not save when the new stable name is blank', async () => {
    await createComponent();

    component.editedNames['Main'] = '   ';
    component.saveName(stable as any);

    expect(stableService.update).not.toHaveBeenCalled();
  });

  it('does not save when stable id is missing', async () => {
    await createComponent();

    component.editMode = true;
    component.editedNames['Main'] = 'Updated';
    component.saveName({ stableName: 'Main' } as any);

    expect(stableService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Hiányzik az istálló azonosítója (id)');
  });

  it('updates stable name and straw usage on successful save', async () => {
    await createComponent();

    component.editMode = true;
    component.editedNames['Main'] = 'Updated';
    component.editedStrawUsage['Main'] = 7;

    component.saveName(stable as any);

    expect(stableService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ stableName: 'Updated', strawUsageKg: 7 }),
    );
    expect(stable.stableName).toBe('Updated');
    expect(stable.strawUsageKg).toBe(7);
    expect(component.editMode).toBeFalse();
  });

  it('shows error when stable update fails', async () => {
    stableService.update.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    component.editMode = true;
    component.editedNames['Main'] = 'Updated';
    component.saveName(stable as any);

    expect(component.error).toBe('Nem sikerült módosítani az istálló nevét.');
  });

  it('clears edit mode on cancel', async () => {
    await createComponent();

    component.editMode = true;
    component.cancelEdit();

    expect(component.editMode).toBeFalse();
  });

  it('toggles delete mode and resets the pending confirmation', async () => {
    await createComponent();

    component.confirmDeleteStable = stable as any;
    component.deleteStable();

    expect(component.deleteMode).toBeTrue();
    expect(component.confirmDeleteStable).toBeNull();
  });

  it('stores and clears the delete target', async () => {
    await createComponent();

    component.confirmDelete(stable as any);
    expect(component.confirmDeleteStable).toEqual(stable as any);

    component.cancelDelete();
    expect(component.confirmDeleteStable).toBeNull();
  });

  it('shows toast and reloads after delete', fakeAsync(async () => {
    await createComponent();
    spyOn(component, 'loadStables');

    component.confirmDeleteStable = stable as any;
    component.deleteMode = true;

    component.performDelete();
    tick();

    expect(stableService.delete).toHaveBeenCalledWith(1);
    expect(component.toastMessage).toContain('sikeresen törölve');
    expect(component.loadStables).toHaveBeenCalled();
    expect(component.confirmDeleteStable).toBeNull();
    expect(component.deleteMode).toBeFalse();
  }));

  it('shows error toast when deleting a stable fails', fakeAsync(async () => {
    stableService.delete.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    component.confirmDeleteStable = stable as any;
    component.deleteMode = true;
    component.performDelete();
    tick();

    expect(component.toastMessage).toBe('Nem sikerült törölni az istállót.');
    expect(component.confirmDeleteStable).toBeNull();
    expect(component.deleteMode).toBeFalse();
  }));

  it('hides the toast automatically after a timeout', async () => {
    await createComponent();
    jasmine.clock().install();

    component.showToast('teszt');
    expect(component.toastVisible).toBeTrue();

    jasmine.clock().tick(3000);
    expect(component.toastVisible).toBeFalse();
    jasmine.clock().uninstall();
  });

  it('clears daily totals when there are no active horses', async () => {
    stableService.getAll.and.returnValue(
      of([
        {
          stableId: 1,
          stableName: 'Empty',
          strawUsageKg: 0,
          horses: [{ id: 1, horseName: 'Inactive', isActive: false }],
        },
      ] as any),
    );

    await createComponent();

    expect(component.dailyFeedTotals).toEqual([]);
    expect(component.dailyFeedLoading).toBeFalse();
    expect(feedSchedService.getAllOfHorseById).not.toHaveBeenCalled();
  });

  it('counts and lists only active horses for a stable', async () => {
    stableService.getAll.and.returnValue(
      of([
        {
          stableId: 1,
          stableName: 'Main',
          strawUsageKg: 5,
          horses: [
            { id: 1, horseName: 'Csillag', isActive: true },
            { id: 2, horseName: 'Arnyek', isActive: false },
            { id: 3, horseName: 'Villam', isActive: true },
          ],
        },
      ] as any),
    );

    await createComponent();

    expect(component.totalHorseCount).toBe(2);
    expect(component.getActiveHorsesForStable(component.stables[0]).map((horse) => horse.horseName)).toEqual([
      'Csillag',
      'Villam',
    ]);
  });

  it('builds sorted daily feed totals from item-based and id-based schedules', async () => {
    feedSchedService.getAllOfHorseById.and.returnValue(
      of([
        {
          feedSchedId: 1,
          feedMorning: true,
          items: [{ itemId: 2, amount: 1.5 }],
        },
        {
          feedSchedId: 2,
          feedMorning: true,
          items: [{ itemId: 2, amount: 2 }],
        },
        {
          feedSchedId: 3,
          feedNoon: true,
          itemIds: [5],
        },
      ] as any),
    );
    itemService.getAll.and.returnValue(
      of([
        { itemId: 5, name: 'Abrak' },
        { itemId: 2, name: 'Lucerna' },
      ] as any),
    );

    await createComponent();

    expect(component.dailyFeedTotals).toEqual([
      { itemId: 5, name: 'Abrak', amount: 1 },
      { itemId: 2, name: 'Lucerna', amount: 2 },
    ]);
    expect(component.dailyFeedLoading).toBeFalse();
  });

  it('clears daily totals when feed aggregation fails', async () => {
    feedSchedService.getAllOfHorseById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.dailyFeedTotals).toEqual([]);
    expect(component.dailyFeedLoading).toBeFalse();
  });

  it('computes total horse count and straw usage from loaded stables', async () => {
    stableService.getAll.and.returnValue(
      of([
        stable,
        {
          stableId: 2,
          stableName: 'Secondary',
          strawUsageKg: null,
          horses: [{ id: 2, horseName: 'Villam', isActive: true }],
        },
      ] as any),
    );

    await createComponent();

    expect(component.totalHorseCount).toBe(2);
    expect(component.totalStrawUsageKg).toBe(5);
    expect(component.crudActions).toHaveSize(3);
  });
});
