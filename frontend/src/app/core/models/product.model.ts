import { Category } from './category.model';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: Category | string;
  description?: string;
  quantity: number;
  unitPrice: number;
  supplierName: string;
  lowStockThreshold: number;
  status: StockStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  success: boolean;
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  products: Product[];
}

export interface ProductResponse {
  success: boolean;
  product?: Product;
  message?: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
