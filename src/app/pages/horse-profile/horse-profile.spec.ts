import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HorseProfilePage } from './horse-profile';
import { HorseService } from '../../services/horse.service';
import { ShotService } from '../../services/shot.service';
import { HorseShotService } from '../../services/horse-shot.service';
import { TreatmentService } from '../../services/treatment.service';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { HorseFeedSchedService } from '../../services/horse-feed-sched.service';
import { ItemService } from '../../services/item.service';
import { HorseFarrierAppService } from '../../services/horse-farrier-app.service';
import { HorseTreatmentService } from '../../services/horse-treatment.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { UserService } from '../../services/user.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('HorseProfilePage', () => {
  let fixture: ComponentFixture<HorseProfilePage>;
  let component: HorseProfilePage;
  let horseService: jasmine.SpyObj<HorseService>;
  let shotService: jasmine.SpyObj<ShotService>;
  let horseShotService: jasmine.SpyObj<HorseShotService>;
  let treatmentService: jasmine.SpyObj<TreatmentService>;
  let farrierAppService: jasmine.SpyObj<FarrierAppService>;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;
  let horseFeedSchedService: jasmine.SpyObj<HorseFeedSchedService>;
  let itemService: jasmine.SpyObj<ItemService>;
  let horseFarrierAppService: jasmine.SpyObj<HorseFarrierAppService>;
  let horseTreatmentService: jasmine.SpyObj<HorseTreatmentService>;
  let authService: jasmine.SpyObj<AuthService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;
  let currentNavigation: any = null;

  const horse = {
    id: 1,
    horseName: 'Csillag',
    ownerId: 2,
    horseIds: [],
  };

  async function createComponent(horseName = 'Csillag') {
    await configurePageTest(HorseProfilePage, {
      emptyTemplate: true,
      paramMap: { horseName },
      providers: [
        { provide: HorseService, useValue: horseService },
        { provide: ShotService, useValue: shotService },
        { provide: HorseShotService, useValue: horseShotService },
        { provide: TreatmentService, useValue: treatmentService },
        { provide: FarrierAppService, useValue: farrierAppService },
        { provide: FeedSchedService, useValue: feedSchedService },
        { provide: HorseFeedSchedService, useValue: horseFeedSchedService },
        { provide: ItemService, useValue: itemService },
        { provide: HorseFarrierAppService, useValue: horseFarrierAppService },
        { provide: HorseTreatmentService, useValue: horseTreatmentService },
        { provide: AuthService, useValue: authService },
        { provide: SettingsService, useValue: settingsService },
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(HorseProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    horseService = jasmine.createSpyObj<HorseService>('HorseService', [
      'getByName',
      'getAll',
      'getMine',
      'getMyRequests',
    ]);
    shotService = jasmine.createSpyObj<ShotService>('ShotService', ['getAll', 'getAllOfHorseById']);
    horseShotService = jasmine.createSpyObj<HorseShotService>('HorseShotService', ['addShotToHorse']);
    treatmentService = jasmine.createSpyObj<TreatmentService>('TreatmentService', [
      'getAll',
      'getAllOfHorseById',
    ]);
    farrierAppService = jasmine.createSpyObj<FarrierAppService>('FarrierAppService', [
      'getAll',
      'getAllOfHorseById',
    ]);
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', [
      'getAllOfHorseById',
      'getMyChangeRequests',
      'create',
      'update',
      'delete',
    ]);
    horseFeedSchedService = jasmine.createSpyObj<HorseFeedSchedService>('HorseFeedSchedService', [
      'deleteAllForHorse',
    ]);
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['getAll']);
    horseFarrierAppService = jasmine.createSpyObj<HorseFarrierAppService>(
      'HorseFarrierAppService',
      ['create'],
    );
    horseTreatmentService = jasmine.createSpyObj<HorseTreatmentService>('HorseTreatmentService', [
      'create',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    settingsService = jasmine.createSpyObj<SettingsService>('SettingsService', [
      'getEmployeeAccess',
    ]);
    userService = jasmine.createSpyObj<UserService>('UserService', ['getById']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'getCurrentNavigation']);

    horseService.getByName.and.returnValue(of(horse as any));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    horseService.getMine.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    horseService.getMyRequests.and.returnValue(of([]));
    shotService.getAll.and.returnValue(of([{ shotId: 3, shotName: 'Tetanuasz' }] as any));
    shotService.getAllOfHorseById.and.returnValue(of([]));
    treatmentService.getAll.and.returnValue(of([{ treatmentId: 4, treatmentName: 'Vizsgalat' }] as any));
    treatmentService.getAllOfHorseById.and.returnValue(of([]));
    farrierAppService.getAll.and.returnValue(of([{ farrierAppId: 5, farrierName: 'John' }] as any));
    farrierAppService.getAllOfHorseById.and.returnValue(of([]));
    feedSchedService.getAllOfHorseById.and.returnValue(of([]));
    feedSchedService.getMyChangeRequests.and.returnValue(of([]));
    feedSchedService.create.and.returnValue(of('ok'));
    feedSchedService.update.and.returnValue(of('ok'));
    feedSchedService.delete.and.returnValue(of('ok'));
    horseFeedSchedService.deleteAllForHorse.and.returnValue(of('ok'));
    itemService.getAll.and.returnValue(of([{ itemId: 10, name: 'Szena', itemType: 'HAY' }] as any));
    horseShotService.addShotToHorse.and.returnValue(of({} as any));
    settingsService.getEmployeeAccess.and.returnValue(
      of({ viewShots: true, viewTreatments: true, viewFarrierApps: true }),
    );
    userService.getById.and.returnValue(of({ phone: '123' } as any));
    authService.hasAnyRole.and.returnValue(false);
    currentNavigation = null;
    router.getCurrentNavigation.and.callFake(() => currentNavigation);
  });

  it('shows error when no horse is selected', async () => {
    await createComponent('');

    expect(component.error).toBe('Nincs kiválasztott ló.');
    expect(component.loading).toBeFalse();
  });

  it('uses navigation state horse without loading by name', async () => {
    currentNavigation = { extras: { state: { horse } } };

    await createComponent();

    expect(horseService.getByName).not.toHaveBeenCalled();
    expect(component.horse?.horseName).toBe('Csillag');
  });

  it('shows error when horse cannot be loaded by name', async () => {
    horseService.getByName.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem található ló ezzel a névvel.');
    expect(component.loading).toBeFalse();
  });

  it('populates owner phone after horse load', async () => {
    await createComponent();

    expect(userService.getById).toHaveBeenCalledWith(2);
    expect(component.horse?.ownerPhone).toBe('123');
  });

  it('updates pending feed notice for owner change requests', async () => {
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('OWNER') || roles.includes('ROLE_OWNER'),
    );
    feedSchedService.getAllOfHorseById.and.returnValue(
      of([{ feedSchedId: 10, horseIds: [1], itemIds: [10], feedMorning: true }] as any),
    );
    feedSchedService.getMyChangeRequests.and.returnValue(
      of([{ id: 5, horseIds: [1], requestedMorning: true }] as any),
    );
    horseService.getMine.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));

    await createComponent();

    expect(component.feedChangePending).toBeTrue();
    expect(component.feedChangeMessage).toContain('függőben');
    expect(component.pendingFeedRequestsForHorse.length).toBe(1);
  });

  it('does not load owner phone when the horse has no owner id', async () => {
    horseService.getByName.and.returnValue(of({ id: 1, horseName: 'Csillag' } as any));

    await createComponent();

    expect(userService.getById).not.toHaveBeenCalled();
  });

  it('disables medical sections for employees when access loading fails', async () => {
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('EMPLOYEE') || roles.includes('ROLE_EMPLOYEE'),
    );
    settingsService.getEmployeeAccess.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.canViewShots).toBeFalse();
    expect(component.canViewTreatments).toBeFalse();
    expect(component.canViewFarrierApps).toBeFalse();
    expect(shotService.getAllOfHorseById).not.toHaveBeenCalled();
    expect(treatmentService.getAllOfHorseById).not.toHaveBeenCalled();
    expect(farrierAppService.getAllOfHorseById).not.toHaveBeenCalled();
  });

  it('navigates to the horse list when there is no browser history', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/horses']);
  });

  it('navigates to related profiles from helper methods', async () => {
    await createComponent();

    component.goToShot(3);
    component.goToTreatment(4);
    component.goToFarrierApp(5);

    expect(router.navigate).toHaveBeenCalledWith(['/shots', 3]);
    expect(router.navigate).toHaveBeenCalledWith(['/treatments', 4]);
    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps', 5]);
  });

  it('formats helper labels for frequency, sex and farrier shoes', async () => {
    await createComponent();
    component.horse = horse as any;

    expect(component.getFrequencyLabel({ frequencyValue: 2, frequencyUnit: 'weeks' } as any)).toBe(
      '2 Hét',
    );
    expect(component.getFrequencyLabel({} as any)).toBe('-');
    expect(component.getSexLabel('M')).toBe('Csődör');
    expect(component.getSexLabel('F')).toBe('Kanca');
    expect(component.getSexLabel('G')).toBe('Herélt');
    expect(component.getSexLabel('X')).toBe('Ismeretlen');
    expect(
      component.getFarrierShoeLabel({
        horseDetails: [{ horseId: 1, shoeCount: 4 }],
      } as any),
    ).toBe('4 patkó');
    expect(
      component.getFarrierShoeLabel({
        horseDetails: [{ horseId: 1, shoeCount: 2 }],
      } as any),
    ).toBe('2 patkó');
    expect(component.getFarrierShoeLabel({ horseDetails: [] } as any)).toBe('Nincs patkó');
  });

  it('opens the vaccination popup with loaded shots', async () => {
    await createComponent();

    component.addVaccination();

    expect(shotService.getAll).toHaveBeenCalled();
    expect(component.showVaccinationPopup).toBeTrue();
    expect(component.vaccinationOption).toBe('existing');
  });

  it('attaches an existing vaccination and reloads shots', async () => {
    await createComponent();
    spyOn(component, 'loadShots');

    component.horse = horse as any;
    component.vaccinationOption = 'existing';
    component.selectedShotId = 3;
    component.allShots = [{ shotId: 3, shotName: 'Tetanuasz' }] as any;
    component.showVaccinationPopup = true;

    component.submitVaccination();

    expect(horseShotService.addShotToHorse).toHaveBeenCalledWith(3, 1);
    expect(component.showVaccinationPopup).toBeFalse();
    expect(component.loadShots).toHaveBeenCalledWith(1);
  });

  it('navigates to the shot create page for a new vaccination', async () => {
    await createComponent();

    component.horse = horse as any;
    component.vaccinationOption = 'new';
    component.showVaccinationPopup = true;

    component.submitVaccination();

    expect(component.showVaccinationPopup).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/shots/new', 1]);
  });

  it('returns early for popup submissions when required selections are missing', async () => {
    await createComponent();
    spyOn(component, 'loadShots');
    spyOn(component, 'loadTreatments');
    spyOn(component, 'loadFarrierApps');

    component.horse = horse as any;
    component.vaccinationOption = 'existing';
    component.submitVaccination();

    component.treatmentOption = 'existing';
    component.submitTreatment();

    component.farrierOption = 'existing';
    component.submitFarrierApp();

    expect(horseShotService.addShotToHorse).not.toHaveBeenCalled();
    expect(horseTreatmentService.create).not.toHaveBeenCalled();
    expect(horseFarrierAppService.create).not.toHaveBeenCalled();
    expect(component.loadShots).not.toHaveBeenCalled();
    expect(component.loadTreatments).not.toHaveBeenCalled();
    expect(component.loadFarrierApps).not.toHaveBeenCalled();
  });

  it('attaches an existing treatment and reloads treatments', async () => {
    await createComponent();
    spyOn(component, 'loadTreatments');
    horseTreatmentService.create.and.returnValue(of({} as any));

    component.horse = horse as any;
    component.treatmentOption = 'existing';
    component.selectedTreatmentId = 4;
    component.allTreatments = [{ treatmentId: 4, treatmentName: 'Vizsgalat' }] as any;
    component.showTreatmentPopup = true;

    component.submitTreatment();

    expect(horseTreatmentService.create).toHaveBeenCalledWith({ horseId: 1, treatmentId: 4 });
    expect(component.showTreatmentPopup).toBeFalse();
    expect(component.loadTreatments).toHaveBeenCalledWith(1);
  });

  it('navigates to the treatment create page for a new treatment', async () => {
    await createComponent();

    component.horse = horse as any;
    component.treatmentOption = 'new';
    component.showTreatmentPopup = true;

    component.submitTreatment();

    expect(component.showTreatmentPopup).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/treatments/new', 1]);
  });

  it('attaches an existing farrier appointment and reloads farrier apps', async () => {
    await createComponent();
    spyOn(component, 'loadFarrierApps');
    horseFarrierAppService.create.and.returnValue(of({} as any));

    component.horse = horse as any;
    component.farrierOption = 'existing';
    component.selectedFarrierAppId = 5;
    component.allFarrierApps = [{ farrierAppId: 5, farrierName: 'John' }] as any;
    component.farrierShoeCount = 2;
    component.farrierNote = 'teszt';
    component.showFarrierPopup = true;

    component.submitFarrierApp();

    expect(horseFarrierAppService.create).toHaveBeenCalledWith({
      horseId: 1,
      farrierAppId: 5,
      shoeCount: 2,
      note: 'teszt',
    });
    expect(component.showFarrierPopup).toBeFalse();
    expect(component.farrierShoeCount).toBe(4);
    expect(component.farrierNote).toBe('');
    expect(component.loadFarrierApps).toHaveBeenCalledWith(1);
  });

  it('navigates to the farrier create page for a new farrier appointment', async () => {
    await createComponent();

    component.horse = horse as any;
    component.farrierOption = 'new';
    component.showFarrierPopup = true;

    component.submitFarrierApp();

    expect(component.showFarrierPopup).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps/new', 1]);
  });

  it('removes all feed schedules when no feed time is enabled', async () => {
    await createComponent();
    spyOn(component, 'loadFeedScheds');

    component.horse = horse as any;
    component.submitFeedEditor();

    expect(horseFeedSchedService.deleteAllForHorse).toHaveBeenCalledWith(1);
    expect(component.showFeedEditor).toBeFalse();
    expect(component.loadFeedScheds).toHaveBeenCalledWith(1);
  });

  it('does not create feed schedules when a selected feed item amount is not positive', async () => {
    await createComponent();

    component.horse = horse as any;
    component.feedEditor.morning.enabled = true;
    component.feedEditor.morning.itemIds = [10];
    component.feedEditor.morning.itemAmounts[10] = 0;

    component.submitFeedEditor();

    expect(component.feedEditorError).toBe('Legalább egy időpontot válassz ki etetéshez.');
    expect(feedSchedService.create).not.toHaveBeenCalled();
  });

  it('manages feed editor item and horse selection helpers', async () => {
    await createComponent();
    component.horse = horse as any;

    component.toggleFeedItem('morning', 10);
    expect(component.isFeedItemSelected('morning', 10)).toBeTrue();
    expect(component.feedEditor.morning.itemAmounts[10]).toBe(1);

    component.updateFeedItemAmount('morning', 10, '2.5');
    expect(component.feedEditor.morning.itemAmounts[10]).toBe(2.5);

    component.updateFeedItemAmount('morning', 10, 'nem-szam');
    expect(component.feedEditor.morning.itemAmounts[10]).toBe(0);

    component.toggleHorseSelection('morning', 2);
    expect(component.feedEditor.morning.horseIds).toEqual([1, 2]);

    component.feedEditor.morning.includeOtherHorses = false;
    component.onToggleOtherHorses('morning');
    expect(component.feedEditor.morning.horseIds).toEqual([1]);

    component.toggleFeedItem('morning', 10);
    expect(component.isFeedItemSelected('morning', 10)).toBeFalse();

    component.showFeedEditor = true;
    component.cancelFeedEditor();
    expect(component.showFeedEditor).toBeFalse();
  });

  it('formats feed schedule and request helper data', async () => {
    await createComponent();
    component.horse = horse as any;
    component.items = [{ itemId: 10, name: 'Szena', itemType: 'HAY' }] as any;
    component.horsesForFeed = [
      { id: 1, horseName: 'Csillag' },
      { id: 2, horseName: 'Villam' },
    ] as any;
    component.feedScheds = [
      {
        feedSchedId: 8,
        horseIds: [1, 2],
        itemIds: [10],
        items: [{ itemId: 10, amount: 2 }],
        feedMorning: true,
      },
      {
        feedSchedId: 9,
        horseIds: [1],
        itemIds: [10],
        feedNoon: true,
      },
    ] as any;

    expect(component.getFeedSchedDisplayName(component.feedScheds[0] as any)).toBe('Reggel_8');
    expect(component.getFeedTimeLabel(component.feedScheds[1] as any)).toBe('Dél');
    expect(component.getFeedSchedDisplayName(null)).toBe('-');
    expect(component.getFeedSchedForTime('morning')?.feedSchedId).toBe(8);
    expect(component.getFeedHorseNames(component.feedScheds[0] as any)).toEqual([
      'Csillag',
      'Villam',
    ]);
    expect(component.getFeedItemDetails(component.feedScheds[0] as any)).toEqual(['Szena - 2 kg']);
    expect(component.getRequestTimeLabel({ requestedMorning: true, requestedEvening: true } as any)).toBe(
      'Reggel + Este',
    );
    expect(component.getRequestItemDetails({ items: [{ itemId: 10, amount: 2 }] } as any)).toEqual([
      'Szena (2)',
    ]);
    expect(component.getRequestHorseNames({ horseIds: [1, 99] } as any)).toEqual([
      'Csillag',
      'Ló #99',
    ]);
  });

  it('validates feed editor when enabled slot has no items', async () => {
    await createComponent();

    component.horse = horse as any;
    component.feedEditor.morning.enabled = true;
    component.feedEditor.morning.itemIds = [];

    component.submitFeedEditor();

    expect(component.feedEditorError).toBe('Legalább egy időpontot válassz ki etetéshez.');
    expect(feedSchedService.create).not.toHaveBeenCalled();
  });

  it('shows pending feed change message when the backend returns a request response', async () => {
    feedSchedService.create.and.returnValue(of('kérés' as any));

    await createComponent();
    spyOn(component, 'loadFeedScheds');

    component.horse = horse as any;
    component.feedEditor.morning.enabled = true;
    component.feedEditor.morning.itemIds = [10];
    component.feedEditor.morning.itemAmounts[10] = 2;

    component.submitFeedEditor();

    expect(component.feedChangePending).toBeTrue();
    expect(component.showFeedEditor).toBeFalse();
  });

  it('shows error when feed schedule creation fails in the editor', async () => {
    feedSchedService.create.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.horse = horse as any;
    component.feedEditor.morning.enabled = true;
    component.feedEditor.morning.itemIds = [10];
    component.feedEditor.morning.itemAmounts[10] = 2;

    component.submitFeedEditor();

    expect(feedSchedService.create).toHaveBeenCalled();
    expect(component.feedEditorError).toBe('Nem sikerült létrehozni az etetési ütemtervet.');
  });

  it('loads horses, pending requests and items for the owner feed editor', async () => {
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('OWNER') || roles.includes('ROLE_OWNER'),
    );
    horseService.getAll.and.returnValue(
      of([
        { id: 1, horseName: 'Csillag' },
        { id: 2, horseName: 'Villam' },
      ] as any),
    );
    horseService.getMyRequests.and.returnValue(of([{ id: 3, horseName: 'Pajtas' }] as any));

    await createComponent();

    component.horse = horse as any;
    component.addFeedSched();

    expect(component.showFeedEditor).toBeTrue();
    expect(component.horsesForFeed.map((h) => h.id)).toEqual([1, 2, 3]);
    expect(component.otherHorsesForFeed.map((h) => h.id)).toEqual([2, 3]);
  });

  it('opens feed editor with empty fallback state when owner lookups fail', async () => {
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('OWNER') || roles.includes('ROLE_OWNER'),
    );
    horseService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.horse = horse as any;
    component.addFeedSched();

    expect(component.showFeedEditor).toBeTrue();
    expect(component.horsesForFeed).toEqual([]);
    expect(component.otherHorsesForFeed).toEqual([]);
    expect(component.items).toEqual([]);
  });

  it('opens feed editor for non-owner users and falls back cleanly on errors', async () => {
    await createComponent();

    component.horse = horse as any;
    component.addFeedSched();

    expect(component.showFeedEditor).toBeTrue();
    expect(component.horsesForFeed.map((h) => h.id)).toEqual([1]);

    horseService.getAll.and.returnValue(throwError(() => new Error('fail')));
    itemService.getAll.and.returnValue(throwError(() => new Error('fail')));

    component.addFeedSched();

    expect(component.showFeedEditor).toBeTrue();
    expect(component.horsesForFeed).toEqual([]);
    expect(component.otherHorsesForFeed).toEqual([]);
    expect(component.items).toEqual([]);
  });

  it('shows and hides the feed toast when the editor creates a pending request', fakeAsync(async () => {
    feedSchedService.create.and.returnValue(of('kérés elküldve' as any));

    await createComponent();

    component.horse = horse as any;
    component.feedEditor.morning.enabled = true;
    component.feedEditor.morning.itemIds = [10];
    component.feedEditor.morning.itemAmounts[10] = 2;

    component.submitFeedEditor();

    expect(component.feedToastVisible).toBeTrue();
    tick(3000);
    expect(component.feedToastVisible).toBeFalse();
  }));

  it('exposes crud actions that delegate to the page methods', async () => {
    await createComponent();
    spyOn(component, 'editHorse');
    spyOn(component, 'addFeedSched');
    spyOn(component, 'addVaccination');
    spyOn(component, 'addFarrierApp');
    spyOn(component, 'addTreatment');

    component.crudActions.forEach((action) => action.onClick());

    expect(component.editHorse).toHaveBeenCalled();
    expect(component.addFeedSched).toHaveBeenCalled();
    expect(component.addVaccination).toHaveBeenCalled();
    expect(component.addFarrierApp).toHaveBeenCalled();
    expect(component.addTreatment).toHaveBeenCalled();
  });
});
