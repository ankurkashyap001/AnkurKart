import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  isLoading = signal<boolean>(false);
  private activeRequestsCount = 0;

  show() {
    this.activeRequestsCount++;
    if (this.activeRequestsCount > 0) {
      this.isLoading.set(true);
    }
  }

  hide() {
    this.activeRequestsCount = Math.max(0, this.activeRequestsCount - 1);
    if (this.activeRequestsCount === 0) {
      this.isLoading.set(false);
    }
  }

  forceHide() {
    this.activeRequestsCount = 0;
    this.isLoading.set(false);
  }
}