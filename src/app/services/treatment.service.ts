import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TreatmentDTO } from '../models/treatment.model';

@Injectable({
  providedIn: 'root'
})
export class TreatmentService {
  private apiUrl = 'http://localhost:8080/api/treatments';

  constructor(private http: HttpClient) {}

  getAll(): Observable<TreatmentDTO[]> {
    return this.http.get<TreatmentDTO[]>(this.apiUrl);
  }

  create(dto: TreatmentDTO): Observable<TreatmentDTO> {
    return this.http.post<TreatmentDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: TreatmentDTO): Observable<TreatmentDTO> {
    return this.http.patch<TreatmentDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
