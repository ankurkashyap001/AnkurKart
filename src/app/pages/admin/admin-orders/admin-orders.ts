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

  // 🔴 Helper: Maps UI status string to exact Laravel snake_case validation rules
  private mapStatusToApi(status: string): string {
    const statusMap: Record<string, string> = {
      'Pending': 'placed',
      'Placed': 'placed',
      'Packing': 'packing',
      'Out for Delivery': 'out_for_delivery',
      'Delivered': 'delivered',
      'Cancelled': 'cancelled'
    };
    return statusMap[status] || status.toLowerCase().replace(/\s+/g, '_');
  }

  loadOrders() {
    this.isLoading.set(true);
    const rawFilter = this.activeFilter();
    const filterValue = rawFilter === 'All' ? 'all' : this.mapStatusToApi(rawFilter);

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

  onStatusChange(order: any, event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedUiStatus = target.value;

    const numericId = Number(order.order_id || order.id);

    if (!numericId || isNaN(numericId)) {
      this.toastService.error('Invalid Order ID format');
      this.loadOrders();
      return;
    }

    // 🔴 Converts UI string (e.g., "Out for Delivery") -> "out_for_delivery"
    const apiStatus = this.mapStatusToApi(selectedUiStatus);

    this.adminService.updateOrderStatus(numericId, apiStatus).subscribe({
      next: () => {
        this.toastService.success(`Order #${order.order_number || numericId} updated to ${selectedUiStatus}`);
        this.loadOrders();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to update order status.');
        this.loadOrders();
      }
    });
  }
}