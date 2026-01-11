import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseFarrierAppDTO } from '../models/horse-farrier-app.model';

@Injectable({
  providedIn: 'root'
})
export class HorseFarrierAppService {
  private apiUrl = 'http://localhost:8080/api/horseFarrierApps';

  constructor(private http: HttpClient) {}

  // Összes link lekérdezése
  getAll(): Observable<HorseFarrierAppDTO[]> {
    return this.http.get<HorseFarrierAppDTO[]>(this.apiUrl);
  }

  // Link lekérdezése id alapján
  getById(id: number): Observable<HorseFarrierAppDTO> {
    return this.http.get<HorseFarrierAppDTO>(`${this.apiUrl}/${id}`);
  }

  // Összes patkolás lekérdezése ló id alapján
  getAllOfHorseById(horseId: number): Observable<HorseFarrierAppDTO[]> {
    return this.http.get<HorseFarrierAppDTO[]>(`${this.apiUrl}/byHorseId/${horseId}`);
  }

  // Link létrehozása ló és patkolás között
  create(dto: HorseFarrierAppDTO): Observable<HorseFarrierAppDTO> {
    return this.http.post<HorseFarrierAppDTO>(this.apiUrl, dto);
  }
}
