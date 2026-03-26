import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FarrierAppDTO } from '../models/farrier-app.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class FarrierAppService {
  private apiUrl = `${API_BASE_URL}/api/farrierApps`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<FarrierAppDTO[]> {
    return this.http.get<FarrierAppDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<FarrierAppDTO> {
    return this.http.get<FarrierAppDTO>(`${this.apiUrl}/${id}`);
  }

  getAllOfHorseById(horseId: number): Observable<FarrierAppDTO[]> {
    return this.http.get<FarrierAppDTO[]>(`${this.apiUrl}/horseId/${horseId}`);
  }

  create(dto: FarrierAppDTO): Observable<FarrierAppDTO> {
    return this.http.post<FarrierAppDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: FarrierAppDTO): Observable<string> {
    return this.http.patch(
      `${this.apiUrl}/${id}`,
      dto,
      { responseType: 'text' }
    ) as Observable<string>;
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }) as Observable<string>;
  }
}
