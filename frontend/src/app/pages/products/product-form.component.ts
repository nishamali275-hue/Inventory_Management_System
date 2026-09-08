import { Component, OnInit, ElementRef, inject, input, output, signal, effect, untracked, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="product() ? 'Edit Product: ' + product()?.name : 'Add New Product'"
      (close)="onCancel()"
      customWidth="max-w-2xl"
    >
      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Product Name -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Ergonomic Keyboard"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [ngClass]="{ 'border-rose-500': f['name'].touched && f['name'].invalid }"
            />
            @if (f['name'].touched && f['name'].errors?.['required']) {
              <p class="text-xs text-rose-500 mt-1">Product name is required</p>
            }
          </div>

          <!-- SKU -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              formControlName="sku"
              placeholder="e.g. ELEC-KBD-009"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [ngClass]="{ 'border-rose-500': f['sku'].touched && f['sku'].invalid }"
            />
            @if (f['sku'].touched && f['sku'].errors?.['required']) {
              <p class="text-xs text-rose-500 mt-1">SKU is required and must be unique</p>
            }
          </div>

          <!-- Category -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              formControlName="category"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [ngClass]="{ 'border-rose-500': f['category'].touched && f['category'].invalid }"
            >
              <option value="">Select a category</option>
              @for (cat of categories(); track cat._id) {
                <option [value]="cat._id">{{ cat.name }}</option>
              }
            </select>
            @if (f['category'].touched && f['category'].errors?.['required']) {
              <p class="text-xs text-rose-500 mt-1">Category is required</p>
            }
          </div>

          <!-- Quantity -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Quantity on Hand *
            </label>
            <input
              type="number"
              formControlName="quantity"
              min="0"
              placeholder="0"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [ngClass]="{ 'border-rose-500': f['quantity'].touched && f['quantity'].invalid }"
            />
            @if (f['quantity'].touched && f['quantity'].errors?.['min']) {
              <p class="text-xs text-rose-500 mt-1">Quantity cannot be negative</p>
            }
          </div>

          <!-- Unit Price -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Unit Price ($) *
            </label>
            <input
              type="number"
              formControlName="unitPrice"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [ngClass]="{ 'border-rose-500': f['unitPrice'].touched && f['unitPrice'].invalid }"
            />
            @if (f['unitPrice'].touched && f['unitPrice'].errors?.['min']) {
              <p class="text-xs text-rose-500 mt-1">Unit price cannot be negative</p>
            }
          </div>

          <!-- Supplier Name -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Supplier Name *
            </label>
            <input
              type="text"
              formControlName="supplierName"
              placeholder="e.g. Apex Distribution"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [ngClass]="{ 'border-rose-500': f['supplierName'].touched && f['supplierName'].invalid }"
            />
          </div>

          <!-- Low Stock Threshold -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Low Stock Alert Threshold
            </label>
            <input
              type="number"
              formControlName="lowStockThreshold"
              min="1"
              placeholder="10"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <!-- Description -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description & Specifications
            </label>
            <textarea
              formControlName="description"
              rows="3"
              placeholder="Provide technical specifications, dimensions, warranty, etc."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            ></textarea>
          </div>

          <!-- Product Image URL / File Upload -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Product Image (Optional)
            </label>
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                formControlName="imageUrl"
                placeholder="Paste image URL or choose file"
                class="flex-1 w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <input
                #fileInput
                type="file"
                (change)="onFileSelected($event)"
                accept="image/*"
                class="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            (click)="onCancel()"
            class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="productForm.invalid || isSubmitting()"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            @if (isSubmitting()) {
              <span>Saving...</span>
            } @else {
              <span>{{ product() ? 'Update Product' : 'Save Product' }}</span>
            }
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);

  isOpen = input<boolean>(false);
  product = input<Product | null>(null);

  close = output<void>();
  saved = output<Product>();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  categories = signal<Category[]>([]);
  isSubmitting = signal<boolean>(false);
  selectedFile: File | null = null;

  productForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    sku: ['', [Validators.required, Validators.maxLength(30)]],
    category: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
    supplierName: ['', [Validators.required, Validators.maxLength(100)]],
    lowStockThreshold: [10, [Validators.min(1)]],
    description: [''],
    imageUrl: ['']
  });

  get f() {
    return this.productForm.controls;
  }

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const currentProduct = this.product();

      if (open) {
        if (untracked(() => this.categories().length) === 0) {
          this.loadCategories();
        }
        if (currentProduct) {
          this.populateForm(currentProduct);
        } else {
          this.resetForm();
        }
      } else {
        this.resetForm();
      }
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        if (res.categories) {
          this.categories.set(res.categories);
          const currentProd = this.product();
          if (currentProd) {
            const catId = typeof currentProd.category === 'object' && currentProd.category !== null
              ? (currentProd.category as any)._id
              : (currentProd.category || '');
            if (catId && this.productForm.get('category')?.value !== catId) {
              this.productForm.patchValue({ category: catId });
            }
          }
        }
      }
    });
  }

  populateForm(p: Product) {
    const catId = typeof p.category === 'object' && p.category !== null ? (p.category as any)._id : (p.category || '');
    this.productForm.patchValue({
      name: p.name || '',
      sku: p.sku || '',
      category: catId || '',
      quantity: p.quantity ?? 0,
      unitPrice: p.unitPrice ?? 0,
      supplierName: p.supplierName || '',
      lowStockThreshold: p.lowStockThreshold ?? 10,
      description: p.description || '',
      imageUrl: p.imageUrl || ''
    });
    this.selectedFile = null;
    const fileEl = this.fileInput()?.nativeElement;
    if (fileEl) {
      fileEl.value = '';
    }
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
  }

  resetForm() {
    this.productForm.reset({
      name: '',
      sku: '',
      category: '',
      quantity: 0,
      unitPrice: 0,
      supplierName: '',
      lowStockThreshold: 10,
      description: '',
      imageUrl: ''
    });
    this.selectedFile = null;
    const fileEl = this.fileInput()?.nativeElement;
    if (fileEl) {
      fileEl.value = '';
    }
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
  }

  onCancel() {
    this.resetForm();
    this.close.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.productForm.value;

    const formData = new FormData();
    formData.append('name', formVal.name!);
    formData.append('sku', formVal.sku!);
    formData.append('category', formVal.category!);
    formData.append('quantity', (formVal.quantity ?? 0).toString());
    formData.append('unitPrice', (formVal.unitPrice ?? 0).toString());
    formData.append('supplierName', formVal.supplierName!);
    formData.append('lowStockThreshold', (formVal.lowStockThreshold ?? 10).toString());
    formData.append('description', formVal.description || '');

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    } else if (formVal.imageUrl) {
      formData.append('imageUrl', formVal.imageUrl);
    }

    const currentProd = this.product();
    if (currentProd) {
      this.productService.updateProduct(currentProd._id, formData).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.toastService.success(res.message || 'Product updated successfully');
          this.resetForm();
          this.saved.emit(res.product!);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err.error?.message || 'Failed to update product';
          this.toastService.error(msg);
        }
      });
    } else {
      this.productService.createProduct(formData).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.toastService.success(res.message || 'Product created successfully');
          this.resetForm();
          this.saved.emit(res.product!);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err.error?.message || 'Failed to create product';
          this.toastService.error(msg);
        }
      });
    }
  }
}
