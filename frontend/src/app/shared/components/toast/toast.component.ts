import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none px-4">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-xl border text-sm transition-all duration-300 transform translate-y-0"
          [ngClass]="{
            'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800': toast.type === 'success',
            'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800': toast.type === 'error',
            'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800': toast.type === 'warning',
            'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800': toast.type === 'info'
          }"
        >
          <div class="flex items-center space-x-3">
            @switch (toast.type) {
              @case ('success') {
                <app-icon name="check-circle" customClass="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              }
              @case ('error') {
                <app-icon name="alert-circle" customClass="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              }
              @case ('warning') {
                <app-icon name="alert-circle" customClass="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              }
              @default {
                <app-icon name="alert-circle" customClass="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              }
            }
            <span class="font-medium leading-snug">{{ toast.message }}</span>
          </div>

          <button
            (click)="toastService.remove(toast.id)"
            class="ml-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:text-slate-400 transition"
            aria-label="Close notification"
          >
            <app-icon name="x" customClass="w-4 h-4" />
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
