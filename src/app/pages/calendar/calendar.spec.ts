import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CalendarPage } from './calendar';
import { CalendarEventService } from '../../services/calendar-event.service';
import { AuthService } from '../../services/auth.service';
import { ShotService } from '../../services/shot.service';
import { HorseService } from '../../services/horse.service';
import { TreatmentService } from '../../services/treatment.service';
import { FarrierAppService } from '../../services/farrier-app.service';
import { SettingsService } from '../../services/settings.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('CalendarPage', () => {
  let fixture: ComponentFixture<CalendarPage>;
  let component: CalendarPage;
  let calendarEventService: jasmine.SpyObj<CalendarEventService>;
  let authService: jasmine.SpyObj<AuthService>;
  let shotService: jasmine.SpyObj<ShotService>;
  let horseService: jasmine.SpyObj<HorseService>;
  let treatmentService: jasmine.SpyObj<TreatmentService>;
  let farrierAppService: jasmine.SpyObj<FarrierAppService>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent() {
    await configurePageTest(CalendarPage, {
      emptyTemplate: true,
      providers: [
        { provide: CalendarEventService, useValue: calendarEventService },
        { provide: AuthService, useValue: authService },
        { provide: ShotService, useValue: shotService },
        { provide: HorseService, useValue: horseService },
        { provide: TreatmentService, useValue: treatmentService },
        { provide: FarrierAppService, useValue: farrierAppService },
        { provide: SettingsService, useValue: settingsService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(CalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    calendarEventService = jasmine.createSpyObj<CalendarEventService>('CalendarEventService', [
      'getAll',
      'create',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    shotService = jasmine.createSpyObj<ShotService>('ShotService', ['getAll']);
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getAll']);
    treatmentService = jasmine.createSpyObj<TreatmentService>('TreatmentService', ['getAll']);
    farrierAppService = jasmine.createSpyObj<FarrierAppService>('FarrierAppService', ['getAll']);
    settingsService = jasmine.createSpyObj<SettingsService>('SettingsService', [
      'getEmployeeAccess',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    calendarEventService.getAll.and.returnValue(of([]));
    calendarEventService.create.and.returnValue(of({} as any));
    shotService.getAll.and.returnValue(of([]));
    treatmentService.getAll.and.returnValue(of([]));
    farrierAppService.getAll.and.returnValue(of([]));
    horseService.getAll.and.returnValue(of([{ id: 1, horseName: 'Csillag' }] as any));
    settingsService.getEmployeeAccess.and.returnValue(
      of({ viewShots: true, viewTreatments: true, viewFarrierApps: true }),
    );
    authService.hasAnyRole.and.returnValue(false);
  });

  it('allows appointment creation for owner roles', async () => {
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('OWNER') || roles.includes('ROLE_OWNER'),
    );

    await createComponent();

    expect(component.canCreateAppointments).toBeTrue();
  });

  it('resets custom popup state when opened', async () => {
    await createComponent();

    component.showAddMenu = true;
    component.customError = 'hiba';
    component.customDate = '2026-05-01';
    component.customDescription = 'Megjegyzes';
    component.customHorseIds = new Set([1]);

    component.openCustomEvent();

    expect(component.showAddMenu).toBeFalse();
    expect(component.customError).toBe('');
    expect(component.customDate).toBe('');
    expect(component.customDescription).toBe('');
    expect(component.customHorseIds.size).toBe(0);
    expect(component.showCustomPopup).toBeTrue();
  });

  it('validates custom event date, description and horse selection', async () => {
    await createComponent();

    component.submitCustomEvent();
    expect(component.customError).toBe('Add meg a dátumot.');

    component.customDate = '2026-05-01';
    component.submitCustomEvent();
    expect(component.customError).toBe('Add meg a leírást.');

    component.customDescription = 'Teszt';
    component.submitCustomEvent();
    expect(component.customError).toBe('Válassz legalább egy lovat.');
  });

  it('creates custom events for all selected horses and reloads', async () => {
    await createComponent();
    spyOn(component, 'reload');

    component.customDate = '2026-05-01';
    component.customDescription = 'Megjegyzes';
    component.customHorseIds = new Set([1, 2]);
    component.showCustomPopup = true;

    component.submitCustomEvent();

    expect(calendarEventService.create).toHaveBeenCalledTimes(2);
    expect(component.showCustomPopup).toBeFalse();
    expect(component.reload).toHaveBeenCalled();
  });

  it('shows error when custom event creation fails', async () => {
    calendarEventService.create.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.customDate = '2026-05-01';
    component.customDescription = 'Megjegyzes';
    component.customHorseIds = new Set([1]);
    component.submitCustomEvent();

    expect(component.customError).toBe('Nem sikerült létrehozni az eseményt.');
    expect(component.loading).toBeFalse();
  });

  it('navigates to due shot profile with due date on event click', async () => {
    await createComponent();

    (component as any).onEventClick({
      event: {
        extendedProps: {
          dto: { eventType: 'SHOT_DUE', relatedEntityId: 5, eventDate: '2026-06-01' },
        },
      },
    } as any);

    expect(router.navigate).toHaveBeenCalledWith(['/shots', 5], {
      queryParams: { dueDate: '2026-06-01' },
    });
  });

  it('navigates to the create page for the selected appointment type', async () => {
    await createComponent();

    component.showAddMenu = true;
    component.createAppointment('treatment');

    expect(component.showAddMenu).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/treatments/new']);
  });

  it('navigates home on goBack', async () => {
    await createComponent();

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('filters events by selected type and horse', async () => {
    await createComponent();

    (component as any).allEvents = [
      { eventType: 'SHOT', horseId: 1, eventDate: '2026-05-01', horseName: 'Csillag' },
      { eventType: 'CUSTOM', horseId: 2, eventDate: '2026-05-02', horseName: 'Villam' },
    ];
    component.selectedEventType = 'SHOT';
    component.selectedHorseId = '1';

    component.onFilterChange();

    const events = component.calendarOptions.events as any[];
    expect(events.length).toBe(1);
    expect(events[0].title).toContain('Oltás');
  });

  it('hides disallowed event types for employees from filters and rendered events', async () => {
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('EMPLOYEE') || roles.includes('ROLE_EMPLOYEE'),
    );
    settingsService.getEmployeeAccess.and.returnValue(
      of({ viewShots: false, viewTreatments: true, viewFarrierApps: false }),
    );

    await createComponent();

    expect(component.availableEventTypes).toEqual(['all', 'TREATMENT', 'CUSTOM']);

    (component as any).allEvents = [
      { eventType: 'SHOT', horseId: 1, eventDate: '2026-05-01', horseName: 'Csillag' },
      { eventType: 'TREATMENT', horseId: 1, eventDate: '2026-05-02', horseName: 'Csillag' },
      { eventType: 'FARRIER_APP', horseId: 1, eventDate: '2026-05-03', horseName: 'Csillag' },
      { eventType: 'CUSTOM', horseId: 1, eventDate: '2026-05-04', horseName: 'Csillag' },
    ];

    component.onFilterChange();

    const events = component.calendarOptions.events as any[];
    expect(events.map((event) => event.title)).toEqual([
      jasmine.stringMatching('Kezelés'),
      jasmine.stringMatching('Egyéb esemény'),
    ]);
  });

  it('resets selected type filter when employee access removes it', async () => {
    await createComponent();

    component.selectedEventType = 'SHOT';
    component.canViewShots = false;
    component.canViewTreatments = false;
    component.canViewFarrierApps = false;

    (component as any).ensureValidSelectedEventType();

    expect(component.selectedEventType).toBe('all');
  });

  it('routes treatment and farrier due events to the proper profile page', async () => {
    await createComponent();

    (component as any).onEventClick({
      event: {
        extendedProps: {
          dto: { eventType: 'TREATMENT_DUE', relatedEntityId: 6, eventDate: '2026-06-03' },
        },
      },
    } as any);
    (component as any).onEventClick({
      event: {
        extendedProps: {
          dto: { eventType: 'FARRIER_APP_DUE', relatedEntityId: 7, eventDate: '2026-06-04' },
        },
      },
    } as any);

    expect(router.navigate).toHaveBeenCalledWith(['/treatments', 6], {
      queryParams: { dueDate: '2026-06-03' },
    });
    expect(router.navigate).toHaveBeenCalledWith(['/farrier-apps', 7], {
      queryParams: { dueDate: '2026-06-04' },
    });
  });

  it('ignores clicks when the event has no related entity id', async () => {
    await createComponent();

    (component as any).onEventClick({
      event: {
        extendedProps: {
          dto: { eventType: 'CUSTOM', eventDate: '2026-06-01' },
        },
      },
    } as any);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('reloads when the visible calendar range changes', async () => {
    await createComponent();
    spyOn(component, 'reload');

    (component as any).onDatesSet({
      start: new Date('2026-05-01T00:00:00Z'),
      end: new Date('2026-06-01T00:00:00Z'),
    });

    expect((component as any).viewStart).toBe('2026-05-01');
    expect((component as any).viewEnd).toBe('2026-06-01');
    expect(component.reload).toHaveBeenCalled();
  });

  it('formats visible range dates without utc day shifting', async () => {
    await createComponent();

    expect((component as any).toCalendarDateString(new Date(2026, 4, 1))).toBe('2026-05-01');
    expect((component as any).parseCalendarDate('2026-05-01')).toEqual(new Date(2026, 4, 1));
  });

  it('builds due shot dates in local calendar days', async () => {
    await createComponent();

    const result = (component as any).buildDueShotEvents(
      [
        {
          shotId: 9,
          date: '2026-05-01',
          frequencyValue: 30,
          frequencyUnit: 'DAY',
          horseIds: [1],
        },
      ],
      [{ id: 1, horseName: 'Csillag' }],
      '2026-05-01',
      '2026-06-30',
    );

    expect(result).toEqual([
      jasmine.objectContaining({
        horseId: 1,
        horseName: 'Csillag',
        eventType: 'SHOT_DUE',
        eventDate: '2026-05-31',
        relatedEntityId: 9,
      }),
    ]);
  });

  it('shows and removes tooltip handlers on mounted events', async () => {
    await createComponent();

    const el = document.createElement('div');
    spyOn(el, 'removeAttribute').and.callThrough();
    const showSpy = spyOn<any>(component, 'showTooltip');
    const hideSpy = spyOn<any>(component, 'hideTooltip');

    (component as any).onEventMount({
      el,
      event: {
        extendedProps: {
          dto: {
            eventType: 'CUSTOM',
            eventDate: '2026-06-01',
            horseName: 'Csillag',
            description: 'Teszt',
          },
        },
      },
    });

    el.dispatchEvent(new Event('mouseenter'));
    el.dispatchEvent(new Event('mouseleave'));

    expect(el.removeAttribute).toHaveBeenCalledWith('title');
    expect(showSpy).toHaveBeenCalled();
    expect(hideSpy).toHaveBeenCalled();
  });

  it('removes the tooltip element on destroy', async () => {
    await createComponent();

    const tooltip = document.createElement('div');
    const removeSpy = spyOn(tooltip, 'remove');
    (component as any).tooltipEl = tooltip;

    component.ngOnDestroy();

    expect(removeSpy).toHaveBeenCalled();
    expect((component as any).tooltipEl).toBeUndefined();
  });

  it('disables employee-only views when employee access loading fails', async () => {
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('EMPLOYEE') || roles.includes('ROLE_EMPLOYEE'),
    );
    settingsService.getEmployeeAccess.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.canViewShots).toBeFalse();
    expect(component.canViewTreatments).toBeFalse();
    expect(component.canViewFarrierApps).toBeFalse();
  });

  it('reloads after employee access is resolved for employees', async () => {
    authService.hasAnyRole.and.callFake((roles: string[]) =>
      roles.includes('EMPLOYEE') || roles.includes('ROLE_EMPLOYEE'),
    );

    await createComponent();

    expect(settingsService.getEmployeeAccess).toHaveBeenCalled();
    expect(component.canViewShots).toBeTrue();
    expect(component.canViewTreatments).toBeTrue();
    expect(component.canViewFarrierApps).toBeTrue();
  });

  it('adds due events when periodic shots are returned', async () => {
    calendarEventService.getAll.and.returnValue(of([]));
    shotService.getAll.and.returnValue(
      of([
        {
          shotId: 7,
          shotName: 'Tetanuasz',
          date: '2026-05-01',
          frequencyUnit: 'MONTHS',
          frequencyValue: 1,
          horseIds: [1],
        },
      ] as any),
    );

    await createComponent();

    (component as any).fetchAllEvents('2026-05-01', '2026-07-01');

    const titles = ((component.calendarOptions.events as any[]) || []).map((event) => event.title);
    expect(titles.some((title) => String(title).includes('Esedékes oltás'))).toBeTrue();
  });

  it('adds due treatment and farrier events when periodic records are returned', async () => {
    treatmentService.getAll.and.returnValue(
      of([
        {
          treatmentId: 9,
          treatmentName: 'Vizsgalat',
          date: '2026-05-01',
          frequencyUnit: 'MONTHS',
          frequencyValue: 1,
          horseIds: [1],
        },
      ] as any),
    );
    farrierAppService.getAll.and.returnValue(
      of([
        {
          farrierAppId: 10,
          farrierName: 'John',
          appointmentDate: '2026-05-01',
          frequencyUnit: 'MONTHS',
          frequencyValue: 1,
          horseIds: [1],
        },
      ] as any),
    );

    await createComponent();

    (component as any).fetchAllEvents('2026-05-01', '2026-07-01');

    const titles = ((component.calendarOptions.events as any[]) || []).map((event) => event.title);
    expect(titles.some((title) => String(title).includes('Esedékes kezelés'))).toBeTrue();
    expect(titles.some((title) => String(title).includes('Esedékes patkolás'))).toBeTrue();
  });

  it('continues loading calendar when shot fetch fails', async () => {
    calendarEventService.getAll.and.returnValue(
      of([{ id: 1, horseId: 1, horseName: 'Csillag', eventType: 'CUSTOM', eventDate: '2026-05-01' }] as any),
    );
    shotService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    (component as any).fetchAllEvents('2026-05-01', '2026-05-31');

    expect(component.loading).toBeFalse();
    expect(component.horses.length).toBe(1);
    expect((component.calendarOptions.events as any[]).length).toBe(1);
  });

  it('stops loading when calendar event fetch fails', async () => {
    calendarEventService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    (component as any).fetchAllEvents('2026-05-01', '2026-05-31');

    expect(component.loading).toBeFalse();
  });
});
