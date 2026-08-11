import { Injectable, inject, signal, computed, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { Auth } from './auth';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  private authService = inject(Auth);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  
  private apiUrl = 'http://localhost:8000/api/wishlist';

  // Reactive State Signals
  wishlistItems = signal<any[]>([]);
  wishlistIds = signal<number[]>([]);
  isLoading = signal<boolean>(false);

  // Computed Properties
  wishlistCount = computed(() => this.wishlistItems().length || this.wishlistIds().length);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // User login/logout hote hi state auto-sync hogi
      effect(() => {
        if (this.authService.isLoggedInSignal()) {
          this.loadWishlist();
        } else {
          this.wishlistItems.set([]);
          this.wishlistIds.set([]);
        }
      },);
    }
  }

  private getHeaders() {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('auth_token');
    }
    return {
      headers: new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      })
    };
  }

  loadWishlist() {
    if (!isPlatformBrowser(this.platformId) || !this.authService.isLoggedInSignal()) return;
    this.isLoading.set(true);

    this.http.get<any>(this.apiUrl, this.getHeaders()).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.data || []);
        this.wishlistItems.set(items);
        this.wishlistIds.set(items.map((item: any) => Number(item.id || item.product_id)));
        this.isLoading.set(false);
      },
      error: () => {
        this.wishlistItems.set([]);
        this.wishlistIds.set([]);
        this.isLoading.set(false);
      }
    });
  }

  isInWishlist(productId: number | string): boolean {
    return this.wishlistIds().includes(Number(productId));
  }

  toggleWishlist(product: any) {
    // 1. Auth Check FIRST
    if (!this.authService.isLoggedInSignal()) {
      this.authService.openAuthModal();
      this.toastService.info('Please login to manage your wishlist');
      return;
    }

    // 2. Safe ID Normalization
    const targetId = Number(product.id || product.product_id);
    if (!targetId || isNaN(targetId)) return;

    const currentlyInWishlist = this.isInWishlist(targetId);

    // 3. Trigger Toast ONLY after verifying auth
    if (currentlyInWishlist) {
      this.toastService.info('Removed from Wishlist');
    } else {
      this.toastService.success('Added to Wishlist ❤️');
    }

    // 4. Zero-latency Optimistic Signal Update
    if (currentlyInWishlist) {
      this.wishlistIds.update(ids => ids.filter(id => id !== targetId));
      this.wishlistItems.update(items => items.filter(item => Number(item.id || item.product_id) !== targetId));
    } else {
      this.wishlistIds.update(ids => [...ids, targetId]);
      this.wishlistItems.update(items => [...items, product]);
    }

    // 5. Backend Sync API Call
    this.http.post<any>(`${this.apiUrl}/toggle`, { product_id: targetId }, this.getHeaders()).pipe(
      catchError((err) => {
        console.error('Wishlist toggle error:', err);
        this.toastService.error('Failed to update wishlist on server');
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