import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { InventoryTransaction, TransactionType } from '../../core/models/inventory.model';
import { Product } from '../../core/models/product.model';
import { IconComponent } from '../../shared/components/icons/icon.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, PaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Stock Operations & Audit Trails
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record stock replenishments, dispatches, audit adjustments, and review ledger history
          </p>
        </div>
      </div>

      <!-- Quick Movement Panels (Tabs / Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Stock In Card -->
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <app-icon name="arrow-down-left" customClass="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Stock In (Intake)</h3>
                <p class="text-[11px] text-slate-500">Add newly received inventory</p>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Product</label>
                <select
                  [(ngModel)]="inProductId"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Choose item to restock</option>
                  @for (p of allProducts(); track p._id) {
                    <option [value]="p._id">{{ p.name }} (Current: {{ p.quantity }})</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Units to Add</label>
                <input
                  type="number"
                  [(ngModel)]="inQuantity"
                  min="1"
                  placeholder="0"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason / PO Number</label>
                <input
                  type="text"
                  [(ngModel)]="inReason"
                  placeholder="e.g. PO-8491 from Supplier"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            (click)="handleStockIn()"
            [disabled]="!inProductId || inQuantity <= 0 || isSubmittingIn()"
            class="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
          >
            @if (isSubmittingIn()) {
              <span>Processing...</span>
            } @else {
              <span>+ Record Stock In</span>
            }
          </button>
        </div>

        <!-- Stock Out Card -->
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <app-icon name="arrow-up-right" customClass="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Stock Out (Dispatch)</h3>
                <p class="text-[11px] text-slate-500">Issue items for orders or sales</p>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Product</label>
                <select
                  [(ngModel)]="outProductId"
                  (ngModelChange)="onOutProductSelected()"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Choose item to dispatch</option>
                  @for (p of allProducts(); track p._id) {
                    <option [value]="p._id">{{ p.name }} (Available: {{ p.quantity }})</option>
                  }
                </select>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Units to Dispatch</label>
                  @if (selectedOutProduct(); as sp) {
                    <span class="text-[10px] font-bold text-slate-400">Max: {{ sp.quantity }}</span>
                  }
                </div>
                <input
                  type="number"
                  [(ngModel)]="outQuantity"
                  min="1"
                  placeholder="0"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-rose-500"
                />
                @if (selectedOutProduct() && outQuantity > (selectedOutProduct()?.quantity || 0)) {
                  <p class="text-[11px] text-rose-500 mt-1 font-medium">
                    Exceeds available stock ({{ selectedOutProduct()?.quantity }}). Negative inventory is prohibited!
                  </p>
                }
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason / Order #</label>
                <input
                  type="text"
                  [(ngModel)]="outReason"
                  placeholder="e.g. Sales order #10842"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          <button
            (click)="handleStockOut()"
            [disabled]="!outProductId || outQuantity <= 0 || (selectedOutProduct() && outQuantity > (selectedOutProduct()?.quantity || 0)) || isSubmittingOut()"
            class="mt-5 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
          >
            @if (isSubmittingOut()) {
              <span>Processing...</span>
            } @else {
              <span>- Record Stock Out</span>
            }
          </button>
        </div>

        <!-- Stock Adjustment Card (Admin only) -->
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <app-icon name="sliders" customClass="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Audit Adjustment</h3>
                <p class="text-[11px] text-slate-500">Reconcile physical warehouse count</p>
              </div>
            </div>

            @if (authService.isAdmin()) {
              <div class="space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Product</label>
                  <select
                    [(ngModel)]="adjProductId"
                    (ngModelChange)="onAdjProductSelected()"
                    class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose item to adjust</option>
                    @for (p of allProducts(); track p._id) {
                      <option [value]="p._id">{{ p.name }} (Current: {{ p.quantity }})</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Target Count</label>
                  <input
                    type="number"
                    [(ngModel)]="adjTargetQty"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Audit Justification</label>
                  <input
                    type="text"
                    [(ngModel)]="adjReason"
                    placeholder="e.g. Physical inventory variance reconciliation"
                    class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            } @else {
              <div class="p-6 text-center text-slate-400 text-xs">
                <app-icon name="shield" customClass="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Physical audit adjustments require Administrator privileges.
              </div>
            }
          </div>

          @if (authService.isAdmin()) {
            <button
              (click)="handleStockAdjust()"
              [disabled]="!adjProductId || adjTargetQty < 0 || isSubmittingAdj()"
              class="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              @if (isSubmittingAdj()) {
                <span>Processing...</span>
              } @else {
                <span>Apply Count Adjustment</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- Audit Log Table Card -->
      <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <!-- Header & Filters -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Transaction Audit Ledger</h3>
            <p class="text-xs text-slate-500">Immutable chronological record of all stock intake, dispatches, and adjustments</p>
          </div>

          <!-- Type filter -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Type:</span>
            <select
              [(ngModel)]="selectedType"
              (ngModelChange)="onTypeFilterChange()"
              class="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Transactions</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>
        </div>

        @if (isLoadingTransactions()) {
          <div class="py-20 text-center">
            <span class="animate-spin text-3xl text-indigo-600 inline-block mb-3">⟳</span>
            <p class="text-xs font-medium text-slate-500">Loading audit ledger...</p>
          </div>
        } @else if (transactions().length === 0) {
          <div class="py-16 text-center text-slate-400 text-xs">
            No transaction records found matching criteria.
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="py-3 px-4">Date & Time</th>
                  <th class="py-3 px-4">Product Name</th>
                  <th class="py-3 px-4">SKU</th>
                  <th class="py-3 px-4">Type</th>
                  <th class="py-3 px-4">Changed Qty</th>
                  <th class="py-3 px-4">Prev Balance</th>
                  <th class="py-3 px-4">New Balance</th>
                  <th class="py-3 px-4">Reason / Notes</th>
                  <th class="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (tx of transactions(); track tx._id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td class="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {{ tx.createdAt | date: 'short' }}
                    </td>
                    <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {{ getProductName(tx.product) }}
                    </td>
                    <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {{ getProductSku(tx.product) }}
                    </td>
                    <td class="py-3 px-4">
                      <span
                        class="px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider inline-block"
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300': tx.type === 'IN',
                          'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300': tx.type === 'OUT',
                          'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300': tx.type === 'ADJUSTMENT'
                        }"
                      >
                        {{ tx.type }}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-bold font-mono" [ngClass]="tx.type === 'IN' ? 'text-emerald-600' : (tx.type === 'OUT' ? 'text-rose-600' : 'text-indigo-600')">
                      {{ tx.type === 'IN' ? '+' : (tx.type === 'OUT' ? '-' : '') }}{{ tx.quantity }}
                    </td>
                    <td class="py-3 px-4 font-mono text-slate-400">{{ tx.previousQuantity }}</td>
                    <td class="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{{ tx.newQuantity }}</td>
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {{ tx.reason || 'General inventory movement' }}
                    </td>
                    <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {{ getUserName(tx.performedBy) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <app-pagination
            [currentPage]="currentPage"
            [totalPages]="totalPages"
            [total]="totalCount"
            [limit]="limit"
            (pageChange)="onPageChange($event)"
            (limitChange)="onLimitChange($event)"
          />
        }
      </div>
    </div>
  `
})
export class StockManagementComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  allProducts = signal<Product[]>([]);
  transactions = signal<InventoryTransaction[]>([]);
  isLoadingTransactions = signal<boolean>(false);

  // Pagination & Filtering
  currentPage = 1;
  limit = 15;
  totalCount = 0;
  totalPages = 1;
  selectedType = '';

  // Stock In Form
  inProductId = '';
  inQuantity = 10;
  inReason = '';
  isSubmittingIn = signal<boolean>(false);

  // Stock Out Form
  outProductId = '';
  outQuantity = 5;
  outReason = '';
  selectedOutProduct = signal<Product | null>(null);
  isSubmittingOut = signal<boolean>(false);

  // Adjustment Form
  adjProductId = '';
  adjTargetQty = 0;
  adjReason = '';
  isSubmittingAdj = signal<boolean>(false);

  ngOnInit() {
    this.loadAllProducts();
    this.loadTransactions();
  }

  loadAllProducts() {
    this.productService.getProducts({ limit: 100 }).subscribe({
      next: (res) => {
        if (res.products) {
          this.allProducts.set(res.products);
        }
      }
    });
  }

  loadTransactions() {
    this.isLoadingTransactions.set(true);
    this.inventoryService
      .getTransactions({
        page: this.currentPage,
        limit: this.limit,
        type: this.selectedType || undefined
      })
      .subscribe({
        next: (res) => {
          this.isLoadingTransactions.set(false);
          if (res.success) {
            this.transactions.set(res.transactions);
            this.totalCount = res.total;
            this.totalPages = res.totalPages;
            this.currentPage = res.currentPage;
          }
        },
        error: () => {
          this.isLoadingTransactions.set(false);
        }
      });
  }

  onTypeFilterChange() {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadTransactions();
  }

  onLimitChange(newLimit: number) {
    this.limit = newLimit;
    this.currentPage = 1;
    this.loadTransactions();
  }

  onOutProductSelected() {
    const prod = this.allProducts().find((p) => p._id === this.outProductId);
    this.selectedOutProduct.set(prod || null);
  }

  onAdjProductSelected() {
    const prod = this.allProducts().find((p) => p._id === this.adjProductId);
    if (prod) {
      this.adjTargetQty = prod.quantity;
    }
  }

  handleStockIn() {
    if (!this.inProductId || this.inQuantity <= 0) return;

    this.isSubmittingIn.set(true);
    this.inventoryService.stockIn(this.inProductId, this.inQuantity, this.inReason).subscribe({
      next: (res) => {
        this.isSubmittingIn.set(false);
        this.toastService.success(res.message);
        this.inQuantity = 10;
        this.inReason = '';
        this.loadAllProducts();
        this.loadTransactions();
      },
      error: (err) => {
        this.isSubmittingIn.set(false);
        this.toastService.error(err.error?.message || 'Stock In failed');
      }
    });
  }

  handleStockOut() {
    if (!this.outProductId || this.outQuantity <= 0) return;

    this.isSubmittingOut.set(true);
    this.inventoryService.stockOut(this.outProductId, this.outQuantity, this.outReason).subscribe({
      next: (res) => {
        this.isSubmittingOut.set(false);
        this.toastService.success(res.message);
        this.outQuantity = 5;
        this.outReason = '';
        this.loadAllProducts();
        this.loadTransactions();
      },
      error: (err) => {
        this.isSubmittingOut.set(false);
        this.toastService.error(err.error?.message || 'Stock Out failed');
      }
    });
  }

  handleStockAdjust() {
    if (!this.adjProductId || this.adjTargetQty < 0) return;

    this.isSubmittingAdj.set(true);
    this.inventoryService.adjustStock(this.adjProductId, this.adjTargetQty, this.adjReason).subscribe({
      next: (res) => {
        this.isSubmittingAdj.set(false);
        this.toastService.success(res.message);
        this.adjReason = '';
        this.loadAllProducts();
        this.loadTransactions();
      },
      error: (err) => {
        this.isSubmittingAdj.set(false);
        this.toastService.error(err.error?.message || 'Adjustment failed');
      }
    });
  }

  getProductName(p: any): string {
    return p && p.name ? p.name : 'Unknown Product';
  }

  getProductSku(p: any): string {
    return p && p.sku ? p.sku : '-';
  }

  getUserName(u: any): string {
    return u && u.name ? u.name : 'System';
  }
}
