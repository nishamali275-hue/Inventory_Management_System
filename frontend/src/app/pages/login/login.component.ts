import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icons/icon.component';

@Component({
  selector: 'app-login',
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
            <app-icon name="box" customClass="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            RED <span class="text-rose-600">INVENTORY</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Stock & Inventory Control System
          </p>
        </div>

        <!-- Quick Demo Accounts -->
        <div class="mb-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <app-icon name="shield" customClass="w-3.5 h-3.5 text-indigo-500" />
            <span>One-Click Demo Accounts:</span>
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="fillDemo('admin')"
              class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-rose-400 text-slate-800 dark:text-slate-200 text-xs font-semibold text-left transition shadow-xs"
            >
              <div class="text-rose-600 dark:text-rose-400 text-[11px] font-bold">Admin Role</div>
              <div class="text-[10px] text-slate-500 truncate">admin&#64;example.com</div>
            </button>
            <button
              type="button"
              (click)="fillDemo('user')"
              class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-400 text-slate-800 dark:text-slate-200 text-xs font-semibold text-left transition shadow-xs"
            >
              <div class="text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">Staff Role</div>
              <div class="text-[10px] text-slate-500 truncate">user&#64;example.com</div>
            </button>
          </div>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="name@company.com"
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
              placeholder="••••••••"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              [ngClass]="{ 'border-rose-500': f['password'].touched && f['password'].invalid }"
            />
            @if (f['password'].touched && f['password'].errors?.['required']) {
              <p class="text-xs text-rose-500 mt-1">Password is required</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            @if (isLoading()) {
              <span class="animate-spin text-lg">⟳</span>
              <span>Authenticating...</span>
            } @else {
              <span>Sign In to Dashboard</span>
              <app-icon name="chevron-right" customClass="w-4 h-4" />
            }
          </button>
        </form>

        <!-- Footer -->
        <p class="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Don't have an account?
          <a routerLink="/register" class="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Register now
          </a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal<boolean>(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  get f() {
    return this.loginForm.controls;
  }

  fillDemo(role: 'admin' | 'user') {
    if (role === 'admin') {
      this.loginForm.setValue({
        email: 'admin@example.com',
        password: 'Admin@123'
      });
    } else {
      this.loginForm.setValue({
        email: 'user@example.com',
        password: 'User@123'
      });
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastService.success(`Welcome back, ${res.user.name}!`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Invalid email or password';
        this.toastService.error(msg);
      }
    });
  }
}
