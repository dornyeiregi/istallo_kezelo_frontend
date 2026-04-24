import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
  });

  it('init applies stored theme', () => {
    localStorage.setItem('app.theme', 'sage');

    service.init();

    expect(document.documentElement.getAttribute('data-theme')).toBe('sage');
    expect(service.getTheme()).toBe('sage');
  });

  it('setTheme updates storage and DOM', () => {
    service.setTheme('rose');

    expect(localStorage.getItem('app.theme')).toBe('rose');
    expect(document.documentElement.getAttribute('data-theme')).toBe('rose');
    expect(service.getTheme()).toBe('rose');
  });
});
