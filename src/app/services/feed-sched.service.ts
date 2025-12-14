import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FeedSchedDTO } from '../models/feed-sched.model';

@Injectable({
  providedIn: 'root'
})
export class FeedSchedService {
  private apiUrl = 'http://localhost:8080/api/feedScheds';

  constructor(private http: HttpClient) {}

  getAll(): Observable<FeedSchedDTO[]> {
    return this.http.get<FeedSchedDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<FeedSchedDTO> {
    return this.http.get<FeedSchedDTO>(`${this.apiUrl}/${id}`);
  }

  getAllOfHorseById(horseId: number): Observable<FeedSchedDTO[]> {
    return this.http.get<FeedSchedDTO[]>(`${this.apiUrl}/horseId/${horseId}`);
  }

  create(dto: FeedSchedDTO): Observable<FeedSchedDTO> {
    return this.http.post<FeedSchedDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: FeedSchedDTO): Observable<string> {
    return this.http.patch(
      `${this.apiUrl}/${id}`,
      dto,
      { responseType: 'text' }
    ) as Observable<string>;
  }

  addHorseToFeedSched(feedSchedId: number, horseId: number): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/${feedSchedId}/addHorse/${horseId}`,
      {},
      { responseType: 'text' }
    ) as Observable<string>;
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }) as Observable<string>;
  }
}
