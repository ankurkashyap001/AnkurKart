import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-drawer.html',
  styleUrls: ['./cart-drawer.css']
})
export class CartDrawer {
  cartService = inject(CartService);
}