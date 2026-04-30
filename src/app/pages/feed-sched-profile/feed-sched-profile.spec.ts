import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FeedSchedProfilePage } from './feed-sched-profile';
import { FeedSchedService } from '../../services/feed-sched.service';
import { HorseService } from '../../services/horse.service';
import { ItemService } from '../../services/item.service';
import { FeedSchedItemService } from '../../services/feed-sched-item.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('FeedSchedProfilePage', () => {
  let fixture: ComponentFixture<FeedSchedProfilePage>;
  let component: FeedSchedProfilePage;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let itemService: jasmine.SpyObj<ItemService>;
  let feedSchedItemService: jasmine.SpyObj<FeedSchedItemService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let isAdmin = true;

  const feedSched = {
    feedSchedId: 1,
    description: 'Morning',
    feedMorning: true,
    horseIds: [1],
    itemIds: [10],
  };

  async function createComponent(feedSchedId = '1') {
    await configurePageTest(FeedSchedProfilePage, {
      emptyTemplate: true,
      paramMap: { feedSchedId },
      providers: [
        { provide: FeedSchedService, useValue: feedSchedService },
        { provide: HorseService, useValue: horseService },
        { provide: ItemService, useValue: itemService },
        { provide: FeedSchedItemService, useValue: feedSchedItemService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(FeedSchedProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    isAdmin = true;
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', [
      'getById',
      'update',
      'delete',
    ]);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['getAll']);
    feedSchedItemService = jasmine.createSpyObj<FeedSchedItemService>('FeedSchedItemService', [
      'getAll',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    feedSchedService.getById.and.returnValue(of(feedSched as any));
    feedSchedService.update.and.returnValue(of('ok'));
    feedSchedService.delete.and.returnValue(of('ok'));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    itemService.getAll.and.returnValue(of([{ itemId: 10, name: 'Szena', itemType: 'HAY' }] as any));
    feedSchedItemService.getAll.and.returnValue(of([{ feedSchedId: 1, itemId: 10, amount: 2 }] as any));
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('ADMIN') || roles.includes('ROLE_ADMIN') ? isAdmin : false,
    );
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen etetési ütemterv azonosító.');
    expect(feedSchedService.getById).not.toHaveBeenCalled();
  });

  it('shows error when related data cannot be loaded', async () => {
    horseService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az adatokat.');
    expect(component.loading).toBeFalse();
  });

  it('shows error when the feed schedule cannot be loaded', async () => {
    feedSchedService.getById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az etetési ütemtervet.');
    expect(component.loading).toBeFalse();
  });

  it('navigates to horses when coming back from edit mode', async () => {
    window.history.replaceState({ fromEdit: true }, '');
    await createComponent();
    spyOn(window.history, 'back');

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/horses']);
    expect(window.history.back).not.toHaveBeenCalled();
    window.history.replaceState({}, '');
  });

  it('navigates to horses when there is no browser history', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/horses']);
  });

  it('alerts when delete fails', async () => {
    const alertSpy = spyOn(window, 'alert');
    spyOn(window, 'confirm').and.returnValue(true);
    feedSchedService.delete.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.deleteFeedSched();

    expect(alertSpy).toHaveBeenCalledWith('Nem sikerült törölni az ütemtervet.');
  });

  it('does not delete when confirmation is rejected', async () => {
    spyOn(window, 'confirm').and.returnValue(false);

    await createComponent();

    component.deleteFeedSched();

    expect(feedSchedService.delete).not.toHaveBeenCalled();
  });

  it('does not delete when the schedule id is missing', async () => {
    await createComponent();
    component.feedSched = { ...feedSched, feedSchedId: undefined } as any;
    spyOn(window, 'confirm');

    component.deleteFeedSched();

    expect(window.confirm).not.toHaveBeenCalled();
    expect(feedSchedService.delete).not.toHaveBeenCalled();
  });

  it('navigates back to horses after successful delete', async () => {
    spyOn(window, 'confirm').and.returnValue(true);

    await createComponent();

    component.deleteFeedSched();

    expect(feedSchedService.delete).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/horses']);
  });

  it('updates assignments immediately for admins', fakeAsync(async () => {
    await createComponent();

    component.selectedHorseIds = new Set([1]);
    component.selectedItemIds = new Set([10]);
    component.editHorsesMode = true;

    component.saveHorseAssignments();
    tick();

    expect(feedSchedService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ horseIds: [1], itemIds: [10] }),
    );
    expect(component.successMessage).toBe('Lovak sikeresen frissítve.');
    expect(component.editHorsesMode).toBeFalse();
    tick(2000);
    expect(component.successMessage).toBe('');
  }));

  it('shows error when assignment save fails', async () => {
    feedSchedService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.saveHorseAssignments();

    expect(component.error).toBe('Nem sikerült frissíteni a lovakat.');
    expect(component.saving).toBeFalse();
  });

  it('does not save assignments when the schedule id is missing', async () => {
    await createComponent();
    component.feedSched = { ...feedSched, feedSchedId: undefined } as any;

    component.saveHorseAssignments();

    expect(feedSchedService.update).not.toHaveBeenCalled();
  });

  it('reloads schedule and shows request message for non-admin users', fakeAsync(async () => {
    isAdmin = false;

    await createComponent();
    spyOn(component, 'loadFeedSched');

    component.saveHorseAssignments();
    tick();

    expect(component.successMessage).toBe('Kérés elküldve. Jóváhagyás után lép életbe.');
    expect(component.loadFeedSched).toHaveBeenCalledWith(1);
  }));

  it('filters unknown horse ids from assigned list', async () => {
    await createComponent();

    expect(component.getKnownHorseIds([1, 99])).toEqual([1]);
  });

  it('returns null when a horse name is not known', async () => {
    await createComponent();

    expect(component.getHorseNameById(99)).toBeNull();
  });

  it('toggles selected horse and item assignments', async () => {
    await createComponent();

    component.selectedHorseIds = new Set([1]);
    component.selectedItemIds = new Set([10]);

    component.toggleHorseAssignment(1);
    component.toggleHorseAssignment(2);
    component.toggleItemAssignment(10);
    component.toggleItemAssignment(11);

    expect(Array.from(component.selectedHorseIds).sort()).toEqual([2]);
    expect(Array.from(component.selectedItemIds).sort()).toEqual([11]);
  });

  it('formats feed time labels and item type labels', async () => {
    await createComponent();

    expect(component.getFeedTimeLabel()).toBe('Reggel');
    expect(component.getItemTypeLabel({ itemType: 'feed' } as any)).toBe('Abraktakarmány');
    expect(component.getItemTypeLabel({ itemType: 'custom' } as any)).toBe('custom');
  });

  it('formats assigned item labels with stored amounts', async () => {
    await createComponent();

    expect(component.getItemLabel({ itemId: 10, name: 'Szena' } as any)).toBe('Szena (2)');
  });

  it('returns raw item names when no stored amount exists and filters items by type', async () => {
    await createComponent();

    expect(component.getItemLabel({ itemId: 99, name: 'Só' } as any)).toBe('Só');
    expect(component.getItemsByType('hay')).toEqual([
      { itemId: 10, name: 'Szena', itemType: 'HAY' },
    ] as any);
    expect(component.getItemNames()).toEqual(['Szena (2)']);
  });

  it('exposes crud actions that open editing and trigger deletion', async () => {
    await createComponent();
    spyOn(component, 'deleteFeedSched');

    component.crudActions[0].onClick();
    component.crudActions[1].onClick();

    expect(component.editHorsesMode).toBeTrue();
    expect(component.deleteFeedSched).toHaveBeenCalled();
  });
});
