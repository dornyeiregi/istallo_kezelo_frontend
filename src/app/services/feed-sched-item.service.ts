import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FeedSchedItemDTO } from '../models/feed-sched-item.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class FeedSchedItemService {
  private apiUrl = `${API_BASE_URL}/api/feedSchedItems`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<FeedSchedItemDTO[]> {
    return this.http.get<FeedSchedItemDTO[]>(this.apiUrl);
  }

  create(dto: FeedSchedItemDTO): Observable<FeedSchedItemDTO> {
    return this.http.post<FeedSchedItemDTO>(this.apiUrl, dto);
  }
}
