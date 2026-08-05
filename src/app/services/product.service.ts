// src/app/services/product.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Product, ProductsResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);

  getProducts(): Observable<Product[]> {
    return this.api.get<ProductsResponse>('products').pipe(
      map(res => res.data || [])
    );
  }
}