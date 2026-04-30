import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HomePage } from './home';
import { AuthService } from '../../services/auth.service';
import { HorseService } from '../../services/horse.service';
import { FeedSchedService } from '../../services/feed-sched.service';
import { SettingsService } from '../../services/settings.service';
import { StorageService } from '../../services/storage.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;
  let authService: { currentUser$: any };
  let horseService: jasmine.SpyObj<HorseService>;
  let feedSchedService: jasmine.SpyObj<FeedSchedService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let storageService: jasmine.SpyObj<StorageService>;

  async function createComponent(user: any) {
    authService.currentUser$ = of(user);

    await configurePageTest(HomePage, {
      emptyTemplate: true,
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: HorseService, useValue: horseService },
        { provide: FeedSchedService, useValue: feedSchedService },
        { provide: SettingsService, useValue: settingsService },
        { provide: StorageService, useValue: storageService },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
      ],
    });

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    authService = { currentUser$: of(null) };
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getRequests']);
    feedSchedService = jasmine.createSpyObj<FeedSchedService>('FeedSchedService', [
      'getChangeRequests',
    ]);
    settingsService = jasmine.createSpyObj<SettingsService>('SettingsService', [
      'getEmployeeAccess',
    ]);
    storageService = jasmine.createSpyObj<StorageService>('StorageService', ['getAlerts']);

    horseService.getRequests.and.returnValue(of([{ id: 1 }, { id: 2 }] as any));
    feedSchedService.getChangeRequests.and.returnValue(of([{ id: 1 }] as any));
    settingsService.getEmployeeAccess.and.returnValue(
      of({ viewShots: true, viewTreatments: false, viewFarrierApps: true }),
    );
    storageService.getAlerts.and.returnValue(of([{ warningLevel: 'RED' }] as any));
  });

  it('loads request badge and storage warnings for admin', async () => {
    await createComponent({ userType: 'ADMIN' });

    expect(component.requestBadge).toBe(3);
    expect(component.storageWarningCount).toBe(1);
    expect(component.storageWarningLevel).toBe('RED');
  });

  it('falls back to disabled employee access settings when load fails', async () => {
    settingsService.getEmployeeAccess.and.returnValue(throwError(() => new Error('fail')));

    await createComponent({ userType: 'EMPLOYEE' });

    expect(component.employeeAccess).toEqual({
      viewShots: false,
      viewTreatments: false,
      viewFarrierApps: false,
    });
  });

  it('blocks employee tiles based on employee access flags', async () => {
    await createComponent({ userType: 'EMPLOYEE' });

    expect(component.canViewTile({ roles: ['EMPLOYEE'], link: '/shots' })).toBeTrue();
    expect(component.canViewTile({ roles: ['EMPLOYEE'], link: '/treatments' })).toBeFalse();
    expect(component.canViewTile({ roles: ['EMPLOYEE'], link: '/farrier-apps' })).toBeTrue();
  });

  it('resets storage warnings when alert loading fails', async () => {
    storageService.getAlerts.and.returnValue(throwError(() => new Error('fail')));

    await createComponent({ userType: 'EMPLOYEE' });

    expect(component.storageWarningCount).toBe(0);
    expect(component.storageWarningLevel).toBe('NONE');
  });
});
