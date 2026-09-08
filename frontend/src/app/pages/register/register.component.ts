import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icons/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IconComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 relative">
      <!-- Dark mode toggle -->
      <button
        type="button"
        (click)="themeService.toggleTheme()"
        class="absolute top-4 right-4 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        @if (themeService.isDarkMode()) {
          <app-icon name="sun" customClass="w-5 h-5 text-amber-400" />
        } @else {
          <app-icon name="moon" customClass="w-5 h-5 text-indigo-600" />
        }
      </button>

      <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 transition-all">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white shadow-lg mb-3">
            <app-icon name="user" customClass="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Create Account
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Join RED Inventory Management Platform
          </p>
        </div>

        <!-- Register Form -->
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Alex Morgan"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              [ngClass]="{ 'border-rose-500': f['name'].touched && f['name'].invalid }"
            />
            @if (f['name'].touched && f['name'].errors?.['required']) {
              <p class="text-xs text-rose-500 mt-1">Full name is required</p>
            }
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="alex@company.com"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              [ngClass]="{ 'border-rose-500': f['email'].touched && f['email'].invalid }"
            />
            @if (f['email'].touched && f['email'].errors?.['required']) {
              <p class="text-xs text-rose-500 mt-1">Email is required</p>
            }
            @if (f['email'].touched && f['email'].errors?.['email']) {
              <p class="text-xs text-rose-500 mt-1">Please enter a valid email</p>
            }
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              formControlName="password"
              placeholder="Min 6 characters"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              [ngClass]="{ 'border-rose-500': f['password'].touched && f['password'].invalid }"
            />
            @if (f['password'].touched && f['password'].errors?.['required']) {
              <p class="text-xs text-rose-500 mt-1">Password is required</p>
            }
            @if (f['password'].touched && f['password'].errors?.['minlength']) {
              <p class="text-xs text-rose-500 mt-1">Password must be at least 6 characters</p>
            }
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Assign System Role
            </label>
            <select
              formControlName="role"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="user">Staff Member (View & Stock Operations)</option>
              <option value="admin">Administrator (Full Access & Product CRUD)</option>
            </select>
          </div>

          <button
            type="submit"
            [disabled]="registerForm.invalid || isLoading()"
            class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            @if (isLoading()) {
              <span class="animate-spin text-lg">⟳</span>
              <span>Registering...</span>
            } @else {
              <span>Create Account</span>
              <app-icon name="chevron-right" customClass="w-4 h-4" />
            }
          </button>
        </form>

        <!-- Footer -->
        <p class="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Already registered?
          <a routerLink="/login" class="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign In here
          </a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['user', [Validators.required]]
  });

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formVal = this.registerForm.value;

    this.authService
      .register({
        name: formVal.name!,
        email: formVal.email!,
        password: formVal.password!,
        role: formVal.role!
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.toastService.success(`Welcome, ${res.user.name}! Your account is ready.`);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.message || 'Registration failed. Please try again.';
          this.toastService.error(msg);
        }
      });
  }
}
