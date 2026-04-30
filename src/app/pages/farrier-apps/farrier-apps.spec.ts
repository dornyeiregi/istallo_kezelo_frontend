import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FarrierAppsPage } from './farrier-apps';
import { FarrierAppService } from '../../services/farrier-app.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('FarrierAppsPage', () => {
  let fixture: ComponentFixture<FarrierAppsPage>;
  let component: FarrierAppsPage;
  let farrierAppService: jasmine.SpyObj<FarrierAppService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const apps = [
    { farrierAppId: 1, farrierName: 'B', appointmentDate: '2026-01-01' },
    { farrierAppId: 2, farrierName: 'A', appointmentDate: '2026-02-01' },
  ];

  async function createComponent() {
    await configurePageTest(FarrierAppsPage, {
      emptyTemplate: true,
      providers: [
        { provide: FarrierAppService, useValue: farrierAppService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(FarrierAppsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    farrierAppService = jasmine.createSpyObj<FarrierAppService>('FarrierAppService', [
      'getAll',
      'delete',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    farrierAppService.getAll.and.returnValue(of(apps as any));
    farrierAppService.delete.and.returnValue(of('ok'));
    authService.hasAnyRole.and.returnValue(true);
  });

  it('sorts farrier appointments descending by date', async () => {
    await createComponent();

    expect(component.farrierApps.map((app) => app.farrierAppId)).toEqual([2, 1]);
  });

  it('shows error when appointments cannot be loaded', async () => {
    farrierAppService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a patkolási időpontokat.');
    expect(component.loading).toBeFalse();
  });

  it('navigates to create and home pages', async () => {
    await createComponent();

    component.addFarrierApp();
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps/new']);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('resets delete state when edit mode is enabled', async () => {
    await createComponent();

    component.deleteMode = true;
    component.confirmDelete = component.farrierApps[0] as any;
    component.toastVisible = true;

    component.toggleEditMode();

    expect(component.editMode).toBeTrue();
    expect(component.deleteMode).toBeFalse();
    expect(component.confirmDelete).toBeNull();
    expect(component.toastVisible).toBeFalse();
  });

  it('navigates to edit from card click in edit mode', async () => {
    await createComponent();

    component.editMode = true;
    component.onCardClick(component.farrierApps[0] as any);

    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps/edit', 2]);
    expect(component.editMode).toBeFalse();
  });

  it('opens delete confirmation in delete mode', async () => {
    await createComponent();

    component.deleteMode = true;
    component.onCardClick(component.farrierApps[0] as any);

    expect(component.confirmDelete).toEqual(component.farrierApps[0] as any);
  });

  it('navigates to the profile page on normal card click', async () => {
    await createComponent();

    component.onCardClick(component.farrierApps[0] as any);

    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps', 2]);
  });

  it('does nothing when deletion is requested without an appointment id', async () => {
    await createComponent();

    component.confirmDelete = { farrierName: 'No Id' } as any;
    component.performDelete();

    expect(farrierAppService.delete).not.toHaveBeenCalled();
  });

  it('removes appointment from the list after delete', async () => {
    await createComponent();

    component.confirmDelete = component.farrierApps[0] as any;
    component.performDelete();

    expect(farrierAppService.delete).toHaveBeenCalledWith(2);
    expect(component.farrierApps.map((app) => app.farrierAppId)).toEqual([1]);
  });

  it('shows toast when delete fails', async () => {
    farrierAppService.delete.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.confirmDelete = apps[0] as any;
    component.deleteMode = true;
    component.performDelete();

    expect(component.toastMessage).toBe('Nem sikerült törölni az időpontot.');
    expect(component.confirmDelete).toBeNull();
    expect(component.deleteMode).toBeFalse();
  });

  it('clears the selected delete target', async () => {
    await createComponent();

    component.confirmDelete = component.farrierApps[0] as any;
    component.cancelDelete();

    expect(component.confirmDelete).toBeNull();
  });

  it('hides the toast automatically after a timeout', fakeAsync(async () => {
    await createComponent();

    component.showToast('teszt');
    expect(component.toastVisible).toBeTrue();

    tick(3000);
    expect(component.toastVisible).toBeFalse();
  }));

  it('returns no crud actions without admin or owner role', async () => {
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
