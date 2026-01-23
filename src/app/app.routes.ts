import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { AdminUsersPage } from './pages/admin-users/admin-users';
import { HorsesPage } from './pages/horses/horses';
import { HorseProfilePage } from './pages/horse-profile/horse-profile';
import { HorseCreatePage } from './pages/horse-create/horse-create';
import { StablesPage } from './pages/stables/stables';
import { StableProfilePage } from './pages/stable-profile/stable-profile';
import { StableCreatePage } from './pages/stable-create/stable-create';
import { LoginPage } from './pages/login/login';
import { RegisterPage } from './pages/register/register';
import { authGuard } from './guards/auth.guard';
import { HorseEditPage } from './pages/horse-edit/horse-edit';
import { StoragesPage } from './pages/storages/storages';
import { StorageItemCreatePage } from './pages/storage-item-create/storage-item-create';
import { ItemProfilePage } from './pages/item-profile/item-profile';
import { ShotsPage } from './pages/shots/shots';
import { ShotCreatePage } from './pages/shot-create/shot-create';
import { ShotProfilePage } from './pages/shot-profile/shot-profile';
import { ShotEditPage } from './pages/shot-edit/shot-edit';
import { TreatmentsPage } from './pages/treatments/treatments';
import { TreatmentCreatePage } from './pages/treatment-create/treatment-create';
import { TreatmentProfilePage } from './pages/treatment-profile/treatment-profile';
import { TreatmentEditPage } from './pages/treatment-edit/treatment-edit';
import { FarrierAppsPage } from './pages/farrier-apps/farrier-apps';
import { FarrierAppCreatePage } from './pages/farrier-app-create/farrier-app-create';
import { FarrierAppProfilePage } from './pages/farrier-app-profile/farrier-app-profile';
import { FarrierAppEditPage } from './pages/farrier-app-edit/farrier-app-edit';
import { FeedSchedsPage } from './pages/feed-scheds/feed-scheds';
import { FeedSchedCreatePage } from './pages/feed-sched-create/feed-sched-create';
import { FeedSchedProfilePage } from './pages/feed-sched-profile/feed-sched-profile';
import { FeedSchedEditPage } from './pages/feed-sched-edit/feed-sched-edit';
import { CalendarPage } from './pages/calendar/calendar';
import { SettingsPage } from './pages/settings/settings';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  {
    path: '',
    component: HomePage,
    canActivate: [authGuard]
  },
  {
    path: 'admin/users',
    component: AdminUsersPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'user',
    redirectTo: 'settings',
    pathMatch: 'full'
  },
  {
    path: 'settings',
    component: SettingsPage,
    canActivate: [authGuard]
  },
  {
    path: 'horses',
    component: HorsesPage,
    canActivate: [authGuard]
  },
  {
    path: 'horses/new',
    component: HorseCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN']}
  },
  {
    path: 'horses/edit/:id',
    component: HorseEditPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER']}
  },
  {
    path: 'horses/:horseName',
    component: HorseProfilePage,
    canActivate: [authGuard]
  },
  {
    path: 'stables',
    component: StablesPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'EMPLOYEE']}
  },
  {
    path: 'stables/new',
    component: StableCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'stables/:stableName',
    component: StableProfilePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'EMPLOYEE']}
  },
  {
    path: 'storages',
    component: StoragesPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'EMPLOYEE'] }
  },
  {
    path: 'storages/new-item',
    component: StorageItemCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'items/:itemId',
    component: ItemProfilePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'EMPLOYEE'] }
  },
  {
    path: 'shots',
    component: ShotsPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'shots/new',
    component: ShotCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'shots/new/:horseId',
    component: ShotCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'shots/edit/:shotId',
    component: ShotEditPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'shots/:shotId',
    component: ShotProfilePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'treatments',
    component: TreatmentsPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'treatments/new',
    component: TreatmentCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'treatments/new/:horseId',
    component: TreatmentCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'treatments/edit/:treatmentId',
    component: TreatmentEditPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'treatments/:treatmentId',
    component: TreatmentProfilePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'farrier-apps',
    component: FarrierAppsPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'EMPLOYEE'] }
  },
  {
    path: 'farrier-apps/new',
    component: FarrierAppCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'farrier-apps/new/:horseId',
    component: FarrierAppCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'farrier-apps/edit/:farrierAppId',
    component: FarrierAppEditPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'farrier-apps/:farrierAppId',
    component: FarrierAppProfilePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'feed-scheds',
    component: FeedSchedsPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'EMPLOYEE'] }
  },
  {
    path: 'feed-scheds/new',
    component: FeedSchedCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'feed-scheds/new/:horseId',
    component: FeedSchedCreatePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'feed-scheds/edit/:feedSchedId',
    component: FeedSchedEditPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  {
    path: 'feed-scheds/:feedSchedId',
    component: FeedSchedProfilePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  { path: 'calendar',
    component: CalendarPage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER', 'EMPLOYEE'] }
  },
  { path: '**', redirectTo: '' }
];
