import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-slate-600 dark:text-slate-400">
      <!-- Item counts & Limit -->
      <div class="flex items-center gap-3">
        <span>
          Showing
          <span class="font-semibold text-slate-900 dark:text-white">{{ startItem() }}</span>
          to
          <span class="font-semibold text-slate-900 dark:text-white">{{ endItem() }}</span>
          of
          <span class="font-semibold text-slate-900 dark:text-white">{{ total() }}</span>
          records
        </span>

        <div class="flex items-center gap-1.5 ml-2">
          <span class="text-xs">Per page:</span>
          <select
            [value]="limit()"
            (change)="onLimitChange($event)"
            class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
          </select>
        </div>
      </div>

      <!-- Navigation buttons -->
      <div class="flex items-center gap-1">
        <button
          (click)="changePage(currentPage() - 1)"
          [disabled]="currentPage() <= 1"
          class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <app-icon name="chevron-left" customClass="w-4 h-4" />
        </button>

        @for (p of pages(); track p) {
          <button
            (click)="changePage(p)"
            class="min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition"
            [ngClass]="{
              'bg-indigo-600 text-white shadow-sm': p === currentPage(),
              'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800': p !== currentPage()
            }"
          >
            {{ p }}
          </button>
        }

        <button
          (click)="changePage(currentPage() + 1)"
          [disabled]="currentPage() >= totalPages()"
          class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          <app-icon name="chevron-right" customClass="w-4 h-4" />
        </button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  total = input.required<number>();
  limit = input<number>(10);

  pageChange = output<number>();
  limitChange = output<number>();

  startItem = computed(() => {
    if (this.total() === 0) return 0;
    return (this.currentPage() - 1) * this.limit() + 1;
  });

  endItem = computed(() => {
    return Math.min(this.currentPage() * this.limit(), this.total());
  });

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const result: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  });

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  onLimitChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newLimit = parseInt(select.value, 10);
    this.limitChange.emit(newLimit);
  }
}
