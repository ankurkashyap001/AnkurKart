import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Auth } from '../../services/auth';


@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css'
})
export class MyOrders implements OnInit {
  private orderService = inject(OrderService);
  // HTML template access ke liye Auth service ko public rakhein
  public authService = inject(Auth);

  orders = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders() {
    this.isLoading.set(true);
    this.orderService.getOrders().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.orders.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') return 'badge-success';
    if (s === 'cancelled') return 'badge-danger';
    if (s === 'processing' || s === 'packing') return 'badge-warning';
    return 'badge-info'; // pending / placed
  }
}