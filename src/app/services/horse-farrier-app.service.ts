import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorseFarrierAppDTO } from '../models/horse-farrier-app.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class HorseFarrierAppService {
  private apiUrl = `${API_BASE_URL}/api/horseFarrierApps`;

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
