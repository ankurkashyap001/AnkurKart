import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  active_customers: number;
  pending_deliveries: number;
  low_stock_items: number;
  recent_orders?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = 'http://localhost:8000/api/admin';

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

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard-stats`, this.getHeaders());
  }

  getOrders(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    return this.http.get<any>(`${this.apiUrl}/orders`, { ...this.getHeaders(), params });
  }

  updateOrderStatus(orderId: number | string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/orders/${orderId}/status`, { status }, this.getHeaders());
  }

  // --- PRODUCTS CRUD ---
  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products`, this.getHeaders());
  }

  createProduct(productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, productData, this.getHeaders());
  }

  updateProduct(id: number | string, productData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, productData, this.getHeaders());
  }

  deleteProduct(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`, this.getHeaders());
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, this.getHeaders());
  }
}