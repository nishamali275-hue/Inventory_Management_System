import { InventoryTransaction } from './inventory.model';
import { Product } from './product.model';

export interface DashboardKpis {
  totalProducts: number;
  totalCategories: number;
  totalStockQuantity: number;
  totalInventoryValue: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockStatusDistributionItem {
  status: string;
  count: number;
  color: string;
}

export interface CategoryDistributionItem {
  _id: string;
  categoryName: string;
  productCount: number;
  totalStock: number;
  categoryValue: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  stockStatusDistribution: StockStatusDistributionItem[];
  categoryDistribution: CategoryDistributionItem[];
  recentTransactions: InventoryTransaction[];
  lowStockAlerts: Product[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}
