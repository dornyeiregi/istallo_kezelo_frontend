import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RequestsPage } from './requests';
import { HorseService } from '../../services/horse.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedItemService } from '../../services/feed-sched-item.service';
import { ItemService } from '../../services/item.service';
import { StableService } from '../../services/stable.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('RequestsPage', () => {
  let fixture: ComponentFixture<RequestsPage>;
  let component: RequestsPage;
  let horseService: jasmine.SpyObj<HorseService>;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;
  let feedSchedItemService: jasmine.SpyObj<FeedSchedItemService>;
  let itemService: jasmine.SpyObj<ItemService>;
  let stableService: jasmine.SpyObj<StableService>;
  let router: jasmine.SpyObj<Router>;

  const horseRequest = { id: 1, horseName: 'Csillag' };
  const feedRequest = {
    id: 9,
    feedSchedId: 10,
    horseIds: [1],
    requestedMorning: true,
    itemIds: [5],
  };

  async function createComponent() {
    await configurePageTest(RequestsPage, {
      emptyTemplate: true,
      providers: [
        { provide: HorseService, useValue: horseService },
        { provide: FeedSchedService, useValue: feedSchedService },
        { provide: FeedSchedItemService, useValue: feedSchedItemService },
        { provide: ItemService, useValue: itemService },
        { provide: StableService, useValue: stableService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(RequestsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    horseService = jasmine.createSpyObj<HorseService>('HorseService', [
      'getRequests',
      'getAll',
      'approveRequest',
      'rejectRequest',
    ]);
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', [
      'getChangeRequests',
      'approveChangeRequest',
      'rejectChangeRequest',
      'getAll',
      'update',
      'delete',
    ]);
    feedSchedItemService = jasmine.createSpyObj<FeedSchedItemService>('FeedSchedItemService', [
      'getAll',
    ]);
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['getAll']);
    stableService = jasmine.createSpyObj<StableService>('StableService', ['getAll']);

    horseService.getRequests.and.returnValue(of([horseRequest] as any));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    horseService.approveRequest.and.returnValue(of('ok') as any);
    horseService.rejectRequest.and.returnValue(of('ok') as any);

    feedSchedService.getChangeRequests.and.returnValue(of([feedRequest] as any));
    feedSchedService.approveChangeRequest.and.returnValue(of('ok'));
    feedSchedService.rejectChangeRequest.and.returnValue(of('ok'));
    feedSchedService.getAll.and.returnValue(
      of([
        { feedSchedId: 10, feedMorning: true, horseIds: [], itemIds: [5], description: '' },
        { feedSchedId: 11, feedMorning: true, horseIds: [1], itemIds: [6], description: '' },
      ] as any),
    );
    feedSchedService.update.and.returnValue(of('ok'));
    feedSchedService.delete.and.returnValue(of('ok'));

    feedSchedItemService.getAll.and.returnValue(
      of([
        { feedSchedId: 10, itemId: 5, itemName: 'Szena', amount: 2 },
        { feedSchedId: 11, itemId: 6, itemName: 'Zab', amount: 1 },
      ] as any),
    );
    itemService.getAll.and.returnValue(of([{ itemId: 5, name: 'Szena' }] as any));
    stableService.getAll.and.returnValue(of([{ stableId: 7, stableName: 'Main' }] as any));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  });

  it('shows error when horse requests cannot be loaded', async () => {
    horseService.getRequests.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a ló kéréseket.');
  });

  it('tracks the combined pending request count after load', async () => {
    await createComponent();

    expect(component.pendingCount).toBe(2);
  });

  it('navigates back to the dashboard', async () => {
    await createComponent();

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('shows and hides toast messages after a timeout', fakeAsync(async () => {
    await createComponent();

    component.showToast('teszt');

    expect(component.toastVisible).toBeTrue();
    expect(component.toastMessage).toBe('teszt');
    tick(3000);
    expect(component.toastVisible).toBeFalse();
  }));

  it('requires stable selection before approving horse request', async () => {
    await createComponent();

    component.approveHorseRequest(horseRequest as any);

    expect(horseService.approveRequest).not.toHaveBeenCalled();
    expect(component.toastMessage).toBe('Istálló kiválasztása kötelező.');
  });

  it('approves horse request with selected stable and feed schedule', async () => {
    await createComponent();

    component.selectedStableByHorse[1] = 7;
    component.selectedFeedSchedByHorse[1] = 10;
    component.approveHorseRequest(horseRequest as any);

    expect(horseService.approveRequest).toHaveBeenCalledWith(1, { stableId: 7, feedSchedId: 10 });
    expect(component.horseRequests).toEqual([]);
    expect(component.toastMessage).toContain('jóváhagyva');
  });

  it('rejects horse request and removes it from the list', async () => {
    await createComponent();

    component.rejectHorseRequest(horseRequest as any);

    expect(horseService.rejectRequest).toHaveBeenCalledWith(1);
    expect(component.horseRequests).toEqual([]);
    expect(component.toastMessage).toContain('elutasítva');
  });

  it('shows toast when horse request rejection fails', async () => {
    horseService.rejectRequest.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.rejectHorseRequest(horseRequest as any);

    expect(component.toastMessage).toBe('Nem sikerült elutasítani a kérést.');
  });

  it('shows toast when feed request approval fails', async () => {
    feedSchedService.approveChangeRequest.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.approveFeedSchedRequest(feedRequest as any);

    expect(component.toastMessage).toBe('Nem sikerült jóváhagyni a kérést.');
  });

  it('shows toast when feed request rejection fails', async () => {
    feedSchedService.rejectChangeRequest.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.rejectFeedSchedRequest(feedRequest as any);

    expect(component.toastMessage).toBe('Nem sikerült elutasítani a kérést.');
  });

  it('rejects feed request and removes it from the list', async () => {
    await createComponent();

    component.rejectFeedSchedRequest(feedRequest as any);

    expect(feedSchedService.rejectChangeRequest).toHaveBeenCalledWith(9);
    expect(component.feedSchedRequests).toEqual([]);
    expect(component.toastMessage).toBe('Etetési kérés elutasítva.');
  });

  it('returns early when requests do not have identifiers', async () => {
    await createComponent();

    component.approveHorseRequest({ horseName: 'No Id' } as any);
    component.rejectHorseRequest({ horseName: 'No Id' } as any);
    component.approveFeedSchedRequest({ feedSchedId: 10 } as any);
    component.rejectFeedSchedRequest({ feedSchedId: 10 } as any);

    expect(horseService.approveRequest).not.toHaveBeenCalled();
    expect(horseService.rejectRequest).not.toHaveBeenCalled();
    expect(feedSchedService.approveChangeRequest).not.toHaveBeenCalled();
    expect(feedSchedService.rejectChangeRequest).not.toHaveBeenCalled();
  });

  it('falls back to existing feed schedule time label when request flags are missing', async () => {
    await createComponent();

    const label = component.getFeedTimeLabelForRequest({
      id: 1,
      feedSchedId: 10,
      horseIds: [],
    } as any);

    expect(label).toBe('REGGEL');
  });

  it('formats feed schedule labels, descriptions and item labels for requests', async () => {
    await createComponent();

    expect(
      component.getFeedSchedSelectLabel({
        feedSchedId: 10,
        feedMorning: true,
        itemIds: [5],
      } as any),
    ).toContain('REGGEL_10');
    expect(
      component.getFeedDescriptionForRequest({
        feedSchedId: 10,
        description: '  ',
      } as any),
    ).toBe('-');
    expect(
      component.getFeedDescriptionForRequest({
        feedSchedId: 10,
      } as any),
    ).toBe('-');
    expect(
      component.getFeedItemLabelsForRequest({
        items: [{ itemId: 5, amount: 2 }],
      } as any),
    ).toEqual(['Szena (2)']);
    expect(
      component.getFeedItemLabelsForRequest({
        feedSchedId: 10,
        itemIds: [5],
      } as any),
    ).toEqual(['Szena (2)']);
    expect(component.getHorseNamesForRequest({ horseIds: [1, 99] } as any)).toEqual([
      'Csillag',
      'Ló #99',
    ]);
  });

  it('formats requested timestamps and falls back for missing or invalid values', async () => {
    await createComponent();

    expect(component.formatRequestedAt({} as any)).toBe('-');
    expect(component.formatRequestedAt({ requestedAt: 'nem-datum' } as any)).toBe('nem-datum');
  });

  it('normalizes approved feed schedules after approval', async () => {
    await createComponent();

    component.approveFeedSchedRequest(feedRequest as any);

    expect(feedSchedService.approveChangeRequest).toHaveBeenCalledWith(9);
    expect(feedSchedService.update).toHaveBeenCalledWith(
      10,
      jasmine.objectContaining({ horseIds: [1] }),
    );
    expect(feedSchedService.delete).toHaveBeenCalledWith(11);
    expect(component.feedSchedRequests).toEqual([]);
  });

  it('shows toast when reloading approved feed schedules fails', async () => {
    feedSchedService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.approveFeedSchedRequest(feedRequest as any);

    expect(component.toastMessage).toBe('Nem sikerült frissíteni az etetési ütemterveket.');
  });

  it('falls back to empty collections when auxiliary request data cannot be loaded', async () => {
    horseService.getAll.and.returnValue(throwError(() => new Error('fail')));
    itemService.getAll.and.returnValue(throwError(() => new Error('fail')));
    feedSchedItemService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.horses).toEqual([]);
    expect(component.items).toEqual([]);
    expect(component.getFeedItemLabelsForRequest({ feedSchedId: 10 } as any)).toEqual([]);
  });
});
