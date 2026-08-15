// src/app/pages/home/home.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { SalesCategory } from '../../models/category.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  public cartService = inject(CartService);
  public wishlistService = inject(WishlistService);
  
  Math = Math;

  // Category Signals
  categories = signal<any[]>([]);
  isCategoriesLoading = signal<boolean>(true);
  categoriesError = signal<string | null>(null);

  // Product Signals
  products = signal<Product[]>([]);
  isProductsLoading = signal<boolean>(true);
  productsError = signal<string | null>(null);

  // Fallback image path
  defaultImage = 'https://placehold.co/150x150/eef2ff/6f42c1?text=AnkurCart';

  // Soft pastel background palette for Quick-Commerce category icons
  private bgColors = [
    '#EBFBF0', '#FFF5E5', '#F1F5FD', '#FFF0F0', '#F3E8FF', '#E6FFFA', '#FFF9E6'
  ];

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchProducts();
  }

  fetchCategories(): void {
    this.isCategoriesLoading.set(true);
    this.categoriesError.set(null);

    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        // Handles both direct array and wrapped response structures safely
        const data = Array.isArray(res) ? res : (res?.data || []);
        this.categories.set(data);
        this.isCategoriesLoading.set(false);
      },
      error: (err: Error) => {
        this.categoriesError.set(err.message || 'Categories fetch nahi ho saki.');
        this.isCategoriesLoading.set(false);
      }
    });
  }

  fetchProducts(): void {
    this.isProductsLoading.set(true);
    this.productsError.set(null);

    this.productService.getProducts().subscribe({
      next: (data: Product[]) => {
        this.products.set(data);
        this.isProductsLoading.set(false);
      },
      error: (err: Error) => {
        this.productsError.set(err.message || 'Products fetch nahi ho sake.');
        this.isProductsLoading.set(false);
      }
    });
  }

  getBgColor(index: number): string {
    return this.bgColors[index % this.bgColors.length];
  }

  getCartQuantity(productId: number): number {
    const cartItems = this.cartService.cart()?.items || [];
    const item = cartItems.find((i: any) => i.product_id === productId);
    return item ? item.quantity : 0;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultImage;
  }
}