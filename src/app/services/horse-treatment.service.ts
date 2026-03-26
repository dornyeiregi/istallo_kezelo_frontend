import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseTreatmentDTO } from '../models/horse-treatment.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class HorseTreatmentService {
  private apiUrl = `${API_BASE_URL}/api/horseTreatments`;

  constructor(private http: HttpClient) {}

  // Összes link lekérdezése
  getAll(): Observable<HorseTreatmentDTO[]> {
    return this.http.get<HorseTreatmentDTO[]>(this.apiUrl);
  }

  // Ló hozzáadása kezeléshez
  create(dto: HorseTreatmentDTO): Observable<HorseTreatmentDTO> {
    return this.http.post<HorseTreatmentDTO>(this.apiUrl, dto);
  }
}
