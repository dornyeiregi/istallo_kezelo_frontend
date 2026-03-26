import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageDTO } from '../models/storage.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private apiUrl = `${API_BASE_URL}/api/storages`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<StorageDTO[]> {
    return this.http.get<StorageDTO[]>(this.apiUrl);
  }

  getAlerts(): Observable<StorageDTO[]> {
    return this.http.get<StorageDTO[]>(`${this.apiUrl}/alerts`);
  }

  create(dto: StorageDTO): Observable<StorageDTO> {
    return this.http.post<StorageDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: StorageDTO): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, dto, {
      responseType: 'text'
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text'
    });
  }

  sync(): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/sync`,
      {},
      { responseType: 'text' }
    ) as Observable<string>;
  }
}
