import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '../models/user.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  getAll(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.apiUrl);
  }

  getAllOwners(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.apiUrl)
      .pipe(map(users => users.filter(u => u.userType === 'OWNER')));
  }

  getById(id: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/${id}`);
  }

  getByUsername(username: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/byUsername/${username}`);
  }

  create(dto: UserDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(this.apiUrl, dto);
  }

  update(id: number, dto: UserDTO): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiUrl}/${id}`, dto);
  }
}
