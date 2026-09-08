import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TransactionListResponse,
  StockOperationResponse
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:5000/api/inventory';

  stockIn(productId: string, quantity: number, reason?: string): Observable<StockOperationResponse> {
    return this.http.post<StockOperationResponse>(`${this.API_URL}/stock-in`, {
      productId,
      quantity,
      reason
    });
  }

  stockOut(productId: string, quantity: number, reason?: string): Observable<StockOperationResponse> {
    return this.http.post<StockOperationResponse>(`${this.API_URL}/stock-out`, {
      productId,
      quantity,
      reason
    });
  }

  adjustStock(productId: string, targetQuantity: number, reason?: string): Observable<StockOperationResponse> {
    return this.http.post<StockOperationResponse>(`${this.API_URL}/adjust`, {
      productId,
      targetQuantity,
      reason
    });
  }

  getTransactions(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    type?: string;
  }): Observable<TransactionListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.productId) httpParams = httpParams.set('productId', params.productId);
      if (params.type) httpParams = httpParams.set('type', params.type);
    }

    return this.http.get<TransactionListResponse>(`${this.API_URL}/transactions`, {
      params: httpParams
    });
  }
}
