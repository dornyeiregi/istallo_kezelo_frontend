import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FarrierAppProfilePage } from './farrier-app-profile';
import { FarrierAppService } from '../../services/farrier-app.service';
import { HorseService } from '../../services/horse.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('FarrierAppProfilePage', () => {
  let fixture: ComponentFixture<FarrierAppProfilePage>;
  let component: FarrierAppProfilePage;
  let farrierAppService: jasmine.SpyObj<FarrierAppService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let router: jasmine.SpyObj<Router>;

  const farrierApp = {
    farrierAppId: 1,
    farrierName: 'John',
    farrierPhone: '123',
    appointmentDate: '2026-01-10',
    horseIds: [1],
    horseDetails: [{ horseId: 1, shoeCount: 4, note: '' }],
  };

  async function createComponent(paramId = '1') {
    await configurePageTest(FarrierAppProfilePage, {
      paramMap: { farrierAppId: paramId },
      providers: [
        { provide: FarrierAppService, useValue: farrierAppService },
        { provide: HorseService, useValue: horseService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(FarrierAppProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    farrierAppService = jasmine.createSpyObj<FarrierAppService>('FarrierAppService', [
      'getById',
      'update',
      'delete',
    ]);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);

    farrierAppService.getById.and.returnValue(of(farrierApp as any));
    farrierAppService.update.and.returnValue(of('ok'));
    farrierAppService.delete.and.returnValue(of('ok'));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen patkolási időpont azonosító.');
    expect(farrierAppService.getById).not.toHaveBeenCalled();
  });

  it('shows error when assigned horses cannot be loaded', async () => {
    horseService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a lovakat.');
    expect(component.loading).toBeFalse();
  });

  it('shows error when the appointment itself cannot be loaded', async () => {
    farrierAppService.getById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a patkolási időpontot.');
    expect(component.loading).toBeFalse();
  });

  it('returns fallback values for unknown horses', async () => {
    await createComponent();

    expect(component.getHorseNameById(99)).toBeNull();
    expect(component.getKnownHorseIds([1, 99])).toEqual([1]);
  });

  it('deletes the farrier appointment after confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    await createComponent();

    component.deleteFarrierApp();

    expect(farrierAppService.delete).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps']);
  });

  it('alerts when delete fails', async () => {
    const alertSpy = spyOn(window, 'alert');
    spyOn(window, 'confirm').and.returnValue(true);
    farrierAppService.delete.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.deleteFarrierApp();

    expect(alertSpy).toHaveBeenCalledWith('Nem sikerült törölni az időpontot.');
  });

  it('shows error when horse assignment save fails', async () => {
    farrierAppService.update.and.returnValue(throwError(() => new Error('fail')));

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

    expect(farrierAppService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ horseIds: [1] }),
    );
    expect(component.successMessage).toBe('Lovak sikeresen frissítve.');
    expect(component.editHorsesMode).toBeFalse();
    jasmine.clock().tick(2000);
    expect(component.successMessage).toBe('');
    jasmine.clock().uninstall();
  });

  it('does not update due farrier when completion date is missing', async () => {
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '';

    component.confirmDueFarrier();

    expect(farrierAppService.update).not.toHaveBeenCalled();
    expect(component.error).toBe('Add meg a patkolás dátumát.');
  });

  it('does not confirm due completion when it is not enabled', async () => {
    await createComponent();

    component.markDueCompleted = false;
    component.confirmDueFarrier();

    expect(farrierAppService.update).not.toHaveBeenCalled();
  });

  it('updates due farrier date and clears pending due state', async () => {
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '2026-02-10';
    component.plannedDueDate = '2026-02-01';

    component.confirmDueFarrier();

    expect(farrierAppService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({
        appointmentDate: '2026-02-10',
        horseIds: [1],
      }),
    );
    expect(component.successMessage).toBe('A patkolás dátuma frissítve.');
    expect(component.plannedDueDate).toBeNull();
    expect(component.markDueCompleted).toBeFalse();
    expect(component.farrierApp?.appointmentDate).toBe('2026-02-10');
  });

  it('shows error when due completion update fails', async () => {
    farrierAppService.update.and.returnValue(throwError(() => new Error('fail')));
    await createComponent();

    component.markDueCompleted = true;
    component.completedDate = '2026-02-10';
    component.confirmDueFarrier();

    expect(component.error).toBe('Nem sikerült frissíteni a patkolást.');
    expect(component.saving).toBeFalse();
  });

  it('navigates back to the list when opened from edit', async () => {
    await createComponent();

    spyOnProperty(history, 'state', 'get').and.returnValue({ fromEdit: true });

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps']);
  });

  it('falls back to the list when there is no browser history', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps']);
  });
});
