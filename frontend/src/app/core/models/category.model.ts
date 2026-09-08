export interface Category {
  _id: string;
  name: string;
  description?: string;
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryResponse {
  success: boolean;
  count?: number;
  categories?: Category[];
  category?: Category;
  message?: string;
}
