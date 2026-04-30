import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FarrierAppCreatePage } from './farrier-app-create';
import { FarrierAppService } from '../../services/farrier-app.service';
import { HorseService } from '../../services/horse.service';

describe('FarrierAppCreatePage', () => {
  let fixture: ComponentFixture<FarrierAppCreatePage>;
  let component: FarrierAppCreatePage;
  let farrierAppService: jasmine.SpyObj<FarrierAppService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent(routeHorseId: string | null = null) {
    await TestBed.configureTestingModule({
      imports: [FarrierAppCreatePage],
      providers: [
        { provide: FarrierAppService, useValue: farrierAppService },
        { provide: HorseService, useValue: horseService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(routeHorseId ? { horseId: routeHorseId } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FarrierAppCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    farrierAppService = jasmine.createSpyObj<FarrierAppService>('FarrierAppService', ['create']);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    farrierAppService.create.and.returnValue(of({ farrierAppId: 1 } as any));
    horseService.getAll.and.returnValue(of([]));
  });

  it('preselects horse from route param and creates default horse details', async () => {
    await createComponent('2');

    expect(component.selectedHorseIds.has(2)).toBeTrue();
    expect(component.getHorseDetail(2)).toEqual({ horseId: 2, shoeCount: 4, note: '' });
  });

  it('shows error when horses cannot be loaded', async () => {
    horseService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a lovakat.');
  });

  it('does not submit when required fields are missing', async () => {
    await createComponent();

    component.onSubmit();

    expect(farrierAppService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('A patkolási időpont neve és dátuma kötelező.');
  });

  it('submits payload with selected horses and horse details', async () => {
    await createComponent();

    component.form = {
      farrierName: 'John',
      farrierPhone: '123',
      appointmentDate: '2026-01-10',
      frequencyUnit: 'MONTHS',
      frequencyValue: 2,
      horseIds: [],
    };
    component.selectedHorseIds = new Set([2]);
    component.horseDetails.set(2, { horseId: 2, shoeCount: 2, note: 'front only' });

    component.onSubmit();

    expect(farrierAppService.create).toHaveBeenCalledWith({
      farrierName: 'John',
      farrierPhone: '123',
      appointmentDate: '2026-01-10',
      frequencyUnit: 'MONTHS',
      frequencyValue: 2,
      shoes: null,
      horseIds: [2],
      horseDetails: [{ horseId: 2, shoeCount: 2, note: 'front only' }],
    });
    expect(component.success).toBeTrue();
  });
});
