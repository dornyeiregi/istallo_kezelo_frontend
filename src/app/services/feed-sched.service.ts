import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FeedSchedDTO } from '../models/feed-sched.model';
import { FeedSchedChangeRequestDTO } from '../models/feed-sched-change-request.model';

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

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }) as Observable<string>;
  }

  getChangeRequests(): Observable<FeedSchedChangeRequestDTO[]> {
    return this.http.get<FeedSchedChangeRequestDTO[]>(`${this.apiUrl}/requests`);
  }

  approveChangeRequest(id: number): Observable<string> {
    return this.http.patch(
      `${this.apiUrl}/requests/${id}/approve`,
      {},
      { responseType: 'text' }
    ) as Observable<string>;
  }

  rejectChangeRequest(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/requests/${id}`, { responseType: 'text' }) as Observable<string>;
  }
}
