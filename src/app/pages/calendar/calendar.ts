import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalendarOptions,
  EventClickArg,
  EventInput,
  DatesSetArg,
  EventMountArg
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import huLocale from '@fullcalendar/core/locales/hu';
import { FullCalendarModule } from '@fullcalendar/angular';
import { Router } from '@angular/router';
import { CalendarEventDTO } from '../../models/calendar-event.model';
import { CalendarEventService } from '../../services/calendar-event.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css']
})
export class CalendarPage implements OnInit {
  loading = false;

  private viewStart: string | null = null;
  private viewEnd: string | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    height: 'auto',
    events: [],
    locale: huLocale,
    datesSet: (arg) => this.onDatesSet(arg),
    eventClick: (arg) => this.onEventClick(arg),
    eventDidMount: (arg) => this.onEventMount(arg)
  };

  constructor(
    private calendarEventService: CalendarEventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  reload(): void {
    this.fetchAllEvents(this.viewStart, this.viewEnd);
  }

  private onDatesSet(arg: DatesSetArg): void {
    this.viewStart = this.toIsoDate(arg.start);
    this.viewEnd = this.toIsoDate(arg.end);
    this.reload();
  }

  private fetchAllEvents(start?: string | null, end?: string | null): void {
    this.loading = true;

    this.calendarEventService.getAll(start || undefined, end || undefined).subscribe({
      next: (events) => {
        this.setCalendarEvents(events);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private setCalendarEvents(events: CalendarEventDTO[]): void {
    const mappedEvents: EventInput[] = events.map((event) => ({
      id: event.id ? String(event.id) : undefined,
      title: this.getEventTitle(event),
      start: event.eventDate,
      allDay: true,
      color: this.getEventColor(event.eventType),
      extendedProps: { dto: event }
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events: mappedEvents
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
      case 'TREATMENT':
        this.router.navigate(['/treatments', dto.relatedEntityId]);
        break;
      case 'FARRIER_APP':
      case 'FARRIERAPP':
      case 'FARRIER':
        this.router.navigate(['/farrier-apps', dto.relatedEntityId]);
        break;
      default:
        break;
    }
  }

  private onEventMount(arg: EventMountArg): void {
    const dto = arg.event.extendedProps?.['dto'] as CalendarEventDTO | undefined;
    if (!dto) return;

    arg.el.removeAttribute('title');
    arg.el.setAttribute('data-tooltip', this.getTooltipText(dto));
  }

  private getTooltipText(event: CalendarEventDTO): string {
    const typeLabel = this.getEventTypeLabel(event.eventType);
    const horseLabel = event.horseName ? `Ló: ${event.horseName}` : '';
    const dateLabel = event.eventDate ? `Dátum: ${event.eventDate}` : '';
    return [typeLabel, horseLabel, dateLabel].filter(Boolean).join(' | ');
  }

  private getEventTitle(event: CalendarEventDTO): string {
    const typeLabel = this.getEventTypeLabel(event.eventType);
    const horseLabel = event.horseName ? ` - ${event.horseName}` : '';
    return `${typeLabel}${horseLabel}`;
  }

  private getEventTypeLabel(eventType: string): string {
    switch (this.normalizeEventType(eventType)) {
      case 'SHOT':
        return 'Oltás';
      case 'TREATMENT':
        return 'Kezelés';
      case 'FARRIER_APP':
      case 'FARRIERAPP':
      case 'FARRIER':
        return 'Patkolás';
      default:
        return eventType;
    }
  }

  private getEventColor(eventType: string): string {
    switch (this.normalizeEventType(eventType)) {
      case 'SHOT':
        return '#e05d74';
      case 'TREATMENT':
        return '#2e7d32';
      case 'FARRIER_APP':
      case 'FARRIERAPP':
      case 'FARRIER':
        return '#1976d2';
      default:
        return '#607d8b';
    }
  }

  private normalizeEventType(eventType: string): string {
    return (eventType || '').toUpperCase().replace(/[^A-Z]/g, '_');
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
