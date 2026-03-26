import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StableDTO } from '../models/stable.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class StableService {
  private apiUrl = `${API_BASE_URL}/api/stables`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<StableDTO[]> {
    return this.http.get<StableDTO[]>(this.apiUrl);
  }

  create(dto: StableDTO): Observable<StableDTO> {
    return this.http.post<StableDTO>(this.apiUrl, dto);
  }

  update(stableId: number, dto: Partial<StableDTO>): Observable<StableDTO> {
    return this.http.patch<StableDTO>(`${this.apiUrl}/${stableId}`, dto);
  }

  // updateByName(stableName: string, dto: Partial<StableDTO>): Observable<StableDTO> {
  //   return this.http.patch<StableDTO>(`${this.apiUrl}/byName/${stableName}`, dto);
  // }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

}
