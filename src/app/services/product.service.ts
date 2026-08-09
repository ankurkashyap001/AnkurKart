import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Product, ProductsResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);

  // Get all products
  getProducts(): Observable<Product[]> {
    return this.api.get<ProductsResponse>('products').pipe(
      map(res => res.data || [])
    );
  }

  // Get single product details by ID or Slug
  getProductById(id: number | string): Observable<Product> {
    return this.api.get<any>(`products/${id}`).pipe(
      map(res => res.data || res)
    );
  }
}