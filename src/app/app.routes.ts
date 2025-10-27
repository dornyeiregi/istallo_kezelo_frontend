import { Routes } from '@angular/router';
import { HorsesPage } from './pages/horses/horses';
import { StablesPage } from './pages/stables/stables';

export const routes: Routes = [
  { path: '', redirectTo: '/horses', pathMatch: 'full' },
  { path: 'horses', component: HorsesPage },
  { path: 'stables', component: StablesPage }
];
