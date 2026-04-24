import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TreatmentCreatePage } from './treatment-create';
import { TreatmentService } from '../../services/treatment.service';
import { HorseService } from '../../services/horse.service';
import { TreatmentDTO } from '../../models/treatment.model';

describe('TreatmentCreatePage', () => {
  let fixture: ComponentFixture<TreatmentCreatePage>;
  let component: TreatmentCreatePage;
  let treatmentService: jasmine.SpyObj<TreatmentService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    treatmentService = jasmine.createSpyObj<TreatmentService>('TreatmentService', ['create']);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    horseService.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TreatmentCreatePage],
      providers: [
        { provide: TreatmentService, useValue: treatmentService },
        { provide: HorseService, useValue: horseService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads horses on init', () => {
    expect(horseService.getAll).toHaveBeenCalled();
  });

  it('does not submit when required fields are missing', () => {
    component.onSubmit();

    expect(treatmentService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('A kezelés neve és dátuma kötelező.');
  });

  it('submits treatment payload with selected horses', () => {
    const response: TreatmentDTO = {
      treatmentId: 1,
      treatmentName: 'Dental check',
      description: 'Annual control',
      date: '2026-01-10',
    };
    treatmentService.create.and.returnValue(of(response));

    component.form = {
      treatmentName: 'Dental check',
      description: 'Annual control',
      frequencyUnit: 'MONTHS',
      frequencyValue: 6,
      date: '2026-01-10',
    };
    component.selectedHorseIds.add(2);

    component.onSubmit();

    expect(treatmentService.create).toHaveBeenCalledWith({
      treatmentName: 'Dental check',
      description: 'Annual control',
      frequencyUnit: 'MONTHS',
      frequencyValue: 6,
      date: '2026-01-10',
      horseIds: [2],
    });
    expect(component.success).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('shows error when create fails', () => {
    treatmentService.create.and.returnValue(throwError(() => new Error('fail')));

    component.form = {
      treatmentName: 'Dental check',
      description: '',
      frequencyUnit: '',
      frequencyValue: undefined,
      date: '2026-01-10',
    };

    component.onSubmit();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Nem sikerült létrehozni a kezelést.');
  });
});
