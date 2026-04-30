import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HorseCreatePage } from './horse-create';
import { HorseService } from '../../services/horse.service';
import { StableService } from '../../services/stable.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { FeedSchedItemService } from '../../services/feed-sched-item.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('HorseCreatePage', () => {
  let fixture: ComponentFixture<HorseCreatePage>;
  let component: HorseCreatePage;
  let horseService: jasmine.SpyObj<HorseService>;
  let stableService: jasmine.SpyObj<StableService>;
  let userService: jasmine.SpyObj<UserService>;
  let authService: jasmine.SpyObj<AuthService>;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;
  let feedSchedItemService: jasmine.SpyObj<FeedSchedItemService>;
  let router: jasmine.SpyObj<Router>;
  async function createComponent() {
    await configurePageTest(HorseCreatePage, {
      emptyTemplate: true,
      providers: [
        { provide: HorseService, useValue: horseService },
        { provide: StableService, useValue: stableService },
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: FeedSchedService, useValue: feedSchedService },
        { provide: FeedSchedItemService, useValue: feedSchedItemService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(HorseCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['create']);
    stableService = jasmine.createSpyObj<StableService>('StableService', ['getAll']);
    userService = jasmine.createSpyObj<UserService>('UserService', ['getAll']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', ['getAll']);
    feedSchedItemService = jasmine.createSpyObj<FeedSchedItemService>('FeedSchedItemService', [
      'getAll',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    horseService.create.and.returnValue(of({ id: 1 } as any));
    stableService.getAll.and.returnValue(of([{ stableName: 'Barn' }] as any));
    userService.getAll.and.returnValue(of([{ userId: 1, username: 'anna' }] as any));
    feedSchedService.getAll.and.returnValue(of([{ feedSchedId: 5, feedMorning: true }] as any));
    feedSchedItemService.getAll.and.returnValue(
      of([{ feedSchedId: 5, itemName: 'Szena', amount: 2 }] as any),
    );
    authService.hasAnyRole.and.returnValue(true);
  });

  it('preselects stable from navigation state and loads admin lookups', async () => {
    spyOnProperty(history, 'state', 'get').and.returnValue({ preselectStableName: 'Barn' });
    authService.hasAnyRole.and.returnValue(true);

    await createComponent();

    expect(component.horse.stableName).toBe('Barn');
    expect(stableService.getAll).toHaveBeenCalled();
    expect(feedSchedService.getAll).toHaveBeenCalled();
    expect(userService.getAll).toHaveBeenCalled();
  });

  it('shows error when admin lookup loading fails', async () => {
    stableService.getAll.and.returnValue(throwError(() => new Error('fail')));
    authService.hasAnyRole.and.returnValue(true);

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az istállókat.');
  });

  it('does not load admin-only lookups for non-admins', async () => {
    spyOnProperty(history, 'state', 'get').and.returnValue({});
    authService.hasAnyRole.and.returnValue(false);

    await createComponent();

    expect(stableService.getAll).not.toHaveBeenCalled();
    expect(feedSchedService.getAll).not.toHaveBeenCalled();
    expect(userService.getAll).not.toHaveBeenCalled();
  });

  it('shows error when horse creation fails', async () => {
    horseService.create.and.returnValue(throwError(() => new Error('fail')));
    spyOnProperty(history, 'state', 'get').and.returnValue({});
    authService.hasAnyRole.and.returnValue(true);

    await createComponent();

    component.onSubmit();

    expect(component.error).toBe('Nem sikerült létrehozni a lovat.');
    expect(component.loading).toBeFalse();
  });

  it('builds feed schedule select label with item details', async () => {
    spyOnProperty(history, 'state', 'get').and.returnValue({});
    authService.hasAnyRole.and.returnValue(true);

    await createComponent();

    const label = component.getFeedSchedSelectLabel({
      feedSchedId: 5,
      feedMorning: true,
      feedNoon: false,
      feedEvening: false,
    } as any);

    expect(label).toContain('REGGEL_5');
    expect(label).toContain('Szena (2)');
  });
});
