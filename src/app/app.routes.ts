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
    path: 'shots/:shotId',
    component: ShotProfilePage,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'OWNER'] }
  },
  { path: '**', redirectTo: '' }
];
