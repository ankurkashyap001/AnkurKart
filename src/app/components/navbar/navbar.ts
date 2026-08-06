import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth'; // Auth service path verify karein
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  // CartService inject karke template mein access karenge
  cartService = inject(CartService);
  constructor(
    public authService: Auth,
    private router: Router
  ) {}

  logout() {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }
}