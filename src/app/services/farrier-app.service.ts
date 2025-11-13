import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FarrierAppDTO } from '../models/farrier-app.model';

@Injectable({
  providedIn: 'root'
})
export class FarrierAppService {
  private apiUrl = 'http://localhost:8080/api/farrierApps';

  constructor(private http: HttpClient) {}

  getAll(): Observable<FarrierAppDTO[]> {
    return this.http.get<FarrierAppDTO[]>(this.apiUrl);
  }

  create(dto: FarrierAppDTO): Observable<FarrierAppDTO> {
    return this.http.post<FarrierAppDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: FarrierAppDTO): Observable<FarrierAppDTO> {
    return this.http.patch<FarrierAppDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
