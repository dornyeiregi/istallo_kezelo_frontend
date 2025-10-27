import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseTreatmentDTO } from '../models/horse-treatment.model';

@Injectable({
  providedIn: 'root'
})
export class HorseTreatmentService {
  private apiUrl = 'http://localhost:8080/api/horseTreatments';

  constructor(private http: HttpClient) {}

  getAll(): Observable<HorseTreatmentDTO[]> {
    return this.http.get<HorseTreatmentDTO[]>(this.apiUrl);
  }

  create(dto: HorseTreatmentDTO): Observable<HorseTreatmentDTO> {
    return this.http.post<HorseTreatmentDTO>(this.apiUrl, dto);
  }
}
