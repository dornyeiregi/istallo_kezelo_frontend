import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CalendarEventService } from './calendar-event.service';
import { API_BASE_URL } from '../config';
import { CalendarEventDTO } from '../models/calendar-event.model';

const API_URL = `${API_BASE_URL}/api/calendar-events`;

describe('CalendarEventService', () => {
  let service: CalendarEventService;
  let httpMock: HttpTestingController;

  const event: CalendarEventDTO = {
    id: 1,
    horseId: 2,
    eventType: 'CUSTOM',
    eventDate: '2026-01-10',
    description: 'Checkup',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CalendarEventService],
    });

    service = TestBed.inject(CalendarEventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates calendar event', () => {
    service.create(event).subscribe((data) => {
      expect(data).toEqual(event);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(event);
    req.flush(event);
  });

  it('gets event by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(event);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(event);
  });

  it('gets all events with optional date params', () => {
    service.getAll('2026-01-01', '2026-01-31').subscribe((data) => {
      expect(data).toEqual([event]);
    });

    const req = httpMock.expectOne(
      (request) =>
        request.url === API_URL &&
        request.params.get('start') === '2026-01-01' &&
        request.params.get('end') === '2026-01-31',
    );
    expect(req.request.method).toBe('GET');
    req.flush([event]);
  });

  it('updates event with PATCH body', () => {
    service.update(1, event).subscribe((data) => {
      expect(data).toEqual(event);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(event);
    req.flush(event);
  });

  it('deletes event', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBeNull();
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
