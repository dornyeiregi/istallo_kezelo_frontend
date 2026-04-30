import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FeedSchedEditPage } from './feed-sched-edit';
import { FeedSchedService } from '../../services/feed-sched.service';
import { HorseService } from '../../services/horse.service';
import { ItemService } from '../../services/item.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('FeedSchedEditPage', () => {
  let fixture: ComponentFixture<FeedSchedEditPage>;
  let component: FeedSchedEditPage;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;

  const feedSched = {
    feedSchedId: 1,
    feedMorning: true,
    feedNoon: false,
    feedEvening: false,
    description: 'Morning feed',
    horseIds: [1],
    itemIds: [2],
    items: [{ itemId: 2, amount: 3 }],
  };

  async function createComponent(paramId = '1') {
    await configurePageTest(FeedSchedEditPage, {
      paramMap: { feedSchedId: paramId },
      providers: [
        { provide: FeedSchedService, useValue: feedSchedService },
        {
          provide: HorseService,
          useValue: jasmine.createSpyObj<HorseService>('HorseService', ['getAll']),
        },
        {
          provide: ItemService,
          useValue: jasmine.createSpyObj<ItemService>('ItemService', ['getAll']),
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj<Router>('Router', ['navigate']),
        },
      ],
    });

    const horseService = TestBed.inject(HorseService) as jasmine.SpyObj<HorseService>;
    const itemService = TestBed.inject(ItemService) as jasmine.SpyObj<ItemService>;
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    itemService.getAll.and.returnValue(of([{ itemId: 2, itemType: 'FEED', name: 'Hay' }] as any));

    fixture = TestBed.createComponent(FeedSchedEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', [
      'getById',
      'update',
    ]);
    feedSchedService.getById.and.returnValue(of(feedSched as any));
    feedSchedService.update.and.returnValue(of('ok'));
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen etetési ütemterv azonosító.');
    expect(feedSchedService.getById).not.toHaveBeenCalled();
  });

  it('does not submit without any feed time selected', async () => {
    await createComponent();

    component.form.feedMorning = false;
    component.form.feedNoon = false;
    component.form.feedEvening = false;

    component.onSubmit();

    expect(feedSchedService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Az etetési időpont megadása kötelező.');
  });

  it('does not submit when selected item amount is invalid', async () => {
    await createComponent();

    component.selectedItemIds = new Set([2]);
    component.itemAmounts[2] = 0;

    component.onSubmit();

    expect(feedSchedService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Minden kiválasztott tételhez adj meg pozitív mennyiséget.');
    expect(component.loading).toBeFalse();
  });

  it('shows error when update fails', async () => {
    feedSchedService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.selectedItemIds = new Set([2]);
    component.itemAmounts[2] = 2;
    component.onSubmit();

    expect(component.error).toBe('Nem sikerült frissíteni az etetési ütemtervet.');
    expect(component.loading).toBeFalse();
  });
});
