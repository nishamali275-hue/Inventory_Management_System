import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icons/icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <header class="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 sm:px-6">
      <!-- Left: Mobile Toggle & Brand -->
      <div class="flex items-center gap-3">
        <button
          (click)="toggleSidebar.emit()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition"
          aria-label="Toggle navigation"
        >
          <app-icon name="grid" customClass="w-5 h-5" />
        </button>

        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <app-icon name="box" customClass="w-5 h-5" />
          </div>
          <div class="hidden sm:block">
            <span class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">RED</span>
            <span class="text-xs font-semibold uppercase tracking-wider text-rose-500 ml-1">Inventory</span>
          </div>
        </div>
      </div>

      <!-- Right: Actions & User Menu -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- API Docs link -->
        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noopener"
          class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <app-icon name="external-link" customClass="w-3.5 h-3.5 text-indigo-500" />
          <span>Swagger Docs</span>
        </a>

        <!-- Dark mode toggle -->
        <button
          (click)="themeService.toggleTheme()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          @if (themeService.isDarkMode()) {
            <app-icon name="sun" customClass="w-5 h-5 text-amber-400" />
          } @else {
            <app-icon name="moon" customClass="w-5 h-5 text-indigo-600" />
          }
        </button>

        <!-- User profile badge & Logout -->
        @if (authService.currentUser(); as user) {
          <div class="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div class="flex flex-col items-end text-right hidden sm:flex">
              <span class="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {{ user.name }}
              </span>
              <span
                class="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.2 rounded"
                [ngClass]="{
                  'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300': user.role === 'admin',
                  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300': user.role !== 'admin'
                }"
              >
                {{ user.role }}
              </span>
            </div>

            <div class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>

            <button
              (click)="authService.logout()"
              class="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <app-icon name="log-out" customClass="w-5 h-5" />
            </button>
          </div>
        }
      </div>
    </header>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  toggleSidebar = output<void>();
}
