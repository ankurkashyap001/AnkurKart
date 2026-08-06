import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Cart, CartItem } from '../models/cart.model';
import { catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private apiUrl = 'http://localhost:8000/api/cart';

  // Default Empty Cart Structure
  private defaultCart: Cart = { items: [], subtotal: 0, delivery_fee: 0, total: 0 };

  // State Signals
  cart = signal<Cart>(this.defaultCart);
  isDrawerOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // Safe Computed Signals (Safe against null / undefined items)
  cartCount = computed(() =>
    (this.cart()?.items || []).reduce((sum, item) => sum + (item?.quantity || 0), 0)
  );

  subtotal = computed(() =>
    (this.cart()?.items || []).reduce((sum, item) => sum + ((item?.sale_price || item?.price || 0) * (item?.quantity || 0)), 0)
  );

  deliveryFee = computed(() => {
    const total = this.subtotal();
    if (total === 0) return 0;
    return total >= 499 ? 0 : 25;
  });

  grandTotal = computed(() => this.subtotal() + this.deliveryFee());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCart();
    }
  }

  // Safe Headers Generator
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

  // 1. Updated formatCartResponse (ID Normalize karega)
  private formatCartResponse(res: any): Cart {
    if (!res) return this.defaultCart;
    
    const rawItems = res?.items ?? res?.cart?.items ?? res?.data?.items ?? [];
    
    const formattedItems = Array.isArray(rawItems) ? rawItems.map((item: any) => ({
      ...item,
      // Backend id, cart_item_id ya product_id me se valid Number extract karein
      id: Number(item.id || item.cart_item_id || item.item_id || item.product_id),
      product_id: Number(item.product_id || item.id),
      sale_price: Number(item.sale_price || item.price || 0),
      price: Number(item.price || item.sale_price || 0),
      quantity: Number(item.quantity || 1),
      stock_limit: Number(item.stock_limit || item.stock || 10)
    })) : [];

    return {
      items: formattedItems,
      subtotal: res?.subtotal ?? 0,
      delivery_fee: res?.delivery_fee ?? 0,
      total: res?.total ?? 0
    };
  }

  // Drawer Controls
  openDrawer() { this.isDrawerOpen.set(true); }
  closeDrawer() { this.isDrawerOpen.set(false); }
  toggleDrawer() { this.isDrawerOpen.update(prev => !prev); }

  // API Methods
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

  addToCart(product: any) {
    const currentItems = this.cart()?.items || [];
    const existingIndex = currentItems.findIndex(i => i.product_id === product.id);

    if (existingIndex > -1) {
      const item = currentItems[existingIndex];
      if (item.quantity >= item.stock_limit) {
        alert(`Stock limit reached! Max ${item.stock_limit} allowed.`);
        return;
      }
    }

    this.openDrawer();

    this.http.post<any>(`${this.apiUrl}/add`, { product_id: product.id, quantity: 1 }, this.getHeaders()).pipe(
      tap(updatedCart => this.cart.set(this.formatCartResponse(updatedCart))),
      catchError(() => {
        this.loadCart();
        return of(null);
      })
    ).subscribe();
  }

  // 2. Updated updateQuantity (Safe ID check ke sath)
  updateQuantity(cartItemId: number, newQty: number, stockLimit: number = 10) {
    const itemId = Number(cartItemId);

    // Agar ID undefined / NaN hai to API hit mat hone do
    if (!itemId || isNaN(itemId)) {
      console.error('Invalid Cart Item ID:', cartItemId);
      this.loadCart(); // Reload to restore clean state
      return;
    }

    if (newQty > stockLimit) {
      alert(`Max stock limit is ${stockLimit}`);
      return;
    }

    if (newQty <= 0) {
      this.removeItem(itemId);
      return;
    }

    // Optimistic UI update
    const updatedItems = (this.cart()?.items || []).map(item =>
      item.id === itemId ? { ...item, quantity: newQty } : item
    );
    this.cart.update(c => ({ ...(c || this.defaultCart), items: updatedItems }));

    // API Call with clean integer ID
    this.http.put<any>(`${this.apiUrl}/items/${itemId}`, { quantity: newQty }, this.getHeaders()).pipe(
      tap(serverCart => this.cart.set(this.formatCartResponse(serverCart))),
      catchError((err) => {
        console.error('Quantity update failed:', err);
        this.loadCart();
        return of(null);
      })
    ).subscribe();
  }

  // 3. Updated removeItem
  removeItem(cartItemId: number) {
    const itemId = Number(cartItemId);

    if (!itemId || isNaN(itemId)) {
      this.loadCart();
      return;
    }

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
    this.http.delete(`${this.apiUrl}/clear`, this.getHeaders()).subscribe();
  }
}