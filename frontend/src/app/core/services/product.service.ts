import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product,
  ProductListResponse,
  ProductResponse,
  ProductQueryParams
} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:5000/api/products';

  getProducts(queryParams?: ProductQueryParams): Observable<ProductListResponse> {
    let params = new HttpParams();

    if (queryParams) {
      if (queryParams.page) params = params.set('page', queryParams.page.toString());
      if (queryParams.limit) params = params.set('limit', queryParams.limit.toString());
      if (queryParams.search) params = params.set('search', queryParams.search);
      if (queryParams.category) params = params.set('category', queryParams.category);
      if (queryParams.status) params = params.set('status', queryParams.status);
      if (queryParams.sortBy) params = params.set('sortBy', queryParams.sortBy);
      if (queryParams.sortOrder) params = params.set('sortOrder', queryParams.sortOrder);
    }

    return this.http.get<ProductListResponse>(this.API_URL, { params });
  }

  getProductById(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.API_URL}/${id}`);
  }

  createProduct(data: FormData | Partial<Product>): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.API_URL, data);
  }

  updateProduct(id: string, data: FormData | Partial<Product>): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.API_URL}/${id}`, data);
  }

  deleteProduct(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${id}`);
  }

  getProductQrCode(id: string): Observable<{ success: boolean; sku: string; productName: string; qrCode: string }> {
    return this.http.get<{ success: boolean; sku: string; productName: string; qrCode: string }>(
      `${this.API_URL}/${id}/qrcode`
    );
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.API_URL}/export/csv`, {
      responseType: 'blob'
    });
  }

  importCsv(formData: FormData): Observable<{ success: boolean; message: string; importedCount: number; errors: string[] }> {
    return this.http.post<{ success: boolean; message: string; importedCount: number; errors: string[] }>(
      `${this.API_URL}/import/csv`,
      formData
    );
  }
}
