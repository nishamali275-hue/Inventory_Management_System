import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/components/icons/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <!-- Mobile Backdrop -->
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        (click)="close.emit()"
      ></div>
    }

    <!-- Sidebar Container -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between"
      [ngClass]="{
        'translate-x-0': isOpen(),
        '-translate-x-full': !isOpen()
      }"
    >
      <!-- Top Section -->
      <div class="p-5 flex flex-col gap-6">
        <!-- Sidebar Brand Logo -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <app-icon name="box" customClass="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-extrabold text-slate-900 dark:text-white leading-tight">RED SOFTWARE</h2>
              <p class="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">Inventory System</p>
            </div>
          </div>

          <button
            (click)="close.emit()"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            aria-label="Close sidebar"
          >
            <app-icon name="x" customClass="w-5 h-5" />
          </button>
        </div>

        <!-- Navigation Links -->
        <nav class="flex flex-col gap-1.5">
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold"
            (click)="close.emit()"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <app-icon name="chart" customClass="w-5 h-5" />
            <span>Dashboard</span>
          </a>

          <a
            routerLink="/products"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold"
            (click)="close.emit()"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <app-icon name="package" customClass="w-5 h-5" />
            <span>Products</span>
          </a>

          <a
            routerLink="/categories"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold"
            (click)="close.emit()"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <app-icon name="layers" customClass="w-5 h-5" />
            <span>Categories</span>
          </a>

          <a
            routerLink="/stock"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold"
            (click)="close.emit()"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <app-icon name="sliders" customClass="w-5 h-5" />
            <span>Stock Operations</span>
          </a>
        </nav>
      </div>

      <!-- Bottom Card: API Documentation -->
      <div class="p-5 border-t border-slate-100 dark:border-slate-800">
        <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-rose-50 dark:from-slate-800 dark:to-slate-800/60 border border-indigo-100 dark:border-slate-700">
          <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-1">
            <app-icon name="shield" customClass="w-4 h-4" />
            <span>OpenAPI 3.0</span>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-400 mb-3">
            Explore live REST endpoints & schemas via Swagger UI.
          </p>
          <a
            href="http://localhost:5000/api-docs"
            target="_blank"
            rel="noopener"
            class="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <span>Open Swagger UI</span>
            <app-icon name="external-link" customClass="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  isOpen = input<boolean>(false);
  close = output<void>();
}
