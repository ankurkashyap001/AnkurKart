import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private apiUrl = 'http://localhost:8000/api';

  currentUser = signal<any>(this.getUserFromStorage());
  isLoggedInSignal = signal<boolean>(!!this.getToken());
  showAuthModal = signal<boolean>(false);

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
  // Modal Controls
  openAuthModal(): void { this.showAuthModal.set(true); }
  closeAuthModal(): void { this.showAuthModal.set(false); }

  // --- API Methods ---

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((res: any) => {
        const token = res.token || res.access_token || res.data?.token;
        const user = res.user || res.data?.user;

        if (token) this.setToken(token);
        if (user) this.setUser(user);
        
        // Auto-close modal if registration returns token/user
        if (token || user) this.closeAuthModal();
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        const token = res.token || res.access_token || res.data?.token;
        const user = res.user || res.data?.user;

        if (token) this.setToken(token);
        if (user) this.setUser(user);

        // Auto-close modal on successful login
        this.closeAuthModal();
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

  // Phone Auth APIs
  sendOtp(phone: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/send-otp`, { phone });
  }

  verifyOtp(payload: { phone: string; otp: string; name?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/verify-otp`, payload).pipe(
      tap((res: any) => {
        const token = res.token || res.access_token || res.data?.token;
        const user = res.user || res.data?.user;

        if (token) this.setToken(token);
        if (user) this.setUser(user);
        if (token || user) this.closeAuthModal();
      })
    );
  }

  logout(): void {
    const token = this.getToken();

    // 1. Wipe LocalStorage instantly
    if (this.isBrowser()) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_data');
    }

    // 2. Clear Signals immediately (UI reacts instantly)
    this.currentUser.set(null);
    this.isLoggedInSignal.set(false);
    this.closeAuthModal();

    // 3. Fire-and-forget Backend Logout API (prevents blocking UI)
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        })
      }).pipe(catchError(() => of(null))).subscribe();
    }
  }

  // LocalStorage Helpers
  setToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);
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
    try { return JSON.parse(userStr); } catch { return null; }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}