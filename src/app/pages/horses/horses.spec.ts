import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HorsesPage } from './horses';
import { HorseService } from '../../services/horse.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('HorsesPage', () => {
  let fixture: ComponentFixture<HorsesPage>;
  let component: HorsesPage;
  let horseService: jasmine.SpyObj<HorseService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let roles: string[] = [];

  async function createComponent() {
    await configurePageTest(HorsesPage, {
      emptyTemplate: true,
      providers: [
        { provide: HorseService, useValue: horseService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(HorsesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    roles = [];
    horseService = jasmine.createSpyObj<HorseService>('HorseService', [
      'getAll',
      'getMine',
      'getRequests',
      'getMyRequests',
      'getInactive',
      'delete',
      'deactivate',
      'activate',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    horseService.getMine.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    horseService.getRequests.and.returnValue(of([{ id: 2, horseName: 'Betyar' }] as any));
    horseService.getMyRequests.and.returnValue(of([{ id: 2, horseName: 'Betyar' }] as any));
    horseService.getInactive.and.returnValue(of([{ id: 3, horseName: 'Oreg' }] as any));
    horseService.delete.and.returnValue(of('ok') as any);
    horseService.deactivate.and.returnValue(of('ok') as any);
    horseService.activate.and.returnValue(of('ok') as any);

    authService.hasAnyRole.and.callFake((expected: string[]) =>
      expected.some((role) => roles.includes(role)),
    );
    spyOnProperty(history, 'state', 'get').and.returnValue({});
  });

  it('blocks inactive view switching without admin permission', async () => {
    await createComponent();

    component.setView('INACTIVE');

    expect(component.activeView).toBe('MINE');
    expect(component.error).toBe('');
    expect(horseService.getInactive).not.toHaveBeenCalled();
  });

  it('merges owner pending requests into visible horses', async () => {
    roles = ['OWNER'];

    await createComponent();

    expect(component.activeView).toBe('MINE');
    expect(component.horses.map((horse) => horse.id)).toEqual([1, 2]);
  });

  it('defaults to the all view for employees and shows the request-sent toast from history state', async () => {
    roles = ['EMPLOYEE'];
    (history.state as any).requestSent = true;

    await createComponent();

    expect(component.activeView).toBe('ALL');
    expect(component.toastMessage).toBe('Kérés elküldve, jóváhagyás után jelenik meg.');
  });

  it('shows error when horse loading fails', async () => {
    horseService.getMine.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a lovakat.');
  });

  it('limits owners to the own-horses view', async () => {
    roles = ['OWNER'];

    await createComponent();

    expect(component.availableViews).toEqual(['MINE']);
    expect(component.activeView).toBe('MINE');

    component.setView('PENDING');

    expect(component.activeView).toBe('MINE');
    expect(horseService.getMyRequests).toHaveBeenCalledTimes(1);
  });

  it('filters horses by name case-insensitively', async () => {
    await createComponent();

    component.horses = [
      { id: 1, horseName: 'Csillag' },
      { id: 2, horseName: 'Villam' },
      { id: 3, horseName: 'Fecske' },
    ] as any;

    component.searchTerm = 'lla';
    expect(component.filteredHorses.map((horse) => horse.horseName)).toEqual(['Csillag', 'Villam']);

    component.searchTerm = 'FECS';
    expect(component.filteredHorses.map((horse) => horse.horseName)).toEqual(['Fecske']);

    component.searchTerm = '   ';
    expect(component.filteredHorses.map((horse) => horse.horseName)).toEqual([
      'Csillag',
      'Villam',
      'Fecske',
    ]);
  });

  it('blocks unavailable view switching without changing the current list', async () => {
    await createComponent();

    component.setView('PENDING');

    expect(component.activeView).toBe('MINE');
    expect(component.error).toBe('');
    expect(component.horses).toEqual([{ id: 1, horseName: 'Csillag' }] as any);
  });

  it('navigates differently from card clicks in normal and edit mode', async () => {
    await createComponent();

    component.onCardClick({ id: 1, horseName: 'Csillag' } as any);
    component.editMode = true;
    component.onCardClick({ id: 2, horseName: 'Villam' } as any);

    expect(router.navigate).toHaveBeenCalledWith(['/horses', 'Csillag'], {
      state: { horse: { id: 1, horseName: 'Csillag' } },
    });
    expect(router.navigate).toHaveBeenCalledWith(['/horses/edit', 2]);
    expect(component.editMode).toBeFalse();
  });

  it('navigates from helper actions and toggles edit mode', async () => {
    await createComponent();

    component.addHorse();
    component.goBack();
    component.toggleEditMode();

    expect(router.navigate).toHaveBeenCalledWith(['/horses/new']);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(component.editMode).toBeTrue();
  });

  it('shows and hides toast messages after a timeout', fakeAsync(async () => {
    await createComponent();

    component.showToast('teszt');

    expect(component.toastVisible).toBeTrue();
    tick(3000);
    expect(component.toastVisible).toBeFalse();
  }));

  it('deletes horses directly and shows an error when deletion fails', async () => {
    await createComponent();

    component.horses = [{ id: 1, horseName: 'Csillag' }] as any;
    component.deleteHorse({ id: 1, horseName: 'Csillag' } as any);

    expect(component.horses).toEqual([]);

    horseService.delete.and.returnValue(throwError(() => new Error('fail')));
    component.deleteHorse({ id: 2, horseName: 'Villam' } as any);

    expect(component.error).toBe('Nem sikerült törölni a lovat.');
  });

  it('reloads after successful deactivation delete', async () => {
    await createComponent();
    spyOn(component, 'loadHorses');

    component.confirmDeleteHorse = { id: 1, horseName: 'Csillag' } as any;
    component.deleteMode = true;
    component.performDelete('deactivate');

    expect(horseService.deactivate).toHaveBeenCalledWith(1);
    expect(component.toastMessage).toContain('eltávolítva az istállóból');
    expect(component.confirmDeleteHorse).toBeNull();
    expect(component.deleteMode).toBeFalse();
    expect(component.loadHorses).toHaveBeenCalled();
  });

  it('handles successful hard delete and cancelDelete', async () => {
    await createComponent();
    spyOn(component, 'loadHorses');

    component.confirmDeleteHorse = { id: 1, horseName: 'Csillag' } as any;
    component.deleteMode = true;
    component.performDelete('delete');

    expect(horseService.delete).toHaveBeenCalledWith(1);
    expect(component.loadHorses).toHaveBeenCalled();

    component.confirmDeleteHorse = { id: 2, horseName: 'Villam' } as any;
    component.cancelDelete();
    expect(component.confirmDeleteHorse).toBeNull();
  });

  it('shows toast when activation fails', async () => {
    horseService.activate.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.activateHorse({ id: 1, horseName: 'Csillag' } as any);

    expect(component.toastMessage).toBe('Nem sikerült aktiválni a lovat.');
  });

  it('activates horses successfully and refreshes the list', async () => {
    await createComponent();
    spyOn(component, 'loadHorses');

    component.activateHorse({ id: 1, horseName: 'Csillag' } as any);

    expect(component.toastMessage).toBe('A(z) Csillag aktiválva.');
    expect(component.loadHorses).toHaveBeenCalled();
  });

  it('hides delete action without admin permission', async () => {
    roles = ['OWNER'];

    await createComponent();

    expect(component.crudActions.map((action) => action.label)).not.toContain('Törlés');
  });

  it('hides horse add and edit actions for employees', async () => {
    roles = ['EMPLOYEE'];

    await createComponent();

    expect(component.crudActions.map((action) => action.label)).not.toContain('Új ló hozzáadása');
    expect(component.crudActions.map((action) => action.label)).not.toContain('Szerkesztés');
  });

  it('exposes admin crud actions and sex labels', async () => {
    roles = ['ADMIN'];

    await createComponent();

    component.crudActions[0].onClick();
    component.crudActions[1].onClick();
    component.crudActions[2].onClick();

    expect(component.deleteMode).toBeTrue();
    expect(component.getSexLabel('M')).toBe('Csődör');
    expect(component.getSexLabel('F')).toBe('Kanca');
    expect(component.getSexLabel('G')).toBe('Herélt');
    expect(component.getSexLabel('X')).toBe('X');
  });
});
