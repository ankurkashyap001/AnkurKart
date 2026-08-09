import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css'
})
export class Wishlist implements OnInit {
  Math = Math;
  public wishlistService = inject(WishlistService);
  public cartService = inject(CartService);

  ngOnInit() {
    this.wishlistService.loadWishlist();
  }

  moveToCart(product: any) {
    const targetId = product.id || product.product_id;
    this.cartService.addToCart(targetId, 1);
    this.wishlistService.removeFromWishlist(targetId);
  }

  removeItem(productId: number) {
    this.wishlistService.removeFromWishlist(productId);
  }
}