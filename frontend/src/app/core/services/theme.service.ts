import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('inventory_theme');
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const prefersDark = !!mediaQuery?.matches;
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    this.setDarkMode(isDark);

    if (mediaQuery) {
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('inventory_theme')) {
          this.setDarkMode(e.matches);
        }
      });
    }
  }

  toggleTheme() {
    this.setDarkMode(!this.isDarkMode());
  }

  setDarkMode(isDark: boolean) {
    this.isDarkMode.set(isDark);
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('inventory_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('inventory_theme', 'light');
      }
    }
  }
}
