// src/app/pages/home/home.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { SalesCategory } from '../../models/category.model';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';

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
  // CartService Inject yahan karein
  cartService = inject(CartService);
  // Wishlist
  public wishlistService = inject(WishlistService);
  Math = Math;

  // Category Signals
  categories = signal<SalesCategory[]>([]);
  isCategoriesLoading = signal<boolean>(true);
  categoriesError = signal<string | null>(null);

  // Product Signals
  products = signal<Product[]>([]);
  isProductsLoading = signal<boolean>(true);
  productsError = signal<string | null>(null);

  // Fallback image path
  // defaultImage = 'assets/images/category-placeholder.png';
  defaultImage = 'https://placehold.co/150x150/eef2ff/6f42c1?text=AnkurCart';

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchProducts();
  }

  fetchCategories(): void {
    this.isCategoriesLoading.set(true);
    this.categoriesError.set(null);

    this.categoryService.getCategories().subscribe({
      next: (data: SalesCategory[]) => {
        this.categories.set(data);
        this.isCategoriesLoading.set(false);
      },
      error: (err: Error) => {
        this.categoriesError.set(err.message || 'Categories fetch nahi ho saki.');
        this.isCategoriesLoading.set(false);
      }
    });
  }

  getCartQuantity(productId: number): number {
    const cartItems = this.cartService.cart()?.items || [];
    const item = cartItems.find((i: any) => i.product_id === productId);
    return item ? item.quantity : 0;
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

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultImage;
  }
}