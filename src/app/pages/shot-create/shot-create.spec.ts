import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ShotCreatePage } from './shot-create';
import { ShotService } from '../../services/shot.service';
import { HorseService } from '../../services/horse.service';
import { ShotDTO } from '../../models/shot.model';

describe('ShotCreatePage', () => {
  let fixture: ComponentFixture<ShotCreatePage>;
  let component: ShotCreatePage;
  let shotService: jasmine.SpyObj<ShotService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let router: jasmine.SpyObj<Router>;
  let routeHorseId: string | null;

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [ShotCreatePage],
      providers: [
        { provide: ShotService, useValue: shotService },
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

    fixture = TestBed.createComponent(ShotCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    shotService = jasmine.createSpyObj<ShotService>('ShotService', ['create']);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routeHorseId = null;

    horseService.getAll.and.returnValue(of([]));
  });

  it('loads horses on init', async () => {
    await createComponent();

    expect(horseService.getAll).toHaveBeenCalled();
  });

  it('preselects horse from route param', async () => {
    routeHorseId = '3';

    await createComponent();

    expect(component.selectedHorseIds.has(3)).toBeTrue();
  });

  it('shows error when horses cannot be loaded', async () => {
    horseService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a lovakat.');
  });

  it('does not submit when required fields are missing', async () => {
    await createComponent();

    component.onSubmit();

    expect(shotService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('Az oltás neve és dátuma kötelező.');
  });

  it('submits shot payload with selected horses', async () => {
    const response: ShotDTO = {
      shotId: 1,
      shotName: 'Tetanus',
      date: '2026-01-10',
    };
    shotService.create.and.returnValue(of(response));

    await createComponent();

    component.form = {
      shotName: 'Tetanus',
      date: '2026-01-10',
      frequencyUnit: 'YEARS',
      frequencyValue: 1,
      horseIds: [],
    };
    component.selectedHorseIds.add(2);

    component.onSubmit();

    expect(shotService.create).toHaveBeenCalledWith({
      shotName: 'Tetanus',
      date: '2026-01-10',
      frequencyUnit: 'YEARS',
      frequencyValue: 1,
      horseIds: [2],
    });
    expect(component.success).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('sends null frequency fields when frequency is empty', async () => {
    shotService.create.and.returnValue(of({ shotId: 1 } as any));

    await createComponent();

    component.form = {
      shotName: 'Tetanus',
      date: '2026-01-10',
      frequencyUnit: '',
      frequencyValue: undefined,
      horseIds: [],
    };

    component.onSubmit();

    expect(shotService.create).toHaveBeenCalledWith({
      shotName: 'Tetanus',
      date: '2026-01-10',
      frequencyUnit: null,
      frequencyValue: null,
      horseIds: [],
    });
  });

  it('shows error when create fails', async () => {
    shotService.create.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.form = {
      shotName: 'Tetanus',
      date: '2026-01-10',
      frequencyUnit: '',
      frequencyValue: undefined,
      horseIds: [],
    };

    component.onSubmit();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Nem sikerült létrehozni az oltást.');
  });
});
