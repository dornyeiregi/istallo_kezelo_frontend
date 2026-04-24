import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TreatmentDTO } from '../models/treatment.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root',
})
export class TreatmentService {
  private apiUrl = `${API_BASE_URL}/api/treatments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TreatmentDTO[]> {
    return this.http.get<TreatmentDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<TreatmentDTO> {
    return this.http.get<TreatmentDTO>(`${this.apiUrl}/${id}`);
  }

  getAllOfHorseById(horseId: number): Observable<TreatmentDTO[]> {
    return this.http.get<TreatmentDTO[]>(`${this.apiUrl}/horseId/${horseId}`);
  }

  create(dto: TreatmentDTO): Observable<TreatmentDTO> {
    return this.http.post<TreatmentDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: TreatmentDTO): Observable<string> {
    return this.http.patch(`${this.apiUrl}/${id}`, dto, {
      responseType: 'text',
    }) as Observable<string>;
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }) as Observable<string>;
  }
}
