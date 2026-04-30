import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TreatmentEditPage } from './treatment-edit';
import { TreatmentService } from '../../services/treatment.service';
import { HorseService } from '../../services/horse.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('TreatmentEditPage', () => {
  let fixture: ComponentFixture<TreatmentEditPage>;
  let component: TreatmentEditPage;
  let treatmentService: jasmine.SpyObj<TreatmentService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let router: jasmine.SpyObj<Router>;

  const treatment = {
    treatmentId: 1,
    treatmentName: 'Vizsgalat',
    description: 'Leiras',
    date: '2026-01-10',
    frequencyUnit: 'MONTHS',
    frequencyValue: 3,
    horseIds: [1],
  };

  async function createComponent(treatmentId = '1') {
    await configurePageTest(TreatmentEditPage, {
      emptyTemplate: true,
      paramMap: { treatmentId },
      providers: [
        { provide: TreatmentService, useValue: treatmentService },
        { provide: HorseService, useValue: horseService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(TreatmentEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    treatmentService = jasmine.createSpyObj<TreatmentService>('TreatmentService', [
      'getById',
      'update',
    ]);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    treatmentService.getById.and.returnValue(of(treatment as any));
    treatmentService.update.and.returnValue(of('ok'));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen kezelés azonosító.');
    expect(treatmentService.getById).not.toHaveBeenCalled();
  });

  it('shows error when load fails', async () => {
    treatmentService.getById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a kezelést.');
    expect(component.loading).toBeFalse();
  });

  it('validates required fields before update', async () => {
    await createComponent();

    component.form.treatmentName = '';
    component.onSubmit();

    expect(treatmentService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('A kezelés neve és dátuma kötelező.');
  });

  it('shows error when update fails', async () => {
    treatmentService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.onSubmit();

    expect(component.error).toBe('Nem sikerült frissíteni a kezelést.');
    expect(component.loading).toBeFalse();
  });

  it('updates treatment and navigates back to profile', fakeAsync(async () => {
    await createComponent();

    component.form.frequencyUnit = '';
    component.form.frequencyValue = undefined;
    component.onSubmit();
    tick(800);

    expect(treatmentService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({
        treatmentId: 1,
        frequencyUnit: null,
        frequencyValue: null,
        horseIds: [1],
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/treatments', 1], {
      state: { fromEdit: true },
    });
  }));
});
