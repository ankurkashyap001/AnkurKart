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
  defaultImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80';

  ngOnInit() {
    // Extract ID or Order Number from URL
    const orderId = this.route.snapshot.paramMap.get('id');

    if (orderId) {
      this.fetchSingleOrder(orderId);
    } else {
      this.isLoading.set(false);
    }
  }

  fetchSingleOrder(id: string) {
    this.isLoading.set(true);
    
    this.orderService.getOrderById(id).subscribe({
      next: (res: any) => {
        const orderData = res.data || res.order || res;
        this.order.set(orderData);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load order details:', err);
        this.order.set(null);
        this.isLoading.set(false);
      }
    });
  }
}