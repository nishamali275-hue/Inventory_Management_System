import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../core/models/dashboard.model';
import { IconComponent } from '../../shared/components/icons/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Inventory Dashboard
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time stock analytics, critical alerts, and warehouse operations
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="loadDashboard()"
            [disabled]="isLoading()"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
          >
            <app-icon name="refresh-cw" [customClass]="'w-4 h-4 ' + (isLoading() ? 'animate-spin' : '')" />
            <span>Refresh</span>
          </button>

          <a
            routerLink="/products"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <app-icon name="plus" customClass="w-4 h-4" />
            <span>Manage Products</span>
          </a>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading() && !dashboardData()) {
        <div class="flex items-center justify-center py-24">
          <div class="text-center">
            <span class="animate-spin text-3xl text-indigo-600 inline-block mb-3">⟳</span>
            <p class="text-sm font-medium text-slate-500">Loading live inventory metrics...</p>
          </div>
        </div>
      }

      <!-- Dashboard Content -->
      @if (dashboardData(); as data) {
        <!-- KPI Metric Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <!-- Total Products -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Products</span>
              <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <app-icon name="package" customClass="w-4 h-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900 dark:text-white">{{ data.kpis.totalProducts }}</div>
              <p class="text-[11px] text-slate-400 mt-0.5">Catalog SKUs</p>
            </div>
          </div>

          <!-- Total Categories -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Categories</span>
              <div class="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <app-icon name="layers" customClass="w-4 h-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900 dark:text-white">{{ data.kpis.totalCategories }}</div>
              <p class="text-[11px] text-slate-400 mt-0.5">Active groups</p>
            </div>
          </div>

          <!-- Total Stock Quantity -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Units</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <app-icon name="box" customClass="w-4 h-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900 dark:text-white">{{ data.kpis.totalStockQuantity }}</div>
              <p class="text-[11px] text-slate-400 mt-0.5">Physical items on hand</p>
            </div>
          </div>

          <!-- Low Stock Items -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Low Stock</span>
              <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <app-icon name="alert-circle" customClass="w-4 h-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-amber-600 dark:text-amber-400">{{ data.kpis.lowStockCount }}</div>
              <p class="text-[11px] text-slate-400 mt-0.5">Below threshold</p>
            </div>
          </div>

          <!-- Out of Stock Items -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Out of Stock</span>
              <div class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <app-icon name="x" customClass="w-4 h-4" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-rose-600 dark:text-rose-400">{{ data.kpis.outOfStockCount }}</div>
              <p class="text-[11px] text-slate-400 mt-0.5">Zero quantity</p>
            </div>
          </div>

          <!-- Inventory Valuation -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Inventory Value</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <span class="font-bold text-sm">$</span>
              </div>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900 dark:text-white">
                \${{ data.kpis.totalInventoryValue | number: '1.2-2' }}
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Gross asset valuation</p>
            </div>
          </div>
        </div>

        <!-- Charts and Breakdown Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Stock Status Breakdown Card -->
          <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Stock Status Overview</h3>
                <p class="text-xs text-slate-500">Inventory health distribution by stock level</p>
              </div>
              <div class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <app-icon name="chart" customClass="w-4 h-4" />
              </div>
            </div>

            <!-- Progress Bar Visualization -->
            <div class="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex my-5">
              @if (data.kpis.totalProducts > 0) {
                <div
                  class="bg-emerald-500 transition-all duration-500"
                  [style.width.%]="(data.kpis.inStockCount / data.kpis.totalProducts) * 100"
                  title="In Stock"
                ></div>
                <div
                  class="bg-amber-500 transition-all duration-500"
                  [style.width.%]="(data.kpis.lowStockCount / data.kpis.totalProducts) * 100"
                  title="Low Stock"
                ></div>
                <div
                  class="bg-rose-500 transition-all duration-500"
                  [style.width.%]="(data.kpis.outOfStockCount / data.kpis.totalProducts) * 100"
                  title="Out of Stock"
                ></div>
              }
            </div>

            <!-- Distribution Legend with Percentages -->
            <div class="grid grid-cols-3 gap-3 pt-2">
              <div class="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="text-xs font-bold text-emerald-800 dark:text-emerald-300">In Stock</span>
                </div>
                <div class="text-xl font-black text-emerald-900 dark:text-emerald-200">{{ data.kpis.inStockCount }}</div>
                <div class="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {{ (data.kpis.totalProducts ? (data.kpis.inStockCount / data.kpis.totalProducts * 100) : 0) | number: '1.0-0' }}% of products
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span class="text-xs font-bold text-amber-800 dark:text-amber-300">Low Stock</span>
                </div>
                <div class="text-xl font-black text-amber-900 dark:text-amber-200">{{ data.kpis.lowStockCount }}</div>
                <div class="text-[11px] text-amber-700 dark:text-amber-400">
                  {{ (data.kpis.totalProducts ? (data.kpis.lowStockCount / data.kpis.totalProducts * 100) : 0) | number: '1.0-0' }}% of products
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span class="text-xs font-bold text-rose-800 dark:text-rose-300">Out of Stock</span>
                </div>
                <div class="text-xl font-black text-rose-900 dark:text-rose-200">{{ data.kpis.outOfStockCount }}</div>
                <div class="text-[11px] text-rose-700 dark:text-rose-400">
                  {{ (data.kpis.totalProducts ? (data.kpis.outOfStockCount / data.kpis.totalProducts * 100) : 0) | number: '1.0-0' }}% of products
                </div>
              </div>
            </div>
          </div>

          <!-- Category Stock Distribution Chart -->
          <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Category Distribution</h3>
                <p class="text-xs text-slate-500">Stock quantities across categories</p>
              </div>
              <a routerLink="/categories" class="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </a>
            </div>

            <div class="space-y-3.5 mt-4">
              @for (cat of data.categoryDistribution; track cat._id) {
                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="font-semibold text-slate-800 dark:text-slate-200">{{ cat.categoryName }}</span>
                    <span class="font-bold text-slate-900 dark:text-white">
                      {{ cat.totalStock }} units ({{ cat.productCount }} SKUs)
                    </span>
                  </div>
                  <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full transition-all duration-500"
                      [style.width.%]="data.kpis.totalStockQuantity ? (cat.totalStock / data.kpis.totalStockQuantity * 100) : 0"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  dashboardData = signal<DashboardData | null>(null);
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.dashboardService.getStats().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.dashboardData.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
