import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CalendarOptions,
  EventClickArg,
  EventInput,
  DatesSetArg,
  EventMountArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import huLocale from '@fullcalendar/core/locales/hu';
import { FullCalendarModule } from '@fullcalendar/angular';
import { Router } from '@angular/router';
import { CalendarEventDTO } from '../../models/calendar-event.model';
import { CalendarEventService } from '../../services/calendar-event.service';
import { AuthService } from '../../services/auth.service';
import { ShotService } from '../../services/shot.service';
import { HorseService } from '../../services/horse.service';
import { ShotDTO } from '../../models/shot.model';
import { HorseDTO } from '../../models/horse.model';
import { TreatmentService } from '../../services/treatment.service';
import { FarrierAppService } from '../../services/farrier-app.service';
import { TreatmentDTO } from '../../models/treatment.model';
import { FarrierAppDTO } from '../../models/farrier-app.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SettingsService } from '../../services/settings.service';
import { EmployeeAccessSettingsDTO } from '../../models/employee-access-settings.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css'],
})
export class CalendarPage implements OnInit, OnDestroy {
  loading = false;
  showAddMenu = false;
  selectedEventType = 'all';
  selectedHorseId = 'all';
  horses: HorseDTO[] = [];
  private allEvents: CalendarEventDTO[] = [];
  employeeAccess: EmployeeAccessSettingsDTO = {
    viewShots: false,
    viewTreatments: false,
    viewFarrierApps: false,
  };
  canViewShots = true;
  canViewTreatments = true;
  canViewFarrierApps = true;
  private shotById = new Map<number, ShotDTO>();
  private treatmentById = new Map<number, TreatmentDTO>();
  private farrierById = new Map<number, FarrierAppDTO>();
  private tooltipEl?: HTMLDivElement;
  readonly eventTypeLabels: Record<string, string> = {
    SHOT: 'Oltás',
    TREATMENT: 'Kezelés',
    FARRIER_APP: 'Patkolás',
    CUSTOM: 'Egyéb',
  };

  private viewStart: string | null = null;
  private viewEnd: string | null = null;
  showCustomPopup = false;
  customDate = '';
  customDescription = '';
  customHorseIds: Set<number> = new Set();
  customError = '';

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    height: 'auto',
    dayMaxEvents: 3,
    events: [],
    locale: huLocale,
    datesSet: (arg) => this.onDatesSet(arg),
    eventClick: (arg) => this.onEventClick(arg),
    eventDidMount: (arg) => this.onEventMount(arg),
  };

  constructor(
    private calendarEventService: CalendarEventService,
    private router: Router,
    private authService: AuthService,
    private shotService: ShotService,
    private horseService: HorseService,
    private treatmentService: TreatmentService,
    private farrierAppService: FarrierAppService,
    private settingsService: SettingsService,
  ) {}

  ngOnInit(): void {
    this.resolveEmployeeAccess();
    this.reload();
  }

  ngOnDestroy(): void {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = undefined;
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  get canCreateAppointments(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'OWNER', 'ROLE_ADMIN', 'ROLE_OWNER']);
  }

  get availableEventTypes(): string[] {
    const types = ['all'];
    if (this.canViewShots) {
      types.push('SHOT');
    }
    if (this.canViewTreatments) {
      types.push('TREATMENT');
    }
    if (this.canViewFarrierApps) {
      types.push('FARRIER_APP');
    }
    types.push('CUSTOM');
    return types;
  }

  toggleAddMenu(): void {
    this.showAddMenu = !this.showAddMenu;
  }

  createAppointment(type: 'shot' | 'treatment' | 'farrier'): void {
    this.showAddMenu = false;
    switch (type) {
      case 'shot':
        this.router.navigate(['/shots/new']);
        break;
      case 'treatment':
        this.router.navigate(['/treatments/new']);
        break;
      case 'farrier':
        this.router.navigate(['/farrier-apps/new']);
        break;
      default:
        break;
    }
  }

  openCustomEvent(): void {
    this.showAddMenu = false;
    this.customError = '';
    this.customDate = '';
    this.customDescription = '';
    this.customHorseIds.clear();
    this.showCustomPopup = true;
  }

  toggleCustomHorse(horseId: number): void {
    if (this.customHorseIds.has(horseId)) {
      this.customHorseIds.delete(horseId);
    } else {
      this.customHorseIds.add(horseId);
    }
  }

  submitCustomEvent(): void {
    this.customError = '';
    if (!this.customDate) {
      this.customError = 'Add meg a dátumot.';
      return;
    }
    if (!this.customDescription.trim()) {
      this.customError = 'Add meg a leírást.';
      return;
    }
    if (this.customHorseIds.size === 0) {
      this.customError = 'Válassz legalább egy lovat.';
      return;
    }

    const requests = Array.from(this.customHorseIds).map((horseId) =>
      this.calendarEventService.create({
        horseId,
        eventType: 'CUSTOM',
        eventDate: this.customDate,
        description: this.customDescription.trim(),
      }),
    );

    this.loading = true;
    forkJoin(requests).subscribe({
      next: () => {
        this.showCustomPopup = false;
        this.reload();
      },
      error: () => {
        this.loading = false;
        this.customError = 'Nem sikerült létrehozni az eseményt.';
      },
    });
  }

  reload(): void {
    this.fetchAllEvents(this.viewStart, this.viewEnd);
  }

  private onDatesSet(arg: DatesSetArg): void {
    this.viewStart = this.toCalendarDateString(arg.start);
    this.viewEnd = this.toCalendarDateString(arg.end);
    this.reload();
  }

  private fetchAllEvents(start?: string | null, end?: string | null): void {
    this.loading = true;

    const shots$ = this.canViewShots
      ? this.shotService.getAll().pipe(catchError(() => of([])))
      : of([]);
    const treatments$ = this.canViewTreatments
      ? this.treatmentService.getAll().pipe(catchError(() => of([])))
      : of([]);
    const farrierApps$ = this.canViewFarrierApps
      ? this.farrierAppService.getAll().pipe(catchError(() => of([])))
      : of([]);

    forkJoin({
      events: this.calendarEventService.getAll(start || undefined, end || undefined),
      shots: shots$,
      treatments: treatments$,
      farrierApps: farrierApps$,
      horses: this.horseService.getAll(),
    }).subscribe({
      next: ({ events, shots, treatments, farrierApps, horses }) => {
        const dueEvents = this.buildDueShotEvents(shots, horses, start, end);
        const dueTreatments = this.buildDueTreatmentEvents(treatments, horses, start, end);
        const dueFarrier = this.buildDueFarrierEvents(farrierApps, horses, start, end);
        this.horses = horses;
        this.shotById = new Map(shots.filter((s) => s.shotId != null).map((s) => [s.shotId!, s]));
        this.treatmentById = new Map(
          treatments.filter((t) => t.treatmentId != null).map((t) => [t.treatmentId!, t]),
        );
        this.farrierById = new Map(
          farrierApps.filter((f) => f.farrierAppId != null).map((f) => [f.farrierAppId!, f]),
        );
        this.allEvents = [...events, ...dueEvents, ...dueTreatments, ...dueFarrier];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private setCalendarEvents(events: CalendarEventDTO[]): void {
    const mappedEvents: EventInput[] = events.map((event) => ({
      id: event.id ? String(event.id) : undefined,
      title: this.getEventTitle(event),
      start: event.eventDate,
      allDay: true,
      color: this.getEventColor(event.eventType),
      extendedProps: { dto: event },
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events: mappedEvents,
    };
  }

  private onEventClick(arg: EventClickArg): void {
    const dto = arg.event.extendedProps?.['dto'] as CalendarEventDTO | undefined;
    if (!dto?.relatedEntityId) {
      return;
    }

    switch (this.normalizeEventType(dto.eventType)) {
      case 'SHOT':
        this.router.navigate(['/shots', dto.relatedEntityId]);
        break;
      case 'SHOT_DUE':
        this.router.navigate(['/shots', dto.relatedEntityId], {
          queryParams: { dueDate: dto.eventDate },
        });
        break;
      case 'TREATMENT':
        this.router.navigate(['/treatments', dto.relatedEntityId]);
        break;
      case 'TREATMENT_DUE':
        this.router.navigate(['/treatments', dto.relatedEntityId], {
          queryParams: { dueDate: dto.eventDate },
        });
        break;
      case 'FARRIER_APP':
      case 'FARRIERAPP':
      case 'FARRIER':
        this.router.navigate(['/farrier-apps', dto.relatedEntityId]);
        break;
      case 'FARRIER_APP_DUE':
      case 'FARRIERAPP_DUE':
        this.router.navigate(['/farrier-apps', dto.relatedEntityId], {
          queryParams: { dueDate: dto.eventDate },
        });
        break;
      default:
        break;
    }
  }

  private onEventMount(arg: EventMountArg): void {
    const dto = arg.event.extendedProps?.['dto'] as CalendarEventDTO | undefined;
    if (!dto) return;

    const tooltipText = this.getTooltipText(dto);
    arg.el.removeAttribute('title');
    arg.el.removeAttribute('data-tooltip');
    arg.el.addEventListener('mouseenter', () => this.showTooltip(arg.el, tooltipText));
    arg.el.addEventListener('mouseleave', () => this.hideTooltip());
  }

  private getTooltipText(event: CalendarEventDTO): string {
    const horseLabel = event.horseName ? `Ló: ${event.horseName}` : '';
    const dateLabel = event.eventDate ? `Dátum: ${event.eventDate}` : '';
    const details = this.getEventDetails(event);
    return [horseLabel, dateLabel, ...details].filter(Boolean).join(' | ');
  }

  private getEventDetails(event: CalendarEventDTO): string[] {
    const details: string[] = [];
    const type = this.normalizeEventType(event.eventType);
    const relatedId = event.relatedEntityId;

    if ((type === 'SHOT' || type === 'SHOT_DUE') && relatedId != null) {
      const shot = this.shotById.get(relatedId);
      if (shot?.shotName) details.push(`Oltás: ${shot.shotName}`);
    }

    if ((type === 'TREATMENT' || type === 'TREATMENT_DUE') && relatedId != null) {
      const treatment = this.treatmentById.get(relatedId);
      if (treatment?.treatmentName) details.push(`Kezelés: ${treatment.treatmentName}`);
    }

    if (
      (type === 'FARRIER_APP' ||
        type === 'FARRIERAPP' ||
        type === 'FARRIER' ||
        type === 'FARRIER_APP_DUE' ||
        type === 'FARRIERAPP_DUE') &&
      relatedId != null
    ) {
      const app = this.farrierById.get(relatedId);
      if (app?.farrierName) details.push(`Patkoló: ${app.farrierName}`);
      const shoeLabel = this.getFarrierShoeLabel(app, event.horseId);
      if (shoeLabel) details.push(`Patkók: ${shoeLabel}`);
    }

    if (type === 'CUSTOM' && event.description) {
      details.push(`Leírás: ${event.description}`);
    }

    return details;
  }

  private getFarrierShoeLabel(app: FarrierAppDTO | undefined, horseId: number): string | null {
    if (!app?.horseDetails || !horseId) return null;
    const detail = app.horseDetails.find((h) => h.horseId === horseId);
    if (!detail) return null;
    switch (detail.shoeCount) {
      case 4:
        return '4';
      case 2:
        return '2';
      case 0:
        return 'Nincs';
      default:
        return String(detail.shoeCount ?? '');
    }
  }

  private showTooltip(target: HTMLElement, text: string): void {
    if (!text) return;
    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'fc-tooltip';
      this.tooltipEl.style.position = 'fixed';
      this.tooltipEl.style.background = 'var(--app-surface)';
      this.tooltipEl.style.color = 'var(--app-text)';
      this.tooltipEl.style.fontSize = '0.75rem';
      this.tooltipEl.style.lineHeight = '1.3';
      this.tooltipEl.style.padding = '0.45rem 0.6rem';
      this.tooltipEl.style.borderRadius = '8px';
      this.tooltipEl.style.whiteSpace = 'nowrap';
      this.tooltipEl.style.border = '1px solid var(--app-border)';
      this.tooltipEl.style.boxShadow = '0 10px 18px rgba(0, 0, 0, 0.12)';
      this.tooltipEl.style.pointerEvents = 'none';
      this.tooltipEl.style.zIndex = '9999';
      document.body.appendChild(this.tooltipEl);
    }

    this.tooltipEl.textContent = text;
    this.tooltipEl.style.opacity = '0';
    this.tooltipEl.style.display = 'block';

    const rect = target.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 8;

    let top = rect.top - tooltipRect.height - gap;
    const placeAbove = top >= viewportPadding;
    if (!placeAbove) {
      top = rect.bottom + gap;
    }

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    const maxLeft = window.innerWidth - tooltipRect.width - viewportPadding;
    left = Math.min(Math.max(left, viewportPadding), maxLeft);

    this.tooltipEl.style.top = `${Math.round(top)}px`;
    this.tooltipEl.style.left = `${Math.round(left)}px`;
    this.tooltipEl.style.opacity = '1';
  }

  private hideTooltip(): void {
    if (!this.tooltipEl) return;
    this.tooltipEl.style.opacity = '0';
    this.tooltipEl.style.display = 'none';
  }

  private getEventTitle(event: CalendarEventDTO): string {
    const typeLabel = this.getEventTypeLabel(event.eventType);
    const horseLabel = event.horseName ? ` - ${event.horseName}` : '';
    if (this.normalizeEventType(event.eventType) === 'CUSTOM') {
      const desc = event.description ? `: ${event.description}` : '';
      return `${typeLabel}${desc}${horseLabel}`;
    }
    return `${typeLabel}${horseLabel}`;
  }

  private getEventTypeLabel(eventType: string): string {
    switch (this.normalizeEventType(eventType)) {
      case 'SHOT':
        return 'Oltás';
      case 'SHOT_DUE':
        return 'Esedékes oltás';
      case 'TREATMENT':
        return 'Kezelés';
      case 'TREATMENT_DUE':
        return 'Esedékes kezelés';
      case 'FARRIER_APP':
      case 'FARRIERAPP':
      case 'FARRIER':
        return 'Patkolás';
      case 'FARRIER_APP_DUE':
      case 'FARRIERAPP_DUE':
        return 'Esedékes patkolás';
      case 'CUSTOM':
        return 'Egyéb esemény';
      default:
        return eventType;
    }
  }

  private getEventColor(eventType: string): string {
    switch (this.normalizeEventType(eventType)) {
      case 'SHOT':
        return '#e05d74';
      case 'SHOT_DUE':
        return '#ff8f00';
      case 'TREATMENT':
        return '#2e7d32';
      case 'TREATMENT_DUE':
        return '#5a9a3c';
      case 'FARRIER_APP':
      case 'FARRIERAPP':
      case 'FARRIER':
        return '#1976d2';
      case 'FARRIER_APP_DUE':
      case 'FARRIERAPP_DUE':
        return '#42a5f5';
      case 'CUSTOM':
        return '#6d4c41';
      default:
        return '#607d8b';
    }
  }

  private normalizeEventType(eventType: string): string {
    return (eventType || '').toUpperCase().replace(/[^A-Z]/g, '_');
  }

  private toCalendarDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseCalendarDate(value: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private resolveEmployeeAccess(): void {
    if (!this.authService.hasAnyRole(['EMPLOYEE', 'ROLE_EMPLOYEE'])) {
      this.canViewShots = true;
      this.canViewTreatments = true;
      this.canViewFarrierApps = true;
      return;
    }
    this.settingsService.getEmployeeAccess().subscribe({
      next: (settings) => {
        this.employeeAccess = settings;
        this.canViewShots = !!settings.viewShots;
        this.canViewTreatments = !!settings.viewTreatments;
        this.canViewFarrierApps = !!settings.viewFarrierApps;
        this.ensureValidSelectedEventType();
        this.reload();
      },
      error: () => {
        this.canViewShots = false;
        this.canViewTreatments = false;
        this.canViewFarrierApps = false;
        this.ensureValidSelectedEventType();
        this.reload();
      },
    });
  }

  private applyFilters(): void {
    const typeFilter = this.selectedEventType;
    const horseFilter = this.selectedHorseId;
    const filtered = this.allEvents.filter((event) => {
      if (!this.canViewEventType(event.eventType)) {
        return false;
      }

      if (typeFilter !== 'all') {
        const normalized = this.normalizeEventType(event.eventType);
        if (typeFilter === 'SHOT') {
          if (normalized !== 'SHOT' && normalized !== 'SHOT_DUE') return false;
        } else if (typeFilter === 'TREATMENT') {
          if (normalized !== 'TREATMENT' && normalized !== 'TREATMENT_DUE') return false;
        } else if (typeFilter === 'FARRIER_APP') {
          if (
            normalized !== 'FARRIER_APP' &&
            normalized !== 'FARRIERAPP' &&
            normalized !== 'FARRIER_APP_DUE' &&
            normalized !== 'FARRIERAPP_DUE'
          )
            return false;
        } else if (normalized !== typeFilter) {
          return false;
        }
      }
      if (horseFilter !== 'all') {
        const horseId = Number(horseFilter);
        if (Number.isNaN(horseId) || event.horseId !== horseId) return false;
      }
      return true;
    });
    this.setCalendarEvents(filtered);
  }

  private ensureValidSelectedEventType(): void {
    if (!this.availableEventTypes.includes(this.selectedEventType)) {
      this.selectedEventType = 'all';
    }
  }

  private canViewEventType(eventType: string): boolean {
    const normalized = this.normalizeEventType(eventType);

    if (normalized === 'SHOT' || normalized === 'SHOT_DUE') {
      return this.canViewShots;
    }

    if (normalized === 'TREATMENT' || normalized === 'TREATMENT_DUE') {
      return this.canViewTreatments;
    }

    if (
      normalized === 'FARRIER_APP' ||
      normalized === 'FARRIERAPP' ||
      normalized === 'FARRIER' ||
      normalized === 'FARRIER_APP_DUE' ||
      normalized === 'FARRIERAPP_DUE'
    ) {
      return this.canViewFarrierApps;
    }

    return true;
  }

  private buildDueShotEvents(
    shots: ShotDTO[],
    horses: HorseDTO[],
    start?: string | null,
    end?: string | null,
  ): CalendarEventDTO[] {
    const horseNameById = new Map<number, string>();
    horses.forEach((h) => {
      if (h.id != null) horseNameById.set(h.id, h.horseName);
    });

    const result: CalendarEventDTO[] = [];
    shots.forEach((shot) => {
      if (!shot.shotId || !shot.date) return;
      if (!shot.frequencyValue || !shot.frequencyUnit) return;
      if (!shot.horseIds || shot.horseIds.length === 0) return;

      const baseDate = this.parseCalendarDate(shot.date);
      if (Number.isNaN(baseDate.getTime())) return;

      const nextDate = this.addFrequency(baseDate, shot.frequencyValue, shot.frequencyUnit);
      if (!nextDate) return;

      const nextIso = this.toCalendarDateString(nextDate);
      if (start && nextIso < start) return;
      if (end && nextIso >= end) return;

      shot.horseIds.forEach((horseId) => {
        result.push({
          horseId,
          horseName: horseNameById.get(horseId),
          eventType: 'SHOT_DUE',
          eventDate: nextIso,
          relatedEntityId: shot.shotId,
        });
      });
    });

    return result;
  }

  private buildDueTreatmentEvents(
    treatments: TreatmentDTO[],
    horses: HorseDTO[],
    start?: string | null,
    end?: string | null,
  ): CalendarEventDTO[] {
    const horseNameById = new Map<number, string>();
    horses.forEach((h) => {
      if (h.id != null) horseNameById.set(h.id, h.horseName);
    });

    const result: CalendarEventDTO[] = [];
    treatments.forEach((treatment) => {
      if (!treatment.treatmentId || !treatment.date) return;
      if (!treatment.frequencyValue || !treatment.frequencyUnit) return;
      if (!treatment.horseIds || treatment.horseIds.length === 0) return;

      const baseDate = this.parseCalendarDate(treatment.date);
      if (Number.isNaN(baseDate.getTime())) return;

      const nextDate = this.addFrequency(
        baseDate,
        treatment.frequencyValue,
        treatment.frequencyUnit,
      );
      if (!nextDate) return;

      const nextIso = this.toCalendarDateString(nextDate);
      if (start && nextIso < start) return;
      if (end && nextIso >= end) return;

      treatment.horseIds.forEach((horseId) => {
        result.push({
          horseId,
          horseName: horseNameById.get(horseId),
          eventType: 'TREATMENT_DUE',
          eventDate: nextIso,
          relatedEntityId: treatment.treatmentId,
        });
      });
    });

    return result;
  }

  private buildDueFarrierEvents(
    farrierApps: FarrierAppDTO[],
    horses: HorseDTO[],
    start?: string | null,
    end?: string | null,
  ): CalendarEventDTO[] {
    const horseNameById = new Map<number, string>();
    horses.forEach((h) => {
      if (h.id != null) horseNameById.set(h.id, h.horseName);
    });

    const result: CalendarEventDTO[] = [];
    farrierApps.forEach((app) => {
      if (!app.farrierAppId || !app.appointmentDate) return;
      if (!app.frequencyValue || !app.frequencyUnit) return;
      if (!app.horseIds || app.horseIds.length === 0) return;

      const baseDate = this.parseCalendarDate(app.appointmentDate);
      if (Number.isNaN(baseDate.getTime())) return;

      const nextDate = this.addFrequency(baseDate, app.frequencyValue, app.frequencyUnit);
      if (!nextDate) return;

      const nextIso = this.toCalendarDateString(nextDate);
      if (start && nextIso < start) return;
      if (end && nextIso >= end) return;

      app.horseIds.forEach((horseId) => {
        result.push({
          horseId,
          horseName: horseNameById.get(horseId),
          eventType: 'FARRIER_APP_DUE',
          eventDate: nextIso,
          relatedEntityId: app.farrierAppId,
        });
      });
    });

    return result;
  }

  private addFrequency(base: Date, value: number, unit: string): Date | null {
    if (!Number.isFinite(value) || value <= 0) return null;
    const normalized = this.normalizeFrequencyUnit(unit);
    const next = new Date(base.getTime());

    switch (normalized) {
      case 'DAY':
      case 'DAYS':
      case 'NAP':
        next.setDate(next.getDate() + value);
        return next;
      case 'WEEK':
      case 'WEEKS':
      case 'HET':
        next.setDate(next.getDate() + value * 7);
        return next;
      case 'MONTH':
      case 'MONTHS':
      case 'HONAP':
        next.setMonth(next.getMonth() + value);
        return next;
      case 'YEAR':
      case 'YEARS':
      case 'EV':
        next.setFullYear(next.getFullYear() + value);
        return next;
      default:
        return null;
    }
  }

  private normalizeFrequencyUnit(unit: string): string {
    const upper = (unit || '').toUpperCase();
    const normalized = upper.replace(/[ÁÉÍÓÖŐÚÜŰ]/g, (ch) => {
      switch (ch) {
        case 'Á':
          return 'A';
        case 'É':
          return 'E';
        case 'Í':
          return 'I';
        case 'Ó':
        case 'Ö':
        case 'Ő':
          return 'O';
        case 'Ú':
        case 'Ü':
        case 'Ű':
          return 'U';
        default:
          return ch;
      }
    });
    return normalized.replace(/[^A-Z]/g, '');
  }
}
