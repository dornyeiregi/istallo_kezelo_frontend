import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ShotsPage } from './shots';
import { ShotService } from '../../services/shot.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('ShotsPage', () => {
  let fixture: ComponentFixture<ShotsPage>;
  let component: ShotsPage;
  let shotService: jasmine.SpyObj<ShotService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const shots = [
    { shotId: 1, shotName: 'A', date: '2026-01-01', frequencyUnit: 'DAYS', frequencyValue: 1 },
    { shotId: 2, shotName: 'B', date: '2026-02-01', frequencyUnit: 'MONTHS', frequencyValue: 6 },
  ];

  async function createComponent() {
    await configurePageTest(ShotsPage, {
      emptyTemplate: true,
      providers: [
        { provide: ShotService, useValue: shotService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(ShotsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    shotService = jasmine.createSpyObj<ShotService>('ShotService', ['getAll', 'delete']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    shotService.getAll.and.returnValue(of(shots as any));
    shotService.delete.and.returnValue(of('ok'));
    authService.hasAnyRole.and.returnValue(true);
  });

  it('sorts shots descending by date', async () => {
    await createComponent();

    expect(component.shots.map((shot) => shot.shotId)).toEqual([2, 1]);
  });

  it('shows error when shots cannot be loaded', async () => {
    shotService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az oltásokat.');
    expect(component.loading).toBeFalse();
  });

  it('navigates to create and home pages', async () => {
    await createComponent();

    component.addShot();
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/shots/new']);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('resets delete state when edit mode is enabled', async () => {
    await createComponent();

    component.deleteMode = true;
    component.confirmDeleteShot = component.shots[0] as any;
    component.toastVisible = true;

    component.toggleEditMode();

    expect(component.editMode).toBeTrue();
    expect(component.deleteMode).toBeFalse();
    expect(component.confirmDeleteShot).toBeNull();
    expect(component.toastVisible).toBeFalse();
  });

  it('navigates to edit page in edit mode', async () => {
    await createComponent();

    component.editMode = true;
    component.onCardClick(component.shots[0] as any);

    expect(router.navigate).toHaveBeenCalledWith(['/shots/edit', 2]);
    expect(component.editMode).toBeFalse();
  });

  it('opens the delete confirmation in delete mode', async () => {
    await createComponent();

    component.deleteMode = true;
    component.onCardClick(component.shots[0] as any);

    expect(component.confirmDeleteShot).toEqual(component.shots[0] as any);
  });

  it('navigates to the profile page on normal card click', async () => {
    await createComponent();

    component.onCardClick(component.shots[0] as any);

    expect(router.navigate).toHaveBeenCalledWith(['/shots', 2]);
  });

  it('does nothing when deleting without a selected shot id', async () => {
    await createComponent();

    component.confirmDeleteShot = { shotName: 'No Id' } as any;
    component.performDelete();

    expect(shotService.delete).not.toHaveBeenCalled();
  });

  it('removes shot from list after delete', async () => {
    await createComponent();

    component.confirmDeleteShot = component.shots[0] as any;
    component.performDelete();

    expect(shotService.delete).toHaveBeenCalledWith(2);
    expect(component.shots.map((shot) => shot.shotId)).toEqual([1]);
  });

  it('shows an error toast when shot deletion fails', async () => {
    shotService.delete.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    component.confirmDeleteShot = component.shots[0] as any;
    component.deleteMode = true;
    component.performDelete();

    expect(component.toastMessage).toBe('Nem sikerült törölni az oltást.');
    expect(component.confirmDeleteShot).toBeNull();
    expect(component.deleteMode).toBeFalse();
  });

  it('clears the selected delete target', async () => {
    await createComponent();

    component.confirmDeleteShot = component.shots[0] as any;
    component.cancelDelete();

    expect(component.confirmDeleteShot).toBeNull();
  });

  it('hides the toast automatically after a timeout', fakeAsync(async () => {
    await createComponent();

    component.showToast('teszt');
    expect(component.toastVisible).toBeTrue();

    tick(3000);
    expect(component.toastVisible).toBeFalse();
  }));

  it('returns frequency label with fallback handling', async () => {
    await createComponent();

    expect(component.getFrequencyLabel(component.shots[0] as any)).toBe('6 Hónap');
    expect(component.getFrequencyLabel({ frequencyValue: null, frequencyUnit: null } as any)).toBe('-');
  });

  it('returns no crud actions without proper role', async () => {
    authService.hasAnyRole.and.returnValue(false);

    await createComponent();

    expect(component.crudActions).toEqual([]);
  });

  it('exposes action handlers for admins and owners', async () => {
    await createComponent();

    const actions = component.crudActions;
    expect(actions).toHaveSize(3);

    actions[2].onClick();
    expect(component.deleteMode).toBeTrue();
    expect(component.editMode).toBeFalse();
  });
});
