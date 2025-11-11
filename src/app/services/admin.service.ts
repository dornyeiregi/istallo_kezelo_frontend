import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  // összes user lekérdezése
  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/users`);
  }

  //user szerepkör frissítése
  updateUserRole(id: number, userType: string): Observable<string> {
    return this.http.patch(
      `${this.baseUrl}/update-role/${id}`,
      { userType },
      { responseType: 'text' }
    );
  }
}
