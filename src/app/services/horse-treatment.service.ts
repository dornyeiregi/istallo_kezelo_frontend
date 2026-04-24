import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseTreatmentDTO } from '../models/horse-treatment.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root',
})
/**
 * Handles API calls that connect horses with treatment records.
 */
export class HorseTreatmentService {
  private apiUrl = `${API_BASE_URL}/api/horseTreatments`;

  constructor(private http: HttpClient) {}

  /**
   * Loads all horse-treatment links.
   */
  getAll(): Observable<HorseTreatmentDTO[]> {
    return this.http.get<HorseTreatmentDTO[]>(this.apiUrl);
  }

  /**
   * Creates a link between a horse and a treatment.
   */
  create(dto: HorseTreatmentDTO): Observable<HorseTreatmentDTO> {
    return this.http.post<HorseTreatmentDTO>(this.apiUrl, dto);
  }
}
