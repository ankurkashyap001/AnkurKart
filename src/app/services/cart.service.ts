import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Cart } from '../models/cart.model';
import { catchError, of, tap } from 'rxjs';

export interface Coupon {
  code: string;
  discountAmount: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private apiUrl = 'http://localhost:8000/api/cart';
  private couponApiUrl = 'http://localhost:8000/api/coupons/apply';

  private defaultCart: Cart = { items: [], subtotal: 0, delivery_fee: 0, total: 0 };

  cart = signal<Cart>(this.defaultCart);
  isDrawerOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  appliedCoupon = signal<Coupon | null>(null);
  couponError = signal<string | null>(null);
  isCouponLoading = signal<boolean>(false);

  // Track last subtotal to prevent infinite loop
  private lastValidatedSubtotal = 0;

  cartCount = computed(() =>
    (this.cart()?.items || []).reduce((sum, item) => sum + (item?.quantity || 0), 0)
  );

  subtotal = computed(() =>
    (this.cart()?.items || []).reduce((sum, item) => sum + ((item?.sale_price || item?.price || 0) * (item?.quantity || 0)), 0)
  );

  deliveryFee = computed(() => {
    const total = this.subtotal();
    if (total === 0) return 0;
    if (this.appliedCoupon()?.code === 'FREESHIP') return 0;
    return total >= 499 ? 0 : 25;
  });

  discountTotal = computed(() => this.appliedCoupon()?.discountAmount || 0);

  grandTotal = computed(() => {
    const total = this.subtotal() + this.deliveryFee() - this.discountTotal();
    return Math.max(0, total);
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCart();

      // Infinite loop-safe effect
      effect(() => {
        const currentSubtotal = this.subtotal();
        const activeCoupon = this.appliedCoupon();

        if (activeCoupon && currentSubtotal > 0 && currentSubtotal !== this.lastValidatedSubtotal) {
          this.lastValidatedSubtotal = currentSubtotal;
          this.revalidateCoupon(activeCoupon.code, currentSubtotal);
        } else if (activeCoupon && currentSubtotal === 0) {
          this.removeCoupon();
        }
      }, { allowSignalWrites: true });
    }
  }

  private getHeaders() {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('auth_token');
    }
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token ?? ''}`,
        'Accept': 'application/json'
      })
    };
  }

  private formatCartResponse(res: any): Cart {
    if (!res) return this.defaultCart;
    const cartData = res.data || res;
    const rawItems = cartData?.items || [];
  
    const formattedItems = Array.isArray(rawItems) ? rawItems.map((item: any) => ({
      id: Number(item.item_id || item.id),
      product_id: Number(item.product_id),
      title: item.title || '',
      primary_image: item.image_url || item.primary_image || '',
      sale_price: Number(item.price || item.sale_price || 0),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      stock_limit: Number(item.stock_available || item.stock_limit || 10),
      unit: item.unit || '1 unit'
    })) : [];
  
    const calculatedSubtotal = cartData?.total_amount ?? cartData?.subtotal ?? 0;
  
    return {
      items: formattedItems,
      subtotal: calculatedSubtotal,
      delivery_fee: 0,
      total: calculatedSubtotal
    };
  }

  openDrawer() { this.isDrawerOpen.set(true); }
  closeDrawer() { this.isDrawerOpen.set(false); }

  loadCart() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLoading.set(true);
    this.http.get<any>(this.apiUrl, this.getHeaders()).pipe(
      tap(res => {
        this.cart.set(this.formatCartResponse(res));
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.cart.set(this.defaultCart);
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe();
  }

  addToCart(productOrId: any, quantity: number = 1) {
    const productId = typeof productOrId === 'object' ? (productOrId?.id || productOrId?.product_id) : productOrId;
    if (!productId) return;

    this.openDrawer();
    this.http.post<any>(`${this.apiUrl}/add`, { product_id: productId, quantity }, this.getHeaders()).pipe(
      tap(updatedCart => this.cart.set(this.formatCartResponse(updatedCart))),
      catchError(() => {
        this.loadCart();
        return of(null);
      })
    ).subscribe();
  }

  updateQuantity(cartItemId: number, newQty: number, stockLimit: number = 10) {
    const itemId = Number(cartItemId);
    if (!itemId || isNaN(itemId)) return;

    if (newQty <= 0) {
      this.removeItem(itemId);
      return;
    }

    const updatedItems = (this.cart()?.items || []).map(item =>
      item.id === itemId ? { ...item, quantity: newQty } : item
    );
    this.cart.update(c => ({ ...(c || this.defaultCart), items: updatedItems }));

    this.http.put<any>(`${this.apiUrl}/items/${itemId}`, { quantity: newQty }, this.getHeaders()).pipe(
      tap(serverCart => this.cart.set(this.formatCartResponse(serverCart))),
      catchError(() => {
        this.loadCart();
        return of(null);
      })
    ).subscribe();
  }

  removeItem(cartItemId: number) {
    const itemId = Number(cartItemId);
    if (!itemId || isNaN(itemId)) return;

    const updatedItems = (this.cart()?.items || []).filter(item => item.id !== itemId);
    this.cart.update(c => ({ ...(c || this.defaultCart), items: updatedItems }));

    this.http.delete<any>(`${this.apiUrl}/items/${itemId}`, this.getHeaders()).pipe(
      tap(serverCart => this.cart.set(this.formatCartResponse(serverCart))),
      catchError(() => {
        this.loadCart();
        return of(null);
      })
    ).subscribe();
  }

  clearCart() {
    this.cart.set(this.defaultCart);
    this.removeCoupon();
    this.http.delete(`${this.apiUrl}/clear`, this.getHeaders()).subscribe();
  }

  // ================= COUPON ENGINE FIX ================= //

  applyCoupon(code: any) {
    // Force string conversion to fix "The code field must be a string"
    const stringCode = typeof code === 'string' ? code : (code?.code || String(code || ''));
    const cleanCode = stringCode.trim().toUpperCase();

    if (!cleanCode) {
      this.couponError.set('Please enter a valid promo code.');
      return;
    }

    if (this.subtotal() <= 0) {
      this.couponError.set('Cart is empty.');
      return;
    }

    this.isCouponLoading.set(true);
    this.couponError.set(null);

    const payload = {
      code: cleanCode,
      cart_subtotal: this.subtotal()
    };

    this.http.post<any>(this.couponApiUrl, payload, this.getHeaders()).subscribe({
      next: (res: any) => {
        this.isCouponLoading.set(false);
        if (res.valid || res.success) {
          this.lastValidatedSubtotal = this.subtotal();
          this.appliedCoupon.set({
            code: res.code || cleanCode,
            discountAmount: Number(res.discount_amount || res.discount || 0),
            message: res.message || 'Coupon applied!'
          });
          this.couponError.set(null);
        } else {
          this.couponError.set(res.message || 'Invalid promo code.');
        }
      },
      error: (err: any) => {
        this.isCouponLoading.set(false);
        this.couponError.set(err.error?.message || 'Failed to apply coupon.');
      }
    });
  }

  private revalidateCoupon(code: string, currentSubtotal: number) {
    const stringCode = String(code).trim().toUpperCase();
    const payload = { code: stringCode, cart_subtotal: currentSubtotal };

    this.http.post<any>(this.couponApiUrl, payload, this.getHeaders()).subscribe({
      next: (res: any) => {
        if (res.valid || res.success) {
          this.appliedCoupon.set({
            code: res.code || stringCode,
            discountAmount: Number(res.discount_amount || res.discount || 0),
            message: res.message
          });
        } else {
          this.removeCoupon();
          this.couponError.set(`Coupon '${stringCode}' removed: ${res.message || 'Criteria not met.'}`);
        }
      },
      error: () => {
        this.removeCoupon();
      }
    });
  }

  removeCoupon() {
    this.appliedCoupon.set(null);
    this.couponError.set(null);
    this.lastValidatedSubtotal = 0;
  }
}