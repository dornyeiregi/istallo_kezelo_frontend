import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ShotEditPage } from './shot-edit';
import { ShotService } from '../../services/shot.service';
import { HorseService } from '../../services/horse.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('ShotEditPage', () => {
  let fixture: ComponentFixture<ShotEditPage>;
  let component: ShotEditPage;
  let shotService: jasmine.SpyObj<ShotService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const shot = {
    shotId: 1,
    shotName: 'Tetanuasz',
    date: '2026-01-10',
    frequencyUnit: 'MONTHS',
    frequencyValue: 6,
    horseIds: [1],
  };

  async function createComponent(shotId = '1') {
    await configurePageTest(ShotEditPage, {
      emptyTemplate: true,
      paramMap: { shotId },
      providers: [
        { provide: ShotService, useValue: shotService },
        { provide: HorseService, useValue: horseService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(ShotEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    shotService = jasmine.createSpyObj<ShotService>('ShotService', ['getById', 'update']);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll', 'getMine']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    shotService.getById.and.returnValue(of(shot as any));
    shotService.update.and.returnValue(of('ok'));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    horseService.getMine.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    authService.hasAnyRole.and.returnValue(false);
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen oltás azonosító.');
    expect(shotService.getById).not.toHaveBeenCalled();
  });

  it('loads owner horses with getMine', async () => {
    authService.hasAnyRole.and.returnValue(true);

    await createComponent();

    expect(horseService.getMine).toHaveBeenCalled();
    expect(horseService.getAll).not.toHaveBeenCalled();
  });

  it('shows error when load fails', async () => {
    shotService.getById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az oltást.');
    expect(component.loading).toBeFalse();
  });

  it('validates required fields before update', async () => {
    await createComponent();

    component.form.shotName = '';
    component.onSubmit();

    expect(shotService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Az oltás neve és dátuma kötelező.');
  });

  it('updates shot and navigates back to profile', fakeAsync(async () => {
    await createComponent();

    component.form.frequencyUnit = '';
    component.form.frequencyValue = undefined;
    component.onSubmit();
    tick(800);

    expect(shotService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({
        shotId: 1,
        frequencyUnit: null,
        frequencyValue: null,
        horseIds: [1],
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/shots', 1], { state: { fromEdit: true } });
  }));
});
