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

  getById(id: number): Observable<HorseDTO> {
    return this.http.get<HorseDTO>(`${this.apiUrl}/${id}`);
  }

  create(dto: HorseDTO): Observable<HorseDTO> {
    return this.http.post<HorseDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: HorseDTO): Observable<HorseDTO> {
    return this.http.patch<HorseDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
