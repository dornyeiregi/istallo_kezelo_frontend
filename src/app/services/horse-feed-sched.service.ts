import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseFeedSchedDTO } from '../models/horse-feed-sched.model';

@Injectable({
  providedIn: 'root'
})
export class HorseFeedSchedService {
  private apiUrl = 'http://localhost:8080/api/horseFeedScheds';

  constructor(private http: HttpClient) {}

  // Összes link lekérdezése
  getAll(): Observable<HorseFeedSchedDTO[]> {
    return this.http.get<HorseFeedSchedDTO[]>(this.apiUrl);
  }

  // Link lekérdezése id alapján
  getById(id: number): Observable<HorseFeedSchedDTO> {
    return this.http.get<HorseFeedSchedDTO>(`${this.apiUrl}/${id}`);
  }

  // Lóhoz tartozó összes etetési napló lekérdezése
  getAllOfHorseById(horseId: number): Observable<HorseFeedSchedDTO[]> {
    return this.http.get<HorseFeedSchedDTO[]>(`${this.apiUrl}/horseId/${horseId}`);
  }

  // Ló hozzáadása etetési naplóhoz
  create(dto: HorseFeedSchedDTO): Observable<HorseFeedSchedDTO> {
    return this.http.post<HorseFeedSchedDTO>(this.apiUrl, dto);
  }
}
