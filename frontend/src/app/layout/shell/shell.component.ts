import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, ToastComponent],
  template: `
    <div class="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      <!-- Sidebar -->
      <app-sidebar [isOpen]="sidebarOpen()" (close)="sidebarOpen.set(false)" />

      <!-- Content Area -->
      <div class="flex flex-1 flex-col overflow-hidden min-w-0">
        <!-- Top Navbar -->
        <app-navbar (toggleSidebar)="sidebarOpen.set(!sidebarOpen())" />

        <!-- Main Viewport -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Toast Container -->
      <app-toast />
    </div>
  `
})
export class ShellComponent {
  sidebarOpen = signal<boolean>(false);
}
