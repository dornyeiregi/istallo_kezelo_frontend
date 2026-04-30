import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FarrierAppEditPage } from './farrier-app-edit';
import { FarrierAppService } from '../../services/farrier-app.service';
import { HorseService } from '../../services/horse.service';

describe('FarrierAppEditPage', () => {
  let fixture: ComponentFixture<FarrierAppEditPage>;
  let component: FarrierAppEditPage;
  let farrierAppService: jasmine.SpyObj<FarrierAppService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let router: jasmine.SpyObj<Router>;

  const farrierApp = {
    farrierAppId: 1,
    farrierName: 'John',
    farrierPhone: '123',
    appointmentDate: '2026-01-10',
    frequencyUnit: 'MONTHS',
    frequencyValue: 2,
    horseIds: [2],
    horseDetails: [{ horseId: 2, shoeCount: 2, note: 'front only' }],
  };

  async function createComponent(paramId: string = '1') {
    await TestBed.configureTestingModule({
      imports: [FarrierAppEditPage],
      providers: [
        { provide: FarrierAppService, useValue: farrierAppService },
        { provide: HorseService, useValue: horseService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ farrierAppId: paramId }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FarrierAppEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    farrierAppService = jasmine.createSpyObj<FarrierAppService>('FarrierAppService', [
      'getById',
      'update',
    ]);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    farrierAppService.getById.and.returnValue(of(farrierApp as any));
    farrierAppService.update.and.returnValue(of('ok'));
    horseService.getAll.and.returnValue(of([{ id: 2, horseName: 'Csillag' }] as any));
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen patkolási időpont azonosító.');
    expect(farrierAppService.getById).not.toHaveBeenCalled();
  });

  it('shows error when data loading fails', async () => {
    farrierAppService.getById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a patkolási időpontot.');
    expect(component.loading).toBeFalse();
  });

  it('does not submit when required fields are missing', async () => {
    await createComponent();

    component.form.farrierName = '';
    component.onSubmit();

    expect(farrierAppService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('A patkolási időpont neve és dátuma kötelező.');
  });

  it('submits update payload with selected horses and details', async () => {
    await createComponent();

    component.selectedHorseIds = new Set([2]);
    component.horseDetails.set(2, { horseId: 2, shoeCount: 4, note: 'done' });

    component.onSubmit();

    expect(farrierAppService.update).toHaveBeenCalledWith(1, {
      farrierAppId: 1,
      farrierName: 'John',
      farrierPhone: '123',
      appointmentDate: '2026-01-10',
      frequencyUnit: 'MONTHS',
      frequencyValue: 2,
      shoes: null,
      horseIds: [2],
      horseDetails: [{ horseId: 2, shoeCount: 4, note: 'done' }],
    });
    expect(component.success).toBeTrue();
  });
});
