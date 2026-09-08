import { Product } from './product.model';
import { User } from './user.model';

export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryTransaction {
  _id: string;
  product: Product | { _id: string; name: string; sku: string; imageUrl?: string };
  type: TransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  performedBy: User | { _id: string; name: string; email?: string; role?: string };
  createdAt: string;
}

export interface TransactionListResponse {
  success: boolean;
  total: number;
  totalPages: number;
  currentPage: number;
  transactions: InventoryTransaction[];
}

export interface StockOperationResponse {
  success: boolean;
  message: string;
  product?: Product;
  transaction?: InventoryTransaction;
}
