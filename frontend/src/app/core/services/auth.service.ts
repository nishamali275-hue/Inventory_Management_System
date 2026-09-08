import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'http://localhost:5000/api/auth';
  private readonly TOKEN_KEY = 'inventory_token';
  private readonly USER_KEY = 'inventory_user';

  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  register(userData: { name: string; email: string; password: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData).pipe(
      tap((res) => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  private setSession(token: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }

  loadProfile(): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(`${this.API_URL}/me`).pipe(
      tap((res) => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        }
      })
    );
  }
}
