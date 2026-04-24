import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root',
})
export class HorseShotService {
  private apiUrl = `${API_BASE_URL}/api/horseShots`;

  constructor(private http: HttpClient) {}

  addShotToHorse(shotId: number, horseId: number): Observable<any> {
    return this.http.post(this.apiUrl, { shotId, horseId });
  }
}
