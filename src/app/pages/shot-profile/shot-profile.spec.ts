import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ShotProfilePage } from './shot-profile';
import { ShotService } from '../../services/shot.service';
import { HorseService } from '../../services/horse.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('ShotProfilePage', () => {
  let fixture: ComponentFixture<ShotProfilePage>;
  let component: ShotProfilePage;
  let shotService: jasmine.SpyObj<ShotService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let router: jasmine.SpyObj<Router>;

  const shot = {
    shotId: 1,
    shotName: 'Tetanuasz',
    date: '2026-01-10',
    frequencyUnit: 'MONTHS',
    frequencyValue: 6,
    horseIds: [1],
  };

  async function createComponent(shotId = '1', dueDate = '2026-03-01') {
    await configurePageTest(ShotProfilePage, {
      emptyTemplate: true,
      paramMap: { shotId },
      queryParamMap: { dueDate },
      providers: [
        { provide: ShotService, useValue: shotService },
        { provide: HorseService, useValue: horseService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(ShotProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    shotService = jasmine.createSpyObj<ShotService>('ShotService', ['getById', 'update', 'delete']);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    shotService.getById.and.returnValue(of(shot as any));
    shotService.update.and.returnValue(of('ok'));
    shotService.delete.and.returnValue(of('ok'));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen oltás azonosító.');
    expect(shotService.getById).not.toHaveBeenCalled();
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

  it('shows error when the shot itself cannot be loaded', async () => {
    shotService.getById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az oltást.');
    expect(component.loading).toBeFalse();
  });

  it('uses fallback labels for unknown horses and missing frequency', async () => {
    await createComponent();

    expect(component.getHorseNameById(99)).toBeNull();
    expect(component.getKnownHorseIds([1, 99])).toEqual([1]);
    component.shot = { shotId: 1, shotName: 'Teszt' } as any;
    expect(component.getFrequencyLabel()).toBe('-');
  });

  it('navigates back to the list when there is no browser history', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/shots']);
  });

  it('navigates to horse profiles by name', async () => {
    await createComponent();

    component.goToHorseProfile('Csillag');

    expect(router.navigate).toHaveBeenCalledWith(['/horses', 'Csillag']);
  });

  it('deletes the shot after confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    await createComponent();

    component.deleteShot();

    expect(shotService.delete).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/shots']);
  });

  it('alerts when shot deletion fails', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const alertSpy = spyOn(window, 'alert');
    shotService.delete.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    component.deleteShot();

    expect(alertSpy).toHaveBeenCalledWith('Nem sikerült törölni az oltást.');
  });

  it('shows error when assignment save fails', async () => {
    shotService.update.and.returnValue(throwError(() => new Error('fail')));

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

    expect(shotService.update).toHaveBeenCalledWith(
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
    component.confirmDueShot();

    expect(shotService.update).not.toHaveBeenCalled();
  });

  it('requires completion date before due confirmation', async () => {
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '';
    component.confirmDueShot();

    expect(shotService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Add meg az oltás dátumát.');
  });

  it('updates shot date when due completion is confirmed', fakeAsync(async () => {
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '2026-04-10';
    component.confirmDueShot();
    tick();

    expect(shotService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ date: '2026-04-10', horseIds: [1] }),
    );
    expect(component.successMessage).toBe('Az oltás dátuma frissítve.');
    expect(component.plannedDueDate).toBeNull();
    expect(component.markDueCompleted).toBeFalse();
    expect(component.shot?.date).toBe('2026-04-10');
  }));

  it('shows error when due completion update fails', async () => {
    shotService.update.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '2026-04-10';
    component.confirmDueShot();

    expect(component.error).toBe('Nem sikerült frissíteni az oltást.');
    expect(component.saving).toBeFalse();
  });
});
