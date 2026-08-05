// src/app/models/product.model.ts

import { SalesCategory } from './category.model';

export interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number;
  discount_percentage: number;
  stock_quantity: number;
  in_stock: boolean;
  sku: string;
  prescription_required: boolean;
  categories: SalesCategory[];
  images: ProductImage[];
  primary_image: string;
  created_at: string;
}

export interface ProductsResponse {
  data: Product[];
  links?: Record<string, string | null>;
  meta?: Record<string, unknown>;
}