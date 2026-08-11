import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';

export type OrderStatus = 'All' | 'Pending' | 'Packing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css'
})
export class AdminOrders implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  orders = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  activeFilter = signal<OrderStatus>('All');

  statusOptions: string[] = ['Pending', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];

  ngOnInit() {
    this.loadOrders();
  }

  setFilter(filter: OrderStatus) {
    this.activeFilter.set(filter);
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    const filterValue = this.activeFilter().toLowerCase();

    this.adminService.getOrders(filterValue).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.orders.set(list);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.toastService.error(err.error?.message || 'Failed to fetch orders.');
      }
    });
  }

  onStatusChange(orderId: number | string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const newStatus = target.value;

    this.adminService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Order status updated to ${newStatus}`);
        this.loadOrders();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to update order status.');
        this.loadOrders();
      }
    });
  }
}