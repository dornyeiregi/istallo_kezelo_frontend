import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseFarrierAppDTO } from '../models/horse-farrier-app.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root',
})
/**
 * Handles API calls that connect horses with farrier appointments.
 */
export class HorseFarrierAppService {
  private apiUrl = `${API_BASE_URL}/api/horseFarrierApps`;

  constructor(private http: HttpClient) {}

  /**
   * Loads all horse-farrier appointment links.
   */
  getAll(): Observable<HorseFarrierAppDTO[]> {
    return this.http.get<HorseFarrierAppDTO[]>(this.apiUrl);
  }

  /**
   * Loads a horse-farrier appointment link by identifier.
   */
  getById(id: number): Observable<HorseFarrierAppDTO> {
    return this.http.get<HorseFarrierAppDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Loads every farrier appointment assigned to the selected horse.
   */
  getAllOfHorseById(horseId: number): Observable<HorseFarrierAppDTO[]> {
    return this.http.get<HorseFarrierAppDTO[]>(`${this.apiUrl}/byHorseId/${horseId}`);
  }

  /**
   * Creates a link between a horse and a farrier appointment.
   */
  create(dto: HorseFarrierAppDTO): Observable<HorseFarrierAppDTO> {
    return this.http.post<HorseFarrierAppDTO>(this.apiUrl, dto);
  }
}
