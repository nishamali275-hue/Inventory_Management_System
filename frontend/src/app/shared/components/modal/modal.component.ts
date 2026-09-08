import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          (click)="close.emit()"
        ></div>

        <!-- Modal Box -->
        <div
          class="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95"
          [ngClass]="customWidth() || 'max-w-xl'"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ title() }}
            </h3>
            <button
              (click)="close.emit()"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close dialog"
            >
              <app-icon name="x" customClass="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 max-h-[calc(100vh-14rem)] overflow-y-auto">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  customWidth = input<string>('max-w-xl');
  close = output<void>();
}
