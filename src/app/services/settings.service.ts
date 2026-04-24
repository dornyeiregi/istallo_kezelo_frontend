import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { API_BASE_URL } from '../config';
import { EmployeeAccessSettingsDTO } from '../models/employee-access-settings.model';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiUrl = `${API_BASE_URL}/api/settings/employee-access`;
  private cache$?: Observable<EmployeeAccessSettingsDTO>;
  private cachedValue?: EmployeeAccessSettingsDTO;

  constructor(private http: HttpClient) {}

  getEmployeeAccess(): Observable<EmployeeAccessSettingsDTO> {
    if (!this.cache$) {
      this.cache$ = this.http.get<EmployeeAccessSettingsDTO>(this.apiUrl).pipe(
        tap((data) => {
          this.cachedValue = data;
        }),
        shareReplay(1),
      );
    }
    return this.cache$;
  }

  updateEmployeeAccess(dto: EmployeeAccessSettingsDTO): Observable<EmployeeAccessSettingsDTO> {
    return this.http.patch<EmployeeAccessSettingsDTO>(this.apiUrl, dto).pipe(
      tap((data) => {
        this.cachedValue = data;
        this.cache$ = undefined;
      }),
    );
  }

  getCachedEmployeeAccess(): EmployeeAccessSettingsDTO | undefined {
    return this.cachedValue;
  }
}
