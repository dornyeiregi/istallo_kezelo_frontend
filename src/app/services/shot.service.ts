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

  getAllOfHorseById(horseId: number): Observable<ShotDTO[]> {
    return this.http.get<ShotDTO[]>(`${this.apiUrl}/horseId/${horseId}`);
  }

  getById(id: number): Observable<ShotDTO> {
    return this.http.get<ShotDTO>(`${this.apiUrl}/${id}`);
  }

  create(dto: ShotDTO): Observable<ShotDTO> {
    return this.http.post<ShotDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: ShotDTO): Observable<string> {
    return this.http.patch(`${this.apiUrl}/${id}`, dto, { responseType: 'text' }) as Observable<string>;
  }

  addHorseToShot(shotId: number, horseId: number): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/${shotId}/addHorse/${horseId}`,
      {},
      { responseType: 'text' }
    ) as Observable<string>;
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }) as Observable<string>;
  }

}
