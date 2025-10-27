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

  create(dto: FeedSchedDTO): Observable<FeedSchedDTO> {
    return this.http.post<FeedSchedDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: FeedSchedDTO): Observable<FeedSchedDTO> {
    return this.http.patch<FeedSchedDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
