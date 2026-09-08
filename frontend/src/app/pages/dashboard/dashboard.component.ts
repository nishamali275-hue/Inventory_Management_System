import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../core/services/dashboard.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardData } from '../../core/models/dashboard.model';
import { Product } from '../../core/models/product.model';
import { IconComponent } from '../../shared/components/icons/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, ModalComponent],
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

        <!-- Critical Alerts & Recent Activity Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Low Stock / Out of Stock Action Table (2 cols) -->
          <div class="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <app-icon name="alert-circle" customClass="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white">Stock Restock Required</h3>
                  <p class="text-xs text-slate-500">Items at or below safety threshold</p>
                </div>
              </div>
              <span class="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg">
                {{ data.lowStockAlerts.length }} items
              </span>
            </div>

            @if (data.lowStockAlerts.length === 0) {
              <div class="p-8 text-center text-slate-400 text-xs">
                <app-icon name="check-circle" customClass="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All stock levels are optimal! No low stock alerts.
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3">Product Name</th>
                      <th class="py-2.5 px-3">SKU</th>
                      <th class="py-2.5 px-3">Current Stock</th>
                      <th class="py-2.5 px-3">Status</th>
                      <th class="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    @for (item of data.lowStockAlerts; track item._id) {
                      <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                        <td class="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {{ item.name }}
                        </td>
                        <td class="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {{ item.sku }}
                        </td>
                        <td class="py-3 px-3 font-bold" [ngClass]="item.quantity === 0 ? 'text-rose-600' : 'text-amber-600'">
                          {{ item.quantity }} / {{ item.lowStockThreshold }}
                        </td>
                        <td class="py-3 px-3">
                          <span
                            class="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase"
                            [ngClass]="item.quantity === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'"
                          >
                            {{ item.status }}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right">
                          <button
                            (click)="openRestockModal(item)"
                            class="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg transition"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Recent Activity Log (1 col) -->
          <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Recent Movements</h3>
                <p class="text-xs text-slate-500">Live warehouse transactions</p>
              </div>
              <a routerLink="/stock" class="text-xs font-bold text-indigo-600 hover:underline">
                View Log
              </a>
            </div>

            <div class="space-y-4 mt-4">
              @for (tx of data.recentTransactions; track tx._id) {
                <div class="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                  <div
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    [ngClass]="{
                      'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400': tx.type === 'IN',
                      'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400': tx.type === 'OUT',
                      'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400': tx.type === 'ADJUSTMENT'
                    }"
                  >
                    @if (tx.type === 'IN') {
                      <app-icon name="arrow-down-left" customClass="w-4 h-4" />
                    } @else if (tx.type === 'OUT') {
                      <app-icon name="arrow-up-right" customClass="w-4 h-4" />
                    } @else {
                      <app-icon name="sliders" customClass="w-4 h-4" />
                    }
                  </div>

                  <div class="flex-1 min-w-0 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-slate-900 dark:text-white truncate">
                        {{ getProductName(tx.product) }}
                      </span>
                      <span class="font-bold font-mono ml-2 shrink-0" [ngClass]="tx.type === 'IN' ? 'text-emerald-600' : (tx.type === 'OUT' ? 'text-rose-600' : 'text-indigo-600')">
                        {{ tx.type === 'IN' ? '+' : (tx.type === 'OUT' ? '-' : '') }}{{ tx.quantity }}
                      </span>
                    </div>
                    <div class="text-slate-500 text-[11px] truncate">
                      {{ tx.reason || 'Warehouse operation' }}
                    </div>
                    <div class="text-[10px] text-slate-400 mt-1">
                      {{ tx.createdAt | date: 'mediumDate' }} by {{ getUserName(tx.performedBy) }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Quick Restock Modal -->
      <app-modal
        [isOpen]="isRestockModalOpen()"
        title="Quick Restock Item"
        (close)="isRestockModalOpen.set(false)"
        customWidth="max-w-md"
      >
        @if (selectedProduct(); as p) {
          <div class="space-y-4">
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div class="font-bold text-sm text-slate-900 dark:text-white">{{ p.name }}</div>
              <div class="text-xs text-slate-500 mt-0.5 font-mono">SKU: {{ p.sku }} | Current Stock: {{ p.quantity }}</div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Units to Restock
              </label>
              <input
                type="number"
                [(ngModel)]="restockUnits"
                min="1"
                class="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Reason / Memo
              </label>
              <input
                type="text"
                [(ngModel)]="restockReason"
                placeholder="e.g., Emergency restock delivery"
                class="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-3">
              <button
                (click)="isRestockModalOpen.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                (click)="executeRestock()"
                [disabled]="restockUnits <= 0 || isSubmittingRestock()"
                class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
              >
                @if (isSubmittingRestock()) {
                  <span>Restocking...</span>
                } @else {
                  <span>Confirm +{{ restockUnits }} Units</span>
                }
              </button>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);

  dashboardData = signal<DashboardData | null>(null);
  isLoading = signal<boolean>(false);

  // Quick Restock state
  isRestockModalOpen = signal<boolean>(false);
  selectedProduct = signal<Product | null>(null);
  restockUnits: number = 20;
  restockReason: string = 'Emergency restock via Dashboard';
  isSubmittingRestock = signal<boolean>(false);

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

  openRestockModal(product: Product) {
    this.selectedProduct.set(product);
    this.restockUnits = Math.max(10, (product.lowStockThreshold || 10) * 2 - product.quantity);
    this.restockReason = 'Restock triggered from Dashboard alert';
    this.isRestockModalOpen.set(true);
  }

  executeRestock() {
    const prod = this.selectedProduct();
    if (!prod) return;

    this.isSubmittingRestock.set(true);
    this.inventoryService.stockIn(prod._id, this.restockUnits, this.restockReason).subscribe({
      next: (res) => {
        this.isSubmittingRestock.set(false);
        this.isRestockModalOpen.set(false);
        this.toastService.success(res.message);
        this.loadDashboard();
      },
      error: () => {
        this.isSubmittingRestock.set(false);
      }
    });
  }

  getProductName(prod: any): string {
    return prod && prod.name ? prod.name : 'Unknown Product';
  }

  getUserName(user: any): string {
    return user && user.name ? user.name : 'System';
  }
}
