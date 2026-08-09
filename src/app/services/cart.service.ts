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
  
    // Support direct object or res.data wrapper from backend
    const cartData = res.data || res;
    const rawItems = cartData?.items || [];
  
    const formattedItems = Array.isArray(rawItems) ? rawItems.map((item: any) => ({
      // 1. item_id ko frontend id mein normalize karo
      id: Number(item.item_id || item.id),
      product_id: Number(item.product_id),
      title: item.title || '',
      
      // 2. image_url ko primary_image mein bind karo (FIX for broken image)
      primary_image: item.image_url || item.primary_image || '',
      
      // 3. price ko sale_price mein map karo
      sale_price: Number(item.price || item.sale_price || 0),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      
      // 4. stock_available ko stock_limit mein map karo
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

  // src/app/services/cart.service.ts

  addToCart(productOrId: any, quantity: number = 1) {
    // 1. Check whether input is an Object or a direct ID (number/string)
    const productId = typeof productOrId === 'object' ? (productOrId?.id || productOrId?.product_id) : productOrId;

    if (!productId) {
      console.error('Invalid productId provided to addToCart:', productOrId);
      return;
    }

    // 2. Stock Limit Verification
    const currentItems = this.cart()?.items || [];
    const existingIndex = currentItems.findIndex(i => i.product_id === productId);

    if (existingIndex > -1) {
      const item = currentItems[existingIndex];
      if (item.stock_limit && (item.quantity + quantity > item.stock_limit)) {
        alert(`Stock limit reached! Max ${item.stock_limit} allowed.`);
        return;
      }
    }

    this.openDrawer();

    // 3. Payload with validated product_id
    const payload = { 
      product_id: productId, 
      quantity: quantity 
    };

    this.http.post<any>(`${this.apiUrl}/add`, payload, this.getHeaders()).pipe(
      tap(updatedCart => this.cart.set(this.formatCartResponse(updatedCart))),
      catchError((err) => {
        console.error('Cart add error:', err);
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