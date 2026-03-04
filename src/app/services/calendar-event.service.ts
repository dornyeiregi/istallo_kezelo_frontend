import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalendarEventDTO } from '../models/calendar-event.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarEventService {
  private apiUrl = 'http://localhost:8080/api/calendar-events';

  constructor(private http: HttpClient) {}

  create(dto: CalendarEventDTO): Observable<CalendarEventDTO> {
    return this.http.post<CalendarEventDTO>(this.apiUrl, dto);
  }

  getById(eventId: number): Observable<CalendarEventDTO> {
    return this.http.get<CalendarEventDTO>(`${this.apiUrl}/${eventId}`);
  }

  getAll(start?: string, end?: string): Observable<CalendarEventDTO[]> {
    let params = new HttpParams();
    if (start) {
      params = params.set('start', start);
    }
    if (end) {
      params = params.set('end', end);
    }

    return this.http.get<CalendarEventDTO[]>(this.apiUrl, { params });
  }

  update(eventId: number, dto: CalendarEventDTO): Observable<CalendarEventDTO> {
    return this.http.patch<CalendarEventDTO>(`${this.apiUrl}/${eventId}`, dto);
  }

  delete(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${eventId}`);
  }
}
