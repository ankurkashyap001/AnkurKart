import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OrderPayload, OrderResponse } from '../models/order.model';
import { Observable } from 'rxjs';

export interface PlaceOrderPayload {
  address_id: number;
  payment_method: 'COD' | 'UPI' | 'Online';
  transaction_id?: string | null;
  coupon_code?: string | null;
  discount_amount?: number;
  subtotal?: number;
  delivery_fee?: number;
  grand_total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = 'http://localhost:8000/api/orders';

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

  placeOrder(payload: PlaceOrderPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload, this.getHeaders());
  }

  getOrders() {
    return this.http.get<OrderResponse[]>(this.apiUrl, this.getHeaders());
  }
  // src/app/services/order.service.ts

  getOrderById(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // Live Order Tracking API call
  trackOrder(orderId: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}/track`, this.getHeaders());
  }
}