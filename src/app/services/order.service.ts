import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OrderPayload, OrderResponse } from '../models/order.model';
import { Observable } from 'rxjs';

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

  placeOrder(payload: OrderPayload) {
    return this.http.post<OrderResponse>(this.apiUrl, payload, this.getHeaders());
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