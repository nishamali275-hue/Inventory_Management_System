import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, ProductQueryParams } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { IconComponent } from '../../shared/components/icons/icon.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ProductFormComponent } from './product-form.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { QrModalComponent } from '../../shared/components/qr-modal/qr-modal.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IconComponent,
    PaginationComponent,
    ProductFormComponent,
    ConfirmDialogComponent,
    QrModalComponent,
    ModalComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header & Action Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Product Inventory
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage catalog items, monitor stock levels, print QR labels, and export reports
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- CSV Import (Admin only) -->
          @if (authService.isAdmin()) {
            <button
              (click)="isImportModalOpen.set(true)"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
            >
              <app-icon name="upload" customClass="w-4 h-4 text-indigo-500" />
              <span>Import CSV</span>
            </button>
          }

          <!-- CSV Export -->
          <button
            (click)="exportCsv()"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
          >
            <app-icon name="download" customClass="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <!-- Add Product (Admin only) -->
          @if (authService.isAdmin()) {
            <button
              (click)="openAddModal()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <app-icon name="plus" customClass="w-4 h-4" />
              <span>Add Product</span>
            </button>
          }
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <!-- Search Input -->
        <div class="relative flex-1 w-full">
          <app-icon
            name="search"
            customClass="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Search by Product Name, SKU, or Supplier..."
            class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          @if (searchQuery) {
            <button
              (click)="clearSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <app-icon name="x" customClass="w-3.5 h-3.5" />
            </button>
          }
        </div>

        <!-- Category Dropdown -->
        <div class="w-full md:w-56">
          <select
            [(ngModel)]="selectedCategory"
            (ngModelChange)="onFilterChange()"
            class="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            @for (cat of categories(); track cat._id) {
              <option [value]="cat._id">{{ cat.name }}</option>
            }
          </select>
        </div>

        <!-- Sort By Dropdown -->
        <div class="w-full md:w-52">
          <select
            [(ngModel)]="sortBy"
            (ngModelChange)="onFilterChange()"
            class="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="createdAt">Date: Newest First</option>
            <option value="name">Product Name (A-Z)</option>
            <option value="quantity">Stock Quantity (High-Low)</option>
            <option value="unitPrice">Price (High-Low)</option>
          </select>
        </div>
      </div>

      <!-- Status Filter Chips -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
        <button
          (click)="setStatusFilter('')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
          [ngClass]="selectedStatus === '' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'"
        >
          All Items
        </button>
        <button
          (click)="setStatusFilter('In Stock')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          [ngClass]="selectedStatus === 'In Stock' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700'"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>In Stock</span>
        </button>
        <button
          (click)="setStatusFilter('Low Stock')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          [ngClass]="selectedStatus === 'Low Stock' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700'"
        >
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Low Stock</span>
        </button>
        <button
          (click)="setStatusFilter('Out of Stock')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          [ngClass]="selectedStatus === 'Out of Stock' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700'"
        >
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Out of Stock</span>
        </button>
      </div>

      <!-- Products Data Table -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        @if (isLoading()) {
          <div class="py-24 text-center">
            <span class="animate-spin text-3xl text-indigo-600 inline-block mb-3">⟳</span>
            <p class="text-xs font-medium text-slate-500">Fetching inventory items...</p>
          </div>
        } @else if (products().length === 0) {
          <!-- Empty State -->
          <div class="py-20 px-4 text-center">
            <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <app-icon name="package" customClass="w-8 h-8" />
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">No products found</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, clearing filters, or adding a new product to your inventory.
            </p>
            @if (searchQuery || selectedCategory || selectedStatus) {
              <button
                (click)="resetFilters()"
                class="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Reset All Filters
              </button>
            }
          </div>
        } @else {
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="py-3.5 px-4">Product Details</th>
                  <th class="py-3.5 px-4">SKU</th>
                  <th class="py-3.5 px-4">Category</th>
                  <th class="py-3.5 px-4">Quantity</th>
                  <th class="py-3.5 px-4">Unit Price</th>
                  <th class="py-3.5 px-4">Supplier</th>
                  <th class="py-3.5 px-4">Stock Status</th>
                  <th class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (prod of products(); track prod._id) {
                  <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <!-- Name & Image -->
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                          @if (prod.imageUrl) {
                            <img [src]="prod.imageUrl" [alt]="prod.name" class="w-full h-full object-cover" />
                          } @else {
                            <app-icon name="box" customClass="w-4 h-4 text-slate-400" />
                          }
                        </div>
                        <div>
                          <a [routerLink]="['/products', prod._id]" class="font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition">
                            {{ prod.name }}
                          </a>
                          <div class="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                            {{ prod.description || 'No description' }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- SKU -->
                    <td class="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {{ prod.sku }}
                    </td>

                    <!-- Category -->
                    <td class="py-3 px-4">
                      <span class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                        {{ getCategoryName(prod.category) }}
                      </span>
                    </td>

                    <!-- Quantity -->
                    <td class="py-3 px-4">
                      <div class="font-black text-sm" [ngClass]="prod.quantity === 0 ? 'text-rose-600' : (prod.quantity <= prod.lowStockThreshold ? 'text-amber-600' : 'text-slate-900 dark:text-white')">
                        {{ prod.quantity }}
                      </div>
                      <div class="text-[10px] text-slate-400">Min: {{ prod.lowStockThreshold }}</div>
                    </td>

                    <!-- Unit Price -->
                    <td class="py-3 px-4 font-black text-slate-900 dark:text-white">
                      \${{ prod.unitPrice | number: '1.2-2' }}
                    </td>

                    <!-- Supplier -->
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {{ prod.supplierName }}
                    </td>

                    <!-- Status -->
                    <td class="py-3 px-4">
                      <span
                        class="px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1"
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300': prod.status === 'In Stock',
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300': prod.status === 'Low Stock',
                          'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300': prod.status === 'Out of Stock'
                        }"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full"
                          [ngClass]="{
                            'bg-emerald-500': prod.status === 'In Stock',
                            'bg-amber-500': prod.status === 'Low Stock',
                            'bg-rose-500': prod.status === 'Out of Stock'
                          }"
                        ></span>
                        <span>{{ prod.status }}</span>
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="py-3 px-4 text-right">
                      <div class="inline-flex items-center gap-1">
                        <!-- View Detail -->
                        <a
                          [routerLink]="['/products', prod._id]"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                          title="View Details"
                        >
                          <app-icon name="eye" customClass="w-4 h-4" />
                        </a>

                        <!-- QR Code -->
                        <button
                          (click)="openQrModal(prod)"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                          title="Generate QR Code"
                        >
                          <app-icon name="qr-code" customClass="w-4 h-4" />
                        </button>

                        <!-- Edit (Admin only) -->
                        @if (authService.isAdmin()) {
                          <button
                            (click)="openEditModal(prod)"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                            title="Edit Product"
                          >
                            <app-icon name="edit" customClass="w-4 h-4" />
                          </button>

                          <!-- Delete (Admin only) -->
                          <button
                            (click)="promptDelete(prod)"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                            title="Delete Product"
                          >
                            <app-icon name="trash" customClass="w-4 h-4" />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
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

      <!-- Add / Edit Modal -->
      <app-product-form
        [isOpen]="isFormModalOpen()"
        [product]="selectedProductForEdit()"
        (close)="isFormModalOpen.set(false)"
        (saved)="onProductSaved()"
      />

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Delete Product"
        [message]="'Are you sure you want to delete ' + (productToDelete()?.name || 'this item') + '?'"
        detail="This will permanently delete this product and its associated stock transaction records. This action cannot be reversed."
        confirmButtonText="Delete Product"
        (confirm)="confirmDelete()"
        (cancel)="isDeleteDialogOpen.set(false)"
      />

      <!-- QR Code Modal -->
      <app-qr-modal
        [isOpen]="isQrModalOpen()"
        [productName]="qrProduct()?.name || ''"
        [sku]="qrProduct()?.sku || ''"
        [qrCode]="activeQrCode()"
        (close)="isQrModalOpen.set(false)"
      />

      <!-- CSV Import Modal -->
      <app-modal
        [isOpen]="isImportModalOpen()"
        title="Import Inventory from CSV"
        (close)="isImportModalOpen.set(false)"
        customWidth="max-w-md"
      >
        <div class="space-y-4">
          <p class="text-xs text-slate-600 dark:text-slate-300">
            Upload a standard CSV file with headers: <span class="font-mono font-bold">Product Name, SKU, Category, Quantity, Unit Price, Supplier, Description</span>.
          </p>

          <div class="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center">
            <app-icon name="upload" customClass="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <input
              type="file"
              (change)="onCsvFileSelected($event)"
              accept=".csv"
              class="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            <p class="text-[11px] text-slate-400 mt-2">Maximum file size: 10MB</p>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3">
            <button
              (click)="isImportModalOpen.set(false)"
              class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              (click)="uploadCsvFile()"
              [disabled]="!importFile || isUploadingCsv()"
              class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
            >
              @if (isUploadingCsv()) {
                <span>Importing...</span>
              } @else {
                <span>Process CSV</span>
              }
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);

  // Pagination & Filtering
  currentPage = 1;
  limit = 10;
  totalCount = 0;
  totalPages = 1;
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  sortBy = 'createdAt';

  // Add / Edit Modal state
  isFormModalOpen = signal<boolean>(false);
  selectedProductForEdit = signal<Product | null>(null);

  // Delete Dialog state
  isDeleteDialogOpen = signal<boolean>(false);
  productToDelete = signal<Product | null>(null);

  // QR Modal state
  isQrModalOpen = signal<boolean>(false);
  qrProduct = signal<Product | null>(null);
  activeQrCode = signal<string>('');

  // CSV Import state
  isImportModalOpen = signal<boolean>(false);
  importFile: File | null = null;
  isUploadingCsv = signal<boolean>(false);

  private searchDebounceTimer: any;

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        if (res.categories) {
          this.categories.set(res.categories);
        }
      }
    });
  }

  loadProducts() {
    this.isLoading.set(true);
    const params: ProductQueryParams = {
      page: this.currentPage,
      limit: this.limit,
      search: this.searchQuery || undefined,
      category: this.selectedCategory || undefined,
      status: this.selectedStatus || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortBy === 'name' ? 'asc' : 'desc'
    };

    this.productService.getProducts(params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.products.set(res.products);
          this.totalCount = res.total;
          this.totalPages = res.totalPages;
          this.currentPage = res.currentPage;
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadProducts();
    }, 300);
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadProducts();
  }

  setStatusFilter(status: string) {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.sortBy = 'createdAt';
    this.currentPage = 1;
    this.loadProducts();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadProducts();
  }

  onLimitChange(newLimit: number) {
    this.limit = newLimit;
    this.currentPage = 1;
    this.loadProducts();
  }

  openAddModal() {
    this.selectedProductForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(product: Product) {
    this.selectedProductForEdit.set(product);
    this.isFormModalOpen.set(true);
  }

  onProductSaved() {
    this.isFormModalOpen.set(false);
    this.loadProducts();
  }

  promptDelete(product: Product) {
    this.productToDelete.set(product);
    this.isDeleteDialogOpen.set(true);
  }

  confirmDelete() {
    const prod = this.productToDelete();
    if (!prod) return;

    this.productService.deleteProduct(prod._id).subscribe({
      next: (res) => {
        this.isDeleteDialogOpen.set(false);
        this.toastService.success(res.message);
        this.loadProducts();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Delete failed');
      }
    });
  }

  openQrModal(product: Product) {
    this.qrProduct.set(product);
    this.activeQrCode.set('');
    this.isQrModalOpen.set(true);

    this.productService.getProductQrCode(product._id).subscribe({
      next: (res) => {
        if (res.qrCode) {
          this.activeQrCode.set(res.qrCode);
        }
      }
    });
  }

  exportCsv() {
    this.productService.exportCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Inventory exported successfully');
      },
      error: () => {
        this.toastService.error('Failed to export CSV');
      }
    });
  }

  onCsvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importFile = input.files[0];
    }
  }

  uploadCsvFile() {
    if (!this.importFile) return;

    this.isUploadingCsv.set(true);
    const formData = new FormData();
    formData.append('file', this.importFile);

    this.productService.importCsv(formData).subscribe({
      next: (res) => {
        this.isUploadingCsv.set(false);
        this.isImportModalOpen.set(false);
        this.importFile = null;
        this.toastService.success(res.message);
        this.loadProducts();
      },
      error: (err) => {
        this.isUploadingCsv.set(false);
        this.toastService.error(err.error?.message || 'Failed to import CSV');
      }
    });
  }

  getCategoryName(cat: any): string {
    return cat && cat.name ? cat.name : 'Uncategorized';
  }
}
