import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, IconComponent],
  template: `
    <app-modal [isOpen]="isOpen()" [title]="title()" (close)="cancel.emit()" customWidth="max-w-md">
      <div class="flex flex-col items-center text-center p-2">
        <div class="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <app-icon name="alert-circle" customClass="w-8 h-8" />
        </div>

        <h4 class="text-base font-bold text-slate-900 dark:text-white">{{ message() }}</h4>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {{ detail() || 'This action cannot be undone. Are you sure you want to proceed?' }}
        </p>

        <div class="flex items-center justify-end gap-3 mt-6 w-full">
          <button
            (click)="cancel.emit()"
            class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            (click)="confirm.emit()"
            class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition shadow-sm"
          >
            {{ confirmButtonText() || 'Delete' }}
          </button>
        </div>
      </div>
    </app-modal>
  `
})
export class ConfirmDialogComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Confirm Action');
  message = input<string>('Are you sure you want to proceed?');
  detail = input<string>('');
  confirmButtonText = input<string>('Confirm');

  confirm = output<void>();
  cancel = output<void>();
}
