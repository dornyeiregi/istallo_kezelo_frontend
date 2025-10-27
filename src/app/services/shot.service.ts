import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShotDTO } from '../models/shot.model';

@Injectable({
  providedIn: 'root'
})
export class ShotService {
  private apiUrl = 'http://localhost:8080/api/shots';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ShotDTO[]> {
    return this.http.get<ShotDTO[]>(this.apiUrl);
  }

  create(dto: ShotDTO): Observable<ShotDTO> {
    return this.http.post<ShotDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: ShotDTO): Observable<ShotDTO> {
    return this.http.patch<ShotDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
