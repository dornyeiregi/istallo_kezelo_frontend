import { Type } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AdminUsersPage } from './admin-users/admin-users';
import { CalendarPage } from './calendar/calendar';
import { FarrierAppCreatePage } from './farrier-app-create/farrier-app-create';
import { FarrierAppEditPage } from './farrier-app-edit/farrier-app-edit';
import { FarrierAppProfilePage } from './farrier-app-profile/farrier-app-profile';
import { FarrierAppsPage } from './farrier-apps/farrier-apps';
import { FeedSchedCreatePage } from './feed-sched-create/feed-sched-create';
import { FeedSchedEditPage } from './feed-sched-edit/feed-sched-edit';
import { FeedSchedProfilePage } from './feed-sched-profile/feed-sched-profile';
import { HomePage } from './home/home';
import { HorseCreatePage } from './horse-create/horse-create';
import { HorseEditPage } from './horse-edit/horse-edit';
import { HorseProfilePage } from './horse-profile/horse-profile';
import { HorsesPage } from './horses/horses';
import { RequestsPage } from './requests/requests';
import { SettingsPage } from './settings/settings';
import { ShotEditPage } from './shot-edit/shot-edit';
import { ShotProfilePage } from './shot-profile/shot-profile';
import { ShotsPage } from './shots/shots';
import { StableCreatePage } from './stable-create/stable-create';
import { StableProfilePage } from './stable-profile/stable-profile';
import { StablesPage } from './stables/stables';
import { StorageItemCreatePage } from './storage-item-create/storage-item-create';
import { StoragesPage } from './storages/storages';
import { TreatmentEditPage } from './treatment-edit/treatment-edit';
import { TreatmentProfilePage } from './treatment-profile/treatment-profile';
import { TreatmentsPage } from './treatments/treatments';
import { UserProfilePage } from './user-profile/user-profile';

import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { CalendarEventService } from '../services/calendar-event.service';
import { FarrierAppService } from '../services/farrier-app.service';
import { FeedSchedItemService } from '../services/feed-sched-item.service';
import { FeedSchedService } from '../services/feed-sched.service';
import { HorseFarrierAppService } from '../services/horse-farrier-app.service';
import { HorseFeedSchedService } from '../services/horse-feed-sched.service';
import { HorseService } from '../services/horse.service';
import { HorseShotService } from '../services/horse-shot.service';
import { HorseTreatmentService } from '../services/horse-treatment.service';
import { ItemService } from '../services/item.service';
import { SettingsService } from '../services/settings.service';
import { ShotService } from '../services/shot.service';
import { StableService } from '../services/stable.service';
import { StorageService } from '../services/storage.service';
import { ThemeService } from '../services/theme.service';
import { TreatmentService } from '../services/treatment.service';
import { UserService } from '../services/user.service';

const activatedRouteStub = {
  snapshot: {
    paramMap: convertToParamMap({
      horseId: '1',
      horseName: 'Csillag',
      horsename: 'Csillag',
      shotId: '1',
      treatmentId: '1',
      farrierAppId: '1',
      feedSchedId: '1',
      stableName: 'Main',
      id: '1',
    }),
    queryParamMap: convertToParamMap({
      dueDate: '2026-01-10',
    }),
  },
};

const authUser = {
  id: 1,
  username: 'anna',
  email: 'anna@example.com',
  userType: 'OWNER',
  roles: ['OWNER'],
  fullName: 'Nagy Anna',
};

const userDto = {
  userId: 1,
  username: 'anna',
  email: 'anna@example.com',
  phone: '123',
  userType: 'OWNER' as const,
  userFname: 'Anna',
  userLname: 'Nagy',
};

const horseDto = {
  id: 1,
  horseName: 'Csillag',
  dob: '2020-01-01',
  sex: 'M',
  microchipNum: 'chip-1',
  passportNum: 'pass-1',
  additional: '',
};

const feedSchedDto = {
  feedSchedId: 1,
  description: 'Morning',
  horseIds: [],
  itemIds: [],
};

const farrierAppDto = {
  farrierAppId: 1,
  farrierName: 'John',
  farrierPhone: '123',
  appointmentDate: '2026-01-10',
  horseIds: [],
};

const shotDto = {
  shotId: 1,
  shotName: 'Tetanus',
  date: '2026-01-10',
  horseIds: [],
};

const treatmentDto = {
  treatmentId: 1,
  treatmentName: 'Checkup',
  description: '',
  date: '2026-01-10',
  horseIds: [],
};

const defaultProviders = [
  FormBuilder,
  {
    provide: ActivatedRoute,
    useValue: activatedRouteStub,
  },
  {
    provide: AdminService,
    useValue: {
      getAllUsers: () => of([]),
      updateUserRole: () => of('ok'),
      deleteUser: () => of('ok'),
      createUser: () => of('ok'),
    },
  },
  {
    provide: AuthService,
    useValue: {
      currentUser$: of(authUser),
      hasAnyRole: () => false,
      updateStoredUser: () => undefined,
      changePassword: () => of(null),
    },
  },
  {
    provide: CalendarEventService,
    useValue: {
      create: () => of({}),
      getById: () => of({
        id: 1,
        horseId: 1,
        eventType: 'CUSTOM',
        eventDate: '2026-01-10',
      }),
      getAll: () => of([]),
      update: () => of({}),
      delete: () => of(null),
    },
  },
  {
    provide: FarrierAppService,
    useValue: {
      getAll: () => of([]),
      getById: () => of(farrierAppDto),
      getAllOfHorseById: () => of([]),
      create: () => of(farrierAppDto),
      update: () => of('ok'),
      delete: () => of('ok'),
    },
  },
  {
    provide: FeedSchedItemService,
    useValue: {
      getAll: () => of([]),
      create: () => of({}),
    },
  },
  {
    provide: FeedSchedService,
    useValue: {
      getAll: () => of([]),
      getById: () => of(feedSchedDto),
      getAllOfHorseById: () => of([]),
      create: () => of('ok'),
      update: () => of('ok'),
      delete: () => of('ok'),
      getChangeRequests: () => of([]),
      getMyChangeRequests: () => of([]),
      approveChangeRequest: () => of('ok'),
      rejectChangeRequest: () => of('ok'),
    },
  },
  {
    provide: HorseFarrierAppService,
    useValue: {
      getAll: () => of([]),
      getById: () => of({ horseId: 1, farrierAppId: 1 }),
      getAllOfHorseById: () => of([]),
      create: () => of({}),
    },
  },
  {
    provide: HorseFeedSchedService,
    useValue: {
      getAll: () => of([]),
      getById: () => of({ horseId: 1, feedSchedId: 1 }),
      getAllOfHorseById: () => of([]),
      create: () => of({}),
      deleteAllForHorse: () => of('ok'),
    },
  },
  {
    provide: HorseService,
    useValue: {
      getAll: () => of([]),
      getById: () => of(horseDto),
      getByName: () => of(horseDto),
      create: () => of(horseDto),
      update: () => of(horseDto),
      delete: () => of('ok'),
      deactivate: () => of('ok'),
      getMine: () => of([]),
      getRequests: () => of([]),
      getMyRequests: () => of([]),
      getInactive: () => of([]),
    },
  },
  {
    provide: HorseShotService,
    useValue: {
      addShotToHorse: () => of({}),
    },
  },
  {
    provide: HorseTreatmentService,
    useValue: {
      getAll: () => of([]),
      create: () => of({}),
    },
  },
  {
    provide: ItemService,
    useValue: {
      getAll: () => of([]),
      getItemById: () =>
        of({
          itemId: 1,
          name: 'Hay',
          itemType: 'FEED',
          itemCategory: 'CONSUMABLE',
        }),
      create: () => of({}),
      update: () => of('ok'),
      delete: () => of('ok'),
    },
  },
  {
    provide: SettingsService,
    useValue: {
      getEmployeeAccess: () =>
        of({
          viewShots: false,
          viewTreatments: false,
          viewFarrierApps: false,
        }),
      updateEmployeeAccess: () =>
        of({
          viewShots: true,
          viewTreatments: true,
          viewFarrierApps: true,
        }),
    },
  },
  {
    provide: ShotService,
    useValue: {
      getAll: () => of([]),
      getAllOfHorseById: () => of([]),
      getById: () => of(shotDto),
      create: () => of(shotDto),
      update: () => of('ok'),
      delete: () => of('ok'),
    },
  },
  {
    provide: StableService,
    useValue: {
      getAll: () => of([]),
      getById: () => of({ stableId: 1, stableName: 'Main', horses: [] }),
      getByName: () => of({ stableId: 1, stableName: 'Main', horses: [] }),
      create: () => of({}),
      update: () => of({}),
      delete: () => of('ok'),
    },
  },
  {
    provide: StorageService,
    useValue: {
      getAll: () => of([]),
      getAlerts: () => of([]),
      create: () => of({}),
      update: () => of('ok'),
      delete: () => of('ok'),
    },
  },
  {
    provide: ThemeService,
    useValue: {
      getTheme: () => 'sage',
      setTheme: () => undefined,
    },
  },
  {
    provide: TreatmentService,
    useValue: {
      getAll: () => of([]),
      getById: () => of(treatmentDto),
      getAllOfHorseById: () => of([]),
      create: () => of(treatmentDto),
      update: () => of('ok'),
      delete: () => of('ok'),
    },
  },
  {
    provide: UserService,
    useValue: {
      getAll: () => of([]),
      getById: () => of(userDto),
      getByUsername: () => of(userDto),
      create: () => of(userDto),
      update: () => of(userDto),
    },
  },
];

const pages: Array<{ name: string; component: Type<unknown>; emptyTemplate?: boolean }> = [
  { name: 'AdminUsersPage', component: AdminUsersPage },
  { name: 'CalendarPage', component: CalendarPage, emptyTemplate: true },
  { name: 'FarrierAppCreatePage', component: FarrierAppCreatePage },
  { name: 'FarrierAppEditPage', component: FarrierAppEditPage },
  { name: 'FarrierAppProfilePage', component: FarrierAppProfilePage },
  { name: 'FarrierAppsPage', component: FarrierAppsPage },
  { name: 'FeedSchedCreatePage', component: FeedSchedCreatePage },
  { name: 'FeedSchedEditPage', component: FeedSchedEditPage },
  { name: 'FeedSchedProfilePage', component: FeedSchedProfilePage },
  { name: 'HomePage', component: HomePage },
  { name: 'HorseCreatePage', component: HorseCreatePage },
  { name: 'HorseEditPage', component: HorseEditPage },
  { name: 'HorseProfilePage', component: HorseProfilePage },
  { name: 'HorsesPage', component: HorsesPage },
  { name: 'RequestsPage', component: RequestsPage },
  { name: 'SettingsPage', component: SettingsPage },
  { name: 'ShotEditPage', component: ShotEditPage },
  { name: 'ShotProfilePage', component: ShotProfilePage },
  { name: 'ShotsPage', component: ShotsPage },
  { name: 'StableCreatePage', component: StableCreatePage },
  { name: 'StableProfilePage', component: StableProfilePage },
  { name: 'StablesPage', component: StablesPage },
  { name: 'StorageItemCreatePage', component: StorageItemCreatePage },
  { name: 'StoragesPage', component: StoragesPage },
  { name: 'TreatmentEditPage', component: TreatmentEditPage },
  { name: 'TreatmentProfilePage', component: TreatmentProfilePage },
  { name: 'TreatmentsPage', component: TreatmentsPage },
  { name: 'UserProfilePage', component: UserProfilePage },
];

for (const page of pages) {
  describe(page.name, () => {
    beforeEach(async () => {
      if (page.emptyTemplate) {
        TestBed.overrideComponent(page.component, {
          set: {
            template: '',
          },
        });
      }

      await TestBed.configureTestingModule({
        imports: [page.component],
        providers: [provideRouter([]), ...defaultProviders],
      }).compileComponents();
    });

    it('creates the page component', () => {
      const fixture = TestBed.createComponent(page.component);
      expect(fixture.componentInstance).toBeTruthy();
    });
  });
}
