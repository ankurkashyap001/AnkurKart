import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Address } from '../models/address.model';
import { tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = 'http://localhost:8000/api/addresses';

  addresses = signal<Address[]>([]);
  isLoading = signal<boolean>(false);

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

  loadAddresses() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLoading.set(true);

    this.http.get<any>(this.apiUrl, this.getHeaders()).pipe(
      tap(res => {
        // Safe extraction: Handles [], { data: [] }, or { addresses: [] }
        const addressList = Array.isArray(res) 
          ? res 
          : (res?.data || res?.addresses || []);

        console.log('--> Addresses Loaded:', addressList); // Debug Log
        this.addresses.set(addressList);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        console.error('--> Address Fetch Error:', err);
        this.addresses.set([]);
        this.isLoading.set(false);
        return of([]);
      })
    ).subscribe();
  }

  addAddress(address: Address) {
    return this.http.post<Address>(this.apiUrl, address, this.getHeaders()).pipe(
      tap(() => this.loadAddresses())
    );
  }
}