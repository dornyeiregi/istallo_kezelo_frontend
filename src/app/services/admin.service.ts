import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '../models/user.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = `${API_BASE_URL}/api/admin`;

  constructor(private http: HttpClient) {}

  // összes user lekérdezése
  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/users`);
  }

  // user szerepkör frissítése
  updateUserRole(id: number, userType: string): Observable<string> {
    return this.http.patch(
      `${this.baseUrl}/update-role/${id}`,
      { userType },
      { responseType: 'text' }
    );
  }

  // user törlése
  deleteUser(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, {
      responseType: 'text'
    });
  }

  // új felhasználó létrehozása
  createUser(dto: any): Observable<string> {
    return this.http.post(`${this.baseUrl}/users`, dto, {
      responseType: 'text'
    });
  }
}
