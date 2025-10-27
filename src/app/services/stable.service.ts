import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StableDTO } from '../models/stable.model';

@Injectable({
  providedIn: 'root'
})
export class StableService {
  private apiUrl = 'http://localhost:8080/api/stables';

  constructor(private http: HttpClient) {}

  getAll(): Observable<StableDTO[]> {
    return this.http.get<StableDTO[]>(this.apiUrl);
  }

  create(dto: StableDTO): Observable<StableDTO> {
    return this.http.post<StableDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: StableDTO): Observable<StableDTO> {
    return this.http.patch<StableDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
