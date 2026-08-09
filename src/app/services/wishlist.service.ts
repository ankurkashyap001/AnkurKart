import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  private authService = inject(Auth);
  private apiUrl = 'http://localhost:8000/api/wishlist';

  // Reactive State Signals
  wishlistItems = signal<any[]>([]);
  wishlistIds = signal<number[]>([]);
  isLoading = signal<boolean>(false);

  // Computed Properties
  wishlistCount = computed(() => this.wishlistItems().length || this.wishlistIds().length);

  constructor() {
    if (this.authService.isLoggedInSignal()) {
      this.loadWishlist();
    }
  }

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      headers: new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      })
    };
  }

  loadWishlist() {
    if (!this.authService.isLoggedInSignal()) return;
    this.isLoading.set(true);

    this.http.get<any>(this.apiUrl, this.getHeaders()).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.data || []);
        this.wishlistItems.set(items);
        this.wishlistIds.set(items.map((item: any) => item.id || item.product_id));
        this.isLoading.set(false);
      },
      error: () => {
        this.wishlistItems.set([]);
        this.wishlistIds.set([]);
        this.isLoading.set(false);
      }
    });
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistIds().includes(Number(productId));
  }

  toggleWishlist(product: any) {
    if (!this.authService.isLoggedInSignal()) {
      this.authService.openAuthModal();
      return;
    }

    const targetId = Number(product.id || product.product_id);
    const currentlyInWishlist = this.isInWishlist(targetId);

    // 1. Zero-latency Optimistic Signal Update
    if (currentlyInWishlist) {
      this.wishlistIds.update(ids => ids.filter(id => id !== targetId));
      this.wishlistItems.update(items => items.filter(item => Number(item.id || item.product_id) !== targetId));
    } else {
      this.wishlistIds.update(ids => [...ids, targetId]);
      this.wishlistItems.update(items => [...items, product]);
    }

    // 2. Backend Sync API Call
    this.http.post<any>(`${this.apiUrl}/toggle`, { product_id: targetId }, this.getHeaders()).pipe(
      catchError((err) => {
        console.error('Wishlist toggle error:', err);
        // Rollback state if API fails
        this.loadWishlist();
        return of(null);
      })
    ).subscribe();
  }

  removeFromWishlist(productId: number) {
    this.toggleWishlist({ id: productId });
  }
}