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

  beforeEach(async () => {
    shotService = jasmine.createSpyObj<ShotService>('ShotService', ['create']);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    horseService.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ShotCreatePage],
      providers: [
        { provide: ShotService, useValue: shotService },
        { provide: HorseService, useValue: horseService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShotCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads horses on init', () => {
    expect(horseService.getAll).toHaveBeenCalled();
  });

  it('does not submit when required fields are missing', () => {
    component.onSubmit();

    expect(shotService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('Az oltás neve és dátuma kötelező.');
  });

  it('submits shot payload with selected horses', () => {
    const response: ShotDTO = {
      shotId: 1,
      shotName: 'Tetanus',
      date: '2026-01-10',
    };
    shotService.create.and.returnValue(of(response));

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

  it('shows error when create fails', () => {
    shotService.create.and.returnValue(throwError(() => new Error('fail')));

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
