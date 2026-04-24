import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '../models/user.model';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root',
})
/**
 * Provides administrator operations for user management.
 */
export class AdminService {
  private readonly baseUrl = `${API_BASE_URL}/api/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Loads every registered user visible to administrators.
   */
  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/users`);
  }

  /**
   * Updates the role assigned to an existing user.
   */
  updateUserRole(id: number, userType: string): Observable<string> {
    return this.http.patch(
      `${this.baseUrl}/update-role/${id}`,
      { userType },
      { responseType: 'text' },
    );
  }

  /**
   * Deletes a user by identifier.
   */
  deleteUser(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, {
      responseType: 'text',
    });
  }

  /**
   * Creates a new user from the administrator form payload.
   */
  createUser(dto: any): Observable<string> {
    return this.http.post(`${this.baseUrl}/users`, dto, {
      responseType: 'text',
    });
  }
}
