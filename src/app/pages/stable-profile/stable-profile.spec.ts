import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { StableProfilePage } from './stable-profile';
import { StableService } from '../../services/stable.service';
import { HorseService } from '../../services/horse.service';
import { AuthService } from '../../services/auth.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { ItemService } from '../../services/item.service';

describe('StableProfilePage', () => {
  let fixture: ComponentFixture<StableProfilePage>;
  let component: StableProfilePage;
  let stableService: jasmine.SpyObj<StableService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let authService: jasmine.SpyObj<AuthService>;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;
  let itemService: jasmine.SpyObj<ItemService>;
  let router: jasmine.SpyObj<Router>;

  const stable = {
    stableId: 1,
    stableName: 'Main',
    horses: [{ id: 1, horseName: 'Csillag', isActive: true }],
    stableItems: [],
  };

  async function createComponent(routeStableName: string | null = 'Main') {
    await TestBed.configureTestingModule({
      imports: [StableProfilePage],
      providers: [
        { provide: StableService, useValue: stableService },
        { provide: HorseService, useValue: horseService },
        { provide: AuthService, useValue: authService },
        { provide: FeedSchedService, useValue: feedSchedService },
        { provide: ItemService, useValue: itemService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(routeStableName ? { stableName: routeStableName } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StableProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    stableService = jasmine.createSpyObj<StableService>('StableService', ['getAll', 'update']);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['deactivate', 'delete']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', [
      'getAllOfHorseById',
    ]);
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'getCurrentNavigation']);

    stableService.getAll.and.returnValue(of([stable] as any));
    stableService.update.and.returnValue(of(stable as any));
    horseService.deactivate.and.returnValue(of({} as any));
    horseService.delete.and.returnValue(of('ok'));
    authService.hasAnyRole.and.returnValue(true);
    feedSchedService.getAllOfHorseById.and.returnValue(of([]));
    itemService.getAll.and.returnValue(of([]));
    router.getCurrentNavigation.and.returnValue(null);
  });

  it('shows error when no stable is selected', async () => {
    await createComponent(null);

    expect(component.error).toBe('Nincs kiválasztott istálló.');
    expect(component.loading).toBeFalse();
  });

  it('shows error when stable is not found', async () => {
    stableService.getAll.and.returnValue(of([] as any));

    await createComponent();

    expect(component.error).toBe('Nem található ilyen nevű istálló.');
    expect(component.loading).toBeFalse();
  });

  it('shows error when stable loading fails', async () => {
    stableService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az istálló adatait.');
    expect(component.loading).toBeFalse();
  });

  it('shows validation error for duplicate bedding items', async () => {
    await createComponent();

    component.stableEditItems = [
      { itemId: 10, usageKg: 2 },
      { itemId: 10, usageKg: 3 },
    ];

    component.saveStableEdits();

    expect(stableService.update).not.toHaveBeenCalled();
    expect(component.stableEditError).toBe('Ugyanaz az alom tétel csak egyszer szerepelhet.');
  });

  it('shows validation error for non-positive bedding usage', async () => {
    await createComponent();

    component.stableEditItems = [{ itemId: 10, usageKg: 0 }];

    component.saveStableEdits();

    expect(stableService.update).not.toHaveBeenCalled();
    expect(component.stableEditError).toBe(
      'Minden kiválasztott alom tételhez adj meg pozitív napi mennyiséget.',
    );
  });

  it('saves stable edits and refreshes totals on success', async () => {
    await createComponent();
    spyOn(component as any, 'loadDailyFeedTotals');

    component.editMode = true;
    component.stableEditItems = [{ itemId: 10, usageKg: 2 }];
    component.saveStableEdits();

    expect(stableService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({
        strawUsageKg: 2,
        stableItems: [{ itemId: 10, usageKg: 2 }],
      }),
    );
    expect(component.toastMessage).toBe('Istálló adatok frissítve.');
    expect(component.editMode).toBeFalse();
    expect((component as any).loadDailyFeedTotals).toHaveBeenCalled();
  });

  it('shows error when saving stable edits fails', async () => {
    stableService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.stableEditItems = [{ itemId: 10, usageKg: 2 }];
    component.saveStableEdits();

    expect(component.stableEditError).toBe('Nem sikerült menteni az istálló adatokat.');
  });

  it('navigates to horse edit from card click in edit mode', async () => {
    await createComponent();

    component.editMode = true;
    component.onHorseClick({ id: 1, horseName: 'Csillag' } as any);

    expect(router.navigate).toHaveBeenCalledWith(['/horses/edit', 1], {
      state: { returnToStable: 'Main' },
    });
  });

  it('shows toast and resets delete state when deactivation fails', async () => {
    horseService.deactivate.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.confirmDeleteHorse = { id: 1, horseName: 'Csillag' } as any;
    component.deleteMode = true;

    component.performDelete('deactivate');

    expect(component.toastMessage).toBe('Nem sikerült törölni a lovat.');
    expect(component.toastVisible).toBeTrue();
    expect(component.confirmDeleteHorse).toBeNull();
    expect(component.deleteMode).toBeFalse();
  });

  it('reloads stable after successful delete action', async () => {
    await createComponent();
    spyOn(component as any, 'fetchStable');

    component.confirmDeleteHorse = { id: 1, horseName: 'Csillag' } as any;
    component.deleteMode = true;
    component.performDelete('delete');

    expect(horseService.delete).toHaveBeenCalledWith(1);
    expect(component.toastMessage).toBe('A(z) Csillag törölve.');
    expect((component as any).fetchStable).toHaveBeenCalledWith('Main');
    expect(component.deleteMode).toBeFalse();
  });

  it('hides delete action when the user is not admin', async () => {
    authService.hasAnyRole.and.returnValue(false);

    await createComponent();

    expect(component.crudActions).toEqual([]);
  });
});
