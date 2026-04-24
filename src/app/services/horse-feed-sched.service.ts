import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseFeedSchedDTO } from '../models/horse-feed-sched.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root',
})
/**
 * Handles API calls that connect horses with feeding schedules.
 */
export class HorseFeedSchedService {
  private apiUrl = `${API_BASE_URL}/api/horseFeedScheds`;

  constructor(private http: HttpClient) {}

  /**
   * Loads all horse-feeding schedule links.
   */
  getAll(): Observable<HorseFeedSchedDTO[]> {
    return this.http.get<HorseFeedSchedDTO[]>(this.apiUrl);
  }

  /**
   * Loads a horse-feeding schedule link by identifier.
   */
  getById(id: number): Observable<HorseFeedSchedDTO> {
    return this.http.get<HorseFeedSchedDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Loads every feeding schedule assigned to the selected horse.
   */
  getAllOfHorseById(horseId: number): Observable<HorseFeedSchedDTO[]> {
    return this.http.get<HorseFeedSchedDTO[]>(`${this.apiUrl}/horseId/${horseId}`);
  }

  /**
   * Creates a link between a horse and a feeding schedule.
   */
  create(dto: HorseFeedSchedDTO): Observable<HorseFeedSchedDTO> {
    return this.http.post<HorseFeedSchedDTO>(this.apiUrl, dto);
  }

  /**
   * Removes every feeding schedule link for the selected horse.
   */
  deleteAllForHorse(horseId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/horseId/${horseId}`, {
      responseType: 'text',
    }) as Observable<string>;
  }
}
