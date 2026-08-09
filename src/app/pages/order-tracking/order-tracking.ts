import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css'
})
export class OrderTracking implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  orderId = signal<string | number>('');
  order = signal<any>(null);
  isLoading = signal<boolean>(true);
  remainingMins = signal<number>(0);
  
  private pollingInterval: any = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.orderId.set(id);
        this.fetchOrderTracking(true);
        this.startAutoRefresh();
      }
    });
  }

  fetchOrderTracking(isInitialLoad: boolean = false) {
    if (isInitialLoad) this.isLoading.set(true);

    this.orderService.trackOrder(this.orderId()).subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data) {
          this.order.set(data);
          this.remainingMins.set(data.estimated_mins || 0);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tracking data:', err);
        this.isLoading.set(false);
      }
    });
  }

  startAutoRefresh() {
    // Clear any existing timer
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    // Refresh every 20 seconds
    this.pollingInterval = setInterval(() => {
      this.fetchOrderTracking(false);
    }, 20000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}