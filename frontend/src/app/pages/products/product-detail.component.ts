import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/product.model';
import { InventoryTransaction } from '../../core/models/inventory.model';
import { IconComponent } from '../../shared/components/icons/icon.component';
import { QrModalComponent } from '../../shared/components/qr-modal/qr-modal.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, QrModalComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Breadcrumb & Back -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <a routerLink="/products" class="hover:text-indigo-600 flex items-center gap-1 font-semibold">
            <app-icon name="chevron-left" customClass="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </a>
          <span>/</span>
          <span class="text-slate-900 dark:text-white font-medium">{{ product()?.name || 'Details' }}</span>
        </div>

        <button
          (click)="openQrModal()"
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
        >
          <app-icon name="qr-code" customClass="w-4 h-4 text-indigo-500" />
          <span>Generate QR Label</span>
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="py-24 text-center">
          <span class="animate-spin text-3xl text-indigo-600 inline-block mb-3">⟳</span>
          <p class="text-xs font-medium text-slate-500">Loading product details...</p>
        </div>
      }

      @if (product(); as p) {
        <!-- Main Product Card -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left: Product Specifications & Overview (2 cols) -->
          <div class="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  SKU: {{ p.sku }}
                </span>
                <h1 class="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {{ p.name }}
                </h1>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Category: <span class="font-semibold text-slate-700 dark:text-slate-300">{{ getCategoryName(p.category) }}</span>
                </p>
              </div>

              <!-- Status Badge -->
              <div>
                <span
                  class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5"
                  [ngClass]="{
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300': p.status === 'In Stock',
                    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300': p.status === 'Low Stock',
                    'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300': p.status === 'Out of Stock'
                  }"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    [ngClass]="{
                      'bg-emerald-500': p.status === 'In Stock',
                      'bg-amber-500': p.status === 'Low Stock',
                      'bg-rose-500': p.status === 'Out of Stock'
                    }"
                  ></span>
                  <span>{{ p.status }}</span>
                </span>
              </div>
            </div>

            <!-- Stats Bar -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div>
                <div class="text-[11px] font-bold uppercase text-slate-400">Current Stock</div>
                <div class="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{{ p.quantity }}</div>
              </div>
              <div>
                <div class="text-[11px] font-bold uppercase text-slate-400">Unit Price</div>
                <div class="text-2xl font-black text-slate-900 dark:text-white mt-0.5">\${{ p.unitPrice | number: '1.2-2' }}</div>
              </div>
              <div>
                <div class="text-[11px] font-bold uppercase text-slate-400">Total Value</div>
                <div class="text-2xl font-black text-slate-900 dark:text-white mt-0.5">\${{ (p.quantity * p.unitPrice) | number: '1.2-2' }}</div>
              </div>
              <div>
                <div class="text-[11px] font-bold uppercase text-slate-400">Low Stock Limit</div>
                <div class="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{{ p.lowStockThreshold }}</div>
              </div>
            </div>

            <!-- Specifications & Description -->
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                Description & Specifications
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {{ p.description || 'No detailed specifications provided for this inventory record.' }}
              </p>
            </div>

            <!-- Metadata Details -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span class="text-slate-500">Supplier:</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ p.supplierName }}</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span class="text-slate-500">Date Added:</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ p.createdAt | date: 'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <!-- Right: QR Code Preview & Direct Stock Actions (1 col) -->
          <div class="space-y-6">
            <!-- QR Code Card -->
            <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center text-center">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3">Product QR Tag</h3>

              <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs inline-block mb-3">
                @if (qrCodeImage()) {
                  <img [src]="qrCodeImage()" alt="QR Code" class="w-48 h-48 object-contain" />
                } @else {
                  <div class="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                }
              </div>

              <div class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {{ p.sku }}
              </div>

              <div class="flex items-center gap-2 mt-4 w-full">
                <button
                  (click)="openQrModal()"
                  class="flex-1 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition"
                >
                  Print Label
                </button>
              </div>
            </div>

            <!-- Quick Stock Actions Card -->
            <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Quick Movement</h3>

              <div class="flex items-center gap-2">
                <input
                  type="number"
                  [(ngModel)]="quickDelta"
                  min="1"
                  placeholder="Units"
                  class="w-24 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  (click)="quickStockIn()"
                  [disabled]="quickDelta <= 0"
                  class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
                >
                  + Stock In
                </button>
                <button
                  (click)="quickStockOut()"
                  [disabled]="quickDelta <= 0 || p.quantity < quickDelta"
                  class="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
                  [title]="p.quantity < quickDelta ? 'Insufficient stock' : 'Dispatch items'"
                >
                  - Stock Out
                </button>
              </div>
              @if (p.quantity < quickDelta) {
                <p class="text-[11px] text-rose-500">Cannot dispatch more than current stock ({{ p.quantity }}).</p>
              }
            </div>
          </div>
        </div>

        <!-- Audit History for this specific product -->
        <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Audit Movement History</h3>
              <p class="text-xs text-slate-500">Historical stock intake, dispatch, and adjustments for this SKU</p>
            </div>
          </div>

          @if (transactions().length === 0) {
            <div class="py-12 text-center text-slate-400 text-xs">
              No transactions recorded for this item yet.
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="py-3 px-4">Date & Time</th>
                    <th class="py-3 px-4">Type</th>
                    <th class="py-3 px-4">Quantity Changed</th>
                    <th class="py-3 px-4">Previous Stock</th>
                    <th class="py-3 px-4">New Stock</th>
                    <th class="py-3 px-4">Reason / Reference</th>
                    <th class="py-3 px-4">Performed By</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (tx of transactions(); track tx._id) {
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {{ tx.createdAt | date: 'short' }}
                      </td>
                      <td class="py-3 px-4">
                        <span
                          class="px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider"
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
                      <td class="py-3 px-4 font-mono text-slate-500">{{ tx.previousQuantity }}</td>
                      <td class="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{{ tx.newQuantity }}</td>
                      <td class="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {{ tx.reason || 'Standard update' }}
                      </td>
                      <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {{ getUserName(tx.performedBy) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- QR Modal -->
      <app-qr-modal
        [isOpen]="isQrModalOpen()"
        [productName]="product()?.name || ''"
        [sku]="product()?.sku || ''"
        [qrCode]="qrCodeImage()"
        (close)="isQrModalOpen.set(false)"
      />
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  product = signal<Product | null>(null);
  transactions = signal<InventoryTransaction[]>([]);
  isLoading = signal<boolean>(false);
  qrCodeImage = signal<string>('');
  isQrModalOpen = signal<boolean>(false);

  quickDelta: number = 5;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  loadProduct(id: string) {
    this.isLoading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.product) {
          this.product.set(res.product);
          this.loadQrCode(id);
          this.loadTransactions(id);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadQrCode(id: string) {
    this.productService.getProductQrCode(id).subscribe({
      next: (res) => {
        if (res.qrCode) {
          this.qrCodeImage.set(res.qrCode);
        }
      }
    });
  }

  loadTransactions(id: string) {
    this.inventoryService.getTransactions({ productId: id, limit: 20 }).subscribe({
      next: (res) => {
        if (res.transactions) {
          this.transactions.set(res.transactions);
        }
      }
    });
  }

  quickStockIn() {
    const p = this.product();
    if (!p || this.quickDelta <= 0) return;

    this.inventoryService.stockIn(p._id, this.quickDelta, 'Direct quick stock in').subscribe({
      next: (res) => {
        this.toastService.success(res.message);
        this.loadProduct(p._id);
      }
    });
  }

  quickStockOut() {
    const p = this.product();
    if (!p || this.quickDelta <= 0) return;

    this.inventoryService.stockOut(p._id, this.quickDelta, 'Direct quick stock dispatch').subscribe({
      next: (res) => {
        this.toastService.success(res.message);
        this.loadProduct(p._id);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Stock out failed');
      }
    });
  }

  openQrModal() {
    this.isQrModalOpen.set(true);
  }

  getCategoryName(cat: any): string {
    return cat && cat.name ? cat.name : 'Uncategorized';
  }

  getUserName(user: any): string {
    return user && user.name ? user.name : 'System User';
  }
}
