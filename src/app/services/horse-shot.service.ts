import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HorseShotService {
  private apiUrl = 'http://localhost:8080/api/horseShots';

  constructor(private http: HttpClient) {}

  addShotToHorse(shotId: number, horseId: number): Observable<any> {
    return this.http.post(this.apiUrl, { shotId, horseId });
  }
}
