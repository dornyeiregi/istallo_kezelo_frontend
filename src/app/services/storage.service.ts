import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageDTO } from '../models/storage.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private apiUrl = 'http://localhost:8080/api/storages';

  constructor(private http: HttpClient) {}

  getAll(): Observable<StorageDTO[]> {
    return this.http.get<StorageDTO[]>(this.apiUrl);
  }

  create(dto: StorageDTO): Observable<StorageDTO> {
    return this.http.post<StorageDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: StorageDTO): Observable<StorageDTO> {
    return this.http.patch<StorageDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

}
