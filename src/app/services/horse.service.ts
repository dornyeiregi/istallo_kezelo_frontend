import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseDTO } from '../models/horse.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root',
})
export class HorseService {
  private apiUrl = `${API_BASE_URL}/api/horses`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<HorseDTO[]> {
    return this.http.get<HorseDTO[]>(`${this.apiUrl}/all`);
  }

  getMine(): Observable<HorseDTO[]> {
    return this.http.get<HorseDTO[]>(`${this.apiUrl}/mine`);
  }

  getInactive(): Observable<HorseDTO[]> {
    return this.http.get<HorseDTO[]>(`${this.apiUrl}/inactive`);
  }

  getById(id: number): Observable<HorseDTO> {
    return this.http.get<HorseDTO>(`${this.apiUrl}/${id}`);
  }

  getByName(horseName: string): Observable<HorseDTO> {
    return this.http.get<HorseDTO>(`${this.apiUrl}/byName/${encodeURIComponent(horseName)}`);
  }

  create(dto: HorseDTO): Observable<HorseDTO> {
    return this.http.post<HorseDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: HorseDTO): Observable<HorseDTO> {
    return this.http.patch<HorseDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  deactivate(id: number): Observable<HorseDTO> {
    return this.http.patch<HorseDTO>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activate(id: number): Observable<HorseDTO> {
    return this.http.patch<HorseDTO>(`${this.apiUrl}/${id}/activate`, {});
  }

  getRequests(): Observable<HorseDTO[]> {
    return this.http.get<HorseDTO[]>(`${this.apiUrl}/requests`);
  }

  getMyRequests(): Observable<HorseDTO[]> {
    return this.http.get<HorseDTO[]>(`${this.apiUrl}/requests/mine`);
  }

  approveRequest(
    id: number,
    payload: { stableId: number; feedSchedId?: number | null },
  ): Observable<HorseDTO> {
    return this.http.patch<HorseDTO>(`${this.apiUrl}/requests/${id}/approve`, payload);
  }

  rejectRequest(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/requests/${id}`, {
      responseType: 'text',
    }) as Observable<string>;
  }
}
