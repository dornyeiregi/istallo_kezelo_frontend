import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TreatmentsPage } from './treatments';
import { TreatmentService } from '../../services/treatment.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('TreatmentsPage', () => {
  let fixture: ComponentFixture<TreatmentsPage>;
  let component: TreatmentsPage;
  let treatmentService: jasmine.SpyObj<TreatmentService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const treatments = [
    { treatmentId: 1, treatmentName: 'A', date: '2026-01-01' },
    { treatmentId: 2, treatmentName: 'B', date: '2026-02-01' },
  ];

  async function createComponent() {
    await configurePageTest(TreatmentsPage, {
      emptyTemplate: true,
      providers: [
        { provide: TreatmentService, useValue: treatmentService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(TreatmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    treatmentService = jasmine.createSpyObj<TreatmentService>('TreatmentService', [
      'getAll',
      'delete',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    treatmentService.getAll.and.returnValue(of(treatments as any));
    treatmentService.delete.and.returnValue(of('ok'));
    authService.hasAnyRole.and.returnValue(true);
  });

  it('sorts treatments descending by date', async () => {
    await createComponent();

    expect(component.treatments.map((treatment) => treatment.treatmentId)).toEqual([2, 1]);
  });

  it('shows error when treatments cannot be loaded', async () => {
    treatmentService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a kezeléseket.');
  });

  it('navigates to edit page in edit mode', async () => {
    await createComponent();

    component.editMode = true;
    component.onCardClick(component.treatments[0] as any);

    expect(router.navigate).toHaveBeenCalledWith(['/treatments/edit', 2]);
    expect(component.editMode).toBeFalse();
  });

  it('removes treatment from list after delete', async () => {
    await createComponent();

    component.confirmDeleteTreatment = component.treatments[0] as any;
    component.performDelete();

    expect(treatmentService.delete).toHaveBeenCalledWith(2);
    expect(component.treatments.map((treatment) => treatment.treatmentId)).toEqual([1]);
  });

  it('returns no crud actions without proper role', async () => {
    authService.hasAnyRole.and.returnValue(false);

    await createComponent();

    expect(component.crudActions).toEqual([]);
  });
});
