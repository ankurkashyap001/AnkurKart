import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css'
})
export class CartDrawer {
  public cartService = inject(CartService);
  private router = inject(Router);

  couponInput = signal<string>('');
  availableCoupons = [
    { code: 'ANKUR50', desc: 'Flat ₹50 OFF' },
    { code: 'FIRST10', desc: '10% OFF on First Order' },
    { code: 'FREESHIP', desc: 'Free Delivery' }
  ];

  selectQuickCoupon(code: string) {
    this.couponInput.set(code);
    this.cartService.applyCoupon(code);
  }

  onApplyCoupon() {
    if (this.couponInput()) {
      this.cartService.applyCoupon(this.couponInput());
    }
  }

  onRemoveCoupon() {
    this.cartService.removeCoupon();
    this.couponInput.set('');
  }

  proceedToCheckout() {
    this.cartService.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}