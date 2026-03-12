import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseDTO } from '../models/horse.model';

@Injectable({
  providedIn: 'root'
})
export class HorseService {
  private apiUrl = 'http://localhost:8080/api/horses';

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

  // getByName(horseName: string): Observable<HorseDTO> {
  //   return this.http.get<HorseDTO>(`${this.apiUrl}/byName/${encodeURIComponent(horseName)}`);
  // }


  create(dto: HorseDTO): Observable<HorseDTO> {
    return this.http.post<HorseDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: HorseDTO): Observable<HorseDTO> {
    return this.http.patch<HorseDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text'});
  }

  deactivate(id: number): Observable<HorseDTO> {
    return this.http.patch<HorseDTO>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  getRequests(): Observable<HorseDTO[]> {
    return this.http.get<HorseDTO[]>(`${this.apiUrl}/requests`);
  }

  getMyRequests(): Observable<HorseDTO[]> {
    return this.http.get<HorseDTO[]>(`${this.apiUrl}/requests/mine`);
  }

  approveRequest(id: number): Observable<HorseDTO> {
    return this.http.patch<HorseDTO>(`${this.apiUrl}/requests/${id}/approve`, {});
  }

  rejectRequest(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/requests/${id}`, { responseType: 'text' }) as Observable<string>;
  }
}
