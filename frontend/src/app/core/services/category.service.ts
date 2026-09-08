import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryResponse } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:5000/api/categories';

  getCategories(): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(this.API_URL);
  }

  getCategoryById(id: string): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.API_URL}/${id}`);
  }

  createCategory(data: { name: string; description?: string }): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.API_URL, data);
  }

  updateCategory(id: string, data: { name: string; description?: string }): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.API_URL}/${id}`, data);
  }

  deleteCategory(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${id}`);
  }
}
