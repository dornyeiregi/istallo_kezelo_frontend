import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FeedSchedCreatePage } from './feed-sched-create';
import { FeedSchedService } from '../../services/feed-sched.service';
import { HorseService } from '../../services/horse.service';
import { ItemService } from '../../services/item.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('FeedSchedCreatePage', () => {
  let fixture: ComponentFixture<FeedSchedCreatePage>;
  let component: FeedSchedCreatePage;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let itemService: jasmine.SpyObj<ItemService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent(horseId = '1') {
    await configurePageTest(FeedSchedCreatePage, {
      emptyTemplate: true,
      paramMap: { horseId },
      providers: [
        { provide: FeedSchedService, useValue: feedSchedService },
        { provide: HorseService, useValue: horseService },
        { provide: ItemService, useValue: itemService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(FeedSchedCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', [
      'getAll',
      'create',
    ]);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll', 'getById']);
    itemService = jasmine.createSpyObj<ItemService>('ItemService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    horseService.getById.and.returnValue(of({ id: 1, horseName: 'Csillag' } as any));
    itemService.getAll.and.returnValue(
      of([
        { itemId: 1, name: 'Szena', itemType: 'HAY' },
        { itemId: 2, name: 'Alom', itemType: 'BEDDING' },
      ] as any),
    );
    feedSchedService.getAll.and.returnValue(of([{ feedSchedId: 4 }] as any));
    feedSchedService.create.and.returnValue(of('ok'));
  });

  it('preselects horse from route and filters bedding items', async () => {
    await createComponent();

    expect(component.selectedHorseIds.has(1)).toBeTrue();
    expect(component.items.map((item) => item.name)).toEqual(['Szena']);
    expect(component.nextFeedSchedId).toBe(5);
  });

  it('validates that at least one feed time is selected', async () => {
    await createComponent();

    component.onSubmit();

    expect(feedSchedService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('Az etetési időpont megadása kötelező.');
  });

  it('validates positive amount for selected items', async () => {
    await createComponent();

    component.form.feedMorning = true;
    component.selectedItemIds.add(1);
    component.itemAmounts[1] = 0;

    component.onSubmit();

    expect(feedSchedService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('Minden kiválasztott tételhez adj meg pozitív mennyiséget.');
  });

  it('shows error when create fails', async () => {
    feedSchedService.create.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.form.feedMorning = true;

    component.onSubmit();

    expect(component.error).toBe('Nem sikerült létrehozni az etetési ütemtervet.');
    expect(component.loading).toBeFalse();
  });

  it('navigates to horse profile after successful create', fakeAsync(async () => {
    await createComponent();

    component.form.feedMorning = true;
    component.selectedItemIds.add(1);
    component.itemAmounts[1] = 2;

    component.onSubmit();
    tick(1000);

    expect(feedSchedService.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        feedMorning: true,
        horseIds: [1],
        itemIds: [1],
        items: [{ itemId: 1, amount: 2 }],
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/horses', 'Csillag'], {
      state: { horse: jasmine.objectContaining({ horseName: 'Csillag' }) },
    });
  }));
});
