import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'rose' | 'sage';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'app.theme';
  private readonly themeSubject = new BehaviorSubject<AppTheme>('rose');
  readonly theme$ = this.themeSubject.asObservable();

  init(): void {
    const stored = localStorage.getItem(this.storageKey) as AppTheme | null;
    const theme = stored ?? 'rose';
    this.applyTheme(theme);
    this.themeSubject.next(theme);
  }

  setTheme(theme: AppTheme): void {
    this.applyTheme(theme);
    localStorage.setItem(this.storageKey, theme);
    this.themeSubject.next(theme);
  }

  getTheme(): AppTheme {
    return this.themeSubject.value;
  }

  private applyTheme(theme: AppTheme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
