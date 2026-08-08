import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private apiUrl = 'http://localhost:8000/api';

  // Signals for reactive application state
  currentUser = signal<any>(this.getUserFromStorage());
  isLoggedInSignal = signal<boolean>(!!this.getToken());

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getHeaders() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token ?? ''}`,
        'Accept': 'application/json'
      })
    };
  }

  // --- API Methods ---

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        const token = res.token || res.access_token || res.data?.token;
        const user = res.user || res.data?.user;

        if (token) this.setToken(token);
        if (user) this.setUser(user);
      })
    );
  }

  updateProfile(payload: { name: string; phone?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/user/profile`, payload, this.getHeaders()).pipe(
      tap((res: any) => {
        const updatedUser = res.data || res.user || res;
        this.setUser(updatedUser);
      })
    );
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUser.set(null);
    this.isLoggedInSignal.set(false);
  }

  // --- LocalStorage & State Helpers ---

  setToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token); // Fallback compatibility
    }
    this.isLoggedInSignal.set(true);
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }

  setUser(user: any): void {
    if (this.isBrowser()) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.currentUser.set(user);
  }

  getUserFromStorage(): any {
    if (!this.isBrowser()) return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}