import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  order = signal<any>(null);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(orderId);
    }
  }

  loadOrderDetails(id: string) {
    this.isLoading.set(true);
    // Fetch single order details or filter from order history
    this.orderService.getOrders().subscribe({
      next: (res: any) => {
        const ordersList = Array.isArray(res) ? res : (res?.data || []);
        const foundOrder = ordersList.find((o: any) => o.id == id || o.order_number == id);
        this.order.set(foundOrder || ordersList[0] || null);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}