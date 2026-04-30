import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TreatmentProfilePage } from './treatment-profile';
import { TreatmentService } from '../../services/treatment.service';
import { HorseService } from '../../services/horse.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('TreatmentProfilePage', () => {
  let fixture: ComponentFixture<TreatmentProfilePage>;
  let component: TreatmentProfilePage;
  let treatmentService: jasmine.SpyObj<TreatmentService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let router: jasmine.SpyObj<Router>;

  const treatment = {
    treatmentId: 1,
    treatmentName: 'Vizsgalat',
    description: '',
    date: '2026-01-10',
    frequencyUnit: 'MONTHS',
    frequencyValue: 3,
    horseIds: [1],
  };

  async function createComponent(treatmentId = '1', dueDate = '2026-03-01') {
    await configurePageTest(TreatmentProfilePage, {
      emptyTemplate: true,
      paramMap: { treatmentId },
      queryParamMap: { dueDate },
      providers: [
        { provide: TreatmentService, useValue: treatmentService },
        { provide: HorseService, useValue: horseService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(TreatmentProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    treatmentService = jasmine.createSpyObj<TreatmentService>('TreatmentService', [
      'getById',
      'update',
      'delete',
    ]);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    treatmentService.getById.and.returnValue(of(treatment as any));
    treatmentService.update.and.returnValue(of('ok'));
    treatmentService.delete.and.returnValue(of('ok'));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen kezelés azonosító.');
    expect(treatmentService.getById).not.toHaveBeenCalled();
  });

  it('prepopulates completed date from due date query param', async () => {
    await createComponent();

    expect(component.plannedDueDate).toBe('2026-03-01');
    expect(component.completedDate).toBe('2026-03-01');
  });

  it('shows error when horse list cannot be loaded', async () => {
    horseService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a lovakat.');
  });

  it('shows error when the treatment itself cannot be loaded', async () => {
    treatmentService.getById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a kezelést.');
    expect(component.loading).toBeFalse();
  });

  it('uses fallback labels for unknown horses and missing frequency', async () => {
    await createComponent();

    expect(component.getHorseNameById(99)).toBeNull();
    expect(component.getKnownHorseIds([1, 99])).toEqual([1]);
    component.treatment = { treatmentId: 1, treatmentName: 'Teszt' } as any;
    expect(component.getFrequencyLabel()).toBe('-');
  });

  it('navigates back to the list when there is no browser history', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/treatments']);
  });

  it('deletes the treatment after confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    await createComponent();

    component.deleteTreatment();

    expect(treatmentService.delete).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/treatments']);
  });

  it('alerts when treatment deletion fails', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const alertSpy = spyOn(window, 'alert');
    treatmentService.delete.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    component.deleteTreatment();

    expect(alertSpy).toHaveBeenCalledWith('Nem sikerült törölni a kezelést.');
  });

  it('shows error when assignment save fails', async () => {
    treatmentService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.saveHorseAssignments();

    expect(component.error).toBe('Nem sikerült frissíteni a lovakat.');
    expect(component.saving).toBeFalse();
  });

  it('saves horse assignments and exits edit mode on success', async () => {
    jasmine.clock().install();
    await createComponent();

    component.editHorsesMode = true;
    component.selectedHorseIds = new Set([1]);
    component.saveHorseAssignments();

    expect(treatmentService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ horseIds: [1] }),
    );
    expect(component.successMessage).toBe('Lovak sikeresen frissítve.');
    expect(component.editHorsesMode).toBeFalse();
    jasmine.clock().tick(2000);
    expect(component.successMessage).toBe('');
    jasmine.clock().uninstall();
  });

  it('does not confirm due completion when it is not enabled', async () => {
    await createComponent();

    component.markDueCompleted = false;
    component.confirmDueTreatment();

    expect(treatmentService.update).not.toHaveBeenCalled();
  });

  it('requires completion date before due confirmation', async () => {
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '';
    component.confirmDueTreatment();

    expect(treatmentService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Add meg a kezelés dátumát.');
  });

  it('updates treatment date when due completion is confirmed', fakeAsync(async () => {
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '2026-04-10';
    component.confirmDueTreatment();
    tick();

    expect(treatmentService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ date: '2026-04-10', horseIds: [1] }),
    );
    expect(component.successMessage).toBe('A kezelés dátuma frissítve.');
    expect(component.plannedDueDate).toBeNull();
    expect(component.markDueCompleted).toBeFalse();
    expect(component.treatment?.date).toBe('2026-04-10');
  }));

  it('shows error when due completion update fails', async () => {
    treatmentService.update.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '2026-04-10';
    component.confirmDueTreatment();

    expect(component.error).toBe('Nem sikerült frissíteni a kezelést.');
    expect(component.saving).toBeFalse();
  });
});
