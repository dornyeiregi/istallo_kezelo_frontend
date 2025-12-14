import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseFarrierAppDTO } from '../models/horse-farrier-app.model';

@Injectable({
  providedIn: 'root'
})
export class HorseFarrierAppService {
  private apiUrl = 'http://localhost:8080/api/horseFarrierApps';

  constructor(private http: HttpClient) {}

  getAll(): Observable<HorseFarrierAppDTO[]> {
    return this.http.get<HorseFarrierAppDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<HorseFarrierAppDTO> {
    return this.http.get<HorseFarrierAppDTO>(`${this.apiUrl}/${id}`);
  }

  getAllOfHorseById(horseId: number): Observable<HorseFarrierAppDTO[]> {
    return this.http.get<HorseFarrierAppDTO[]>(`${this.apiUrl}/horse/${horseId}`);
  }

  create(dto: HorseFarrierAppDTO): Observable<HorseFarrierAppDTO> {
    return this.http.post<HorseFarrierAppDTO>(this.apiUrl, dto);
  }
}
