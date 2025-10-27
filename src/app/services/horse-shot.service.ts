import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseShotDTO } from '../models/horse-shot.model';

@Injectable({
  providedIn: 'root'
})
export class HorseShotService {
  private apiUrl = 'http://localhost:8080/api/horseShots';

  constructor(private http: HttpClient) {}

  getAll(): Observable<HorseShotDTO[]> {
    return this.http.get<HorseShotDTO[]>(this.apiUrl);
  }

  create(dto: HorseShotDTO): Observable<HorseShotDTO> {
    return this.http.post<HorseShotDTO>(this.apiUrl, dto);
  }
}
