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

  /**
   * Helper to attach Authorization Token & Accept headers.
   * Note: We don't set 'Content-Type' manually when sending FormData,
   * as the browser will automatically set 'multipart/form-data' with boundaries.
   */
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

  // ================= DASHBOARD =================
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard-stats`, this.getHeaders());
  }

  // ================= ORDERS MANAGEMENT =================
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

  // ================= CATEGORIES CRUD =================
  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories`, this.getHeaders());
  }

  saveCategory(formData: FormData, categoryId?: number | string | null): Observable<any> {
    if (categoryId) {
      // POST with multipart/form-data for update
      return this.http.post<any>(`${this.apiUrl}/categories/${categoryId}`, formData, this.getHeaders());
    }
    return this.http.post<any>(`${this.apiUrl}/categories`, formData, this.getHeaders());
  }

  deleteCategory(categoryId: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/categories/${categoryId}`, this.getHeaders());
  }

  // ================= PRODUCTS CRUD =================
  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products`, this.getHeaders());
  }

  /**
   * Universal save method for Products supporting FormData (images) as well as JSON payloads
   */
  saveProduct(data: FormData | any, productId?: number | string | null): Observable<any> {
    if (productId) {
      return this.http.post<any>(`${this.apiUrl}/products/${productId}`, data, this.getHeaders());
    }
    return this.http.post<any>(`${this.apiUrl}/products`, data, this.getHeaders());
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

  // ================= USERS / CUSTOMERS =================
  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, this.getHeaders());
  }
}