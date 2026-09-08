import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../core/models/category.model';
import { IconComponent } from '../../shared/components/icons/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, ModalComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Category Management
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize products into hierarchical inventory divisions and departments
          </p>
        </div>

        @if (authService.isAdmin()) {
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <app-icon name="plus" customClass="w-4 h-4" />
            <span>Add Category</span>
          </button>
        }
      </div>

      <!-- Categories Table Card -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        @if (isLoading()) {
          <div class="py-24 text-center">
            <span class="animate-spin text-3xl text-indigo-600 inline-block mb-3">⟳</span>
            <p class="text-xs font-medium text-slate-500">Loading categories...</p>
          </div>
        } @else if (categories().length === 0) {
          <div class="py-20 text-center text-slate-400 text-xs">
            No categories registered. Click "Add Category" above to create one.
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="py-3.5 px-5">Category Name</th>
                  <th class="py-3.5 px-5">Description</th>
                  <th class="py-3.5 px-5">Assigned Products</th>
                  <th class="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (cat of categories(); track cat._id) {
                  <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td class="py-4 px-5">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                          {{ cat.name.charAt(0) }}
                        </div>
                        <div>
                          <span class="font-bold text-slate-900 dark:text-white text-sm">{{ cat.name }}</span>
                        </div>
                      </div>
                    </td>

                    <td class="py-4 px-5 text-slate-500 dark:text-slate-400 max-w-md">
                      {{ cat.description || 'No description provided' }}
                    </td>

                    <td class="py-4 px-5">
                      <span class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {{ cat.productsCount || 0 }} products
                      </span>
                    </td>

                    <td class="py-4 px-5 text-right">
                      @if (authService.isAdmin()) {
                        <div class="inline-flex items-center gap-1.5">
                          <button
                            (click)="openEditModal(cat)"
                            class="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                            title="Edit Category"
                          >
                            <app-icon name="edit" customClass="w-4 h-4" />
                          </button>
                          <button
                            (click)="promptDelete(cat)"
                            class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                            title="Delete Category"
                          >
                            <app-icon name="trash" customClass="w-4 h-4" />
                          </button>
                        </div>
                      } @else {
                        <span class="text-[11px] text-slate-400">View Only</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Add / Edit Modal -->
      <app-modal
        [isOpen]="isFormModalOpen()"
        [title]="selectedCategory() ? 'Edit Category' : 'Create New Category'"
        (close)="isFormModalOpen.set(false)"
        customWidth="max-w-md"
      >
        <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Category Name *
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Industrial Automation"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [ngClass]="{ 'border-rose-500': f['name'].touched && f['name'].invalid }"
            />
            @if (f['name'].touched && f['name'].errors?.['required']) {
              <p class="text-xs text-rose-500 mt-1">Category name is required</p>
            }
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              formControlName="description"
              rows="3"
              placeholder="Brief summary of items in this category"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              (click)="isFormModalOpen.set(false)"
              class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="categoryForm.invalid || isSubmitting()"
              class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              @if (isSubmitting()) {
                <span>Saving...</span>
              } @else {
                <span>{{ selectedCategory() ? 'Update Category' : 'Create Category' }}</span>
              }
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Delete Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Delete Category"
        [message]="'Are you sure you want to delete category ' + (categoryToDelete()?.name || '') + '?'"
        detail="You can only delete categories that contain 0 products."
        confirmButtonText="Delete Category"
        (confirm)="confirmDelete()"
        (cancel)="isDeleteDialogOpen.set(false)"
      />
    </div>
  `
})
export class CategoryListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  isFormModalOpen = signal<boolean>(false);
  selectedCategory = signal<Category | null>(null);

  isDeleteDialogOpen = signal<boolean>(false);
  categoryToDelete = signal<Category | null>(null);

  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['']
  });

  get f() {
    return this.categoryForm.controls;
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.categories) {
          this.categories.set(res.categories);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal() {
    this.selectedCategory.set(null);
    this.categoryForm.reset({ name: '', description: '' });
    this.isFormModalOpen.set(true);
  }

  openEditModal(cat: Category) {
    this.selectedCategory.set(cat);
    this.categoryForm.patchValue({
      name: cat.name,
      description: cat.description || ''
    });
    this.isFormModalOpen.set(true);
  }

  onSubmit() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.categoryForm.value;
    const cat = this.selectedCategory();

    if (cat) {
      this.categoryService.updateCategory(cat._id, { name: val.name!, description: val.description || '' }).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.isFormModalOpen.set(false);
          this.toastService.success(res.message || 'Category updated');
          this.loadCategories();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(err.error?.message || 'Update failed');
        }
      });
    } else {
      this.categoryService.createCategory({ name: val.name!, description: val.description || '' }).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.isFormModalOpen.set(false);
          this.toastService.success(res.message || 'Category created');
          this.loadCategories();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(err.error?.message || 'Creation failed');
        }
      });
    }
  }

  promptDelete(cat: Category) {
    if ((cat.productsCount || 0) > 0) {
      this.toastService.warning(
        `Cannot delete '${cat.name}' because it contains ${cat.productsCount} product(s). Please reassign them first.`
      );
      return;
    }
    this.categoryToDelete.set(cat);
    this.isDeleteDialogOpen.set(true);
  }

  confirmDelete() {
    const cat = this.categoryToDelete();
    if (!cat) return;

    this.categoryService.deleteCategory(cat._id).subscribe({
      next: (res) => {
        this.isDeleteDialogOpen.set(false);
        this.toastService.success(res.message);
        this.loadCategories();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Delete failed');
      }
    });
  }
}
