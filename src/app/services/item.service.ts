import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItemDTO } from '../models/item.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apiUrl = `${API_BASE_URL}/api/items`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ItemDTO[]> {
    return this.http.get<ItemDTO[]>(this.apiUrl);
  }

  getItemById(id: number): Observable<ItemDTO> {
    return this.http.get<ItemDTO>(`${this.apiUrl}/${id}`)
  } 

  create(dto: ItemDTO): Observable<ItemDTO> {
    return this.http.post<ItemDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: ItemDTO): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, dto, {
      responseType: 'text' as 'json'
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text'
    });
  }
}
