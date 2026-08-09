import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 👈 Form binding (ngModel) ke liye
import { Auth } from '../../services/auth';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // 👈 FormsModule add kiya
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  public authService = inject(Auth);
  public cartService = inject(CartService);
  private router = inject(Router);

  searchTerm: string = '';

  // Search input handler -> Navigate to /products?search=<term>
  onSearch() {
    const query = this.searchTerm ? this.searchTerm.trim() : '';
    
    if (query) {
      // Absolute route '/products' par queryParams ke sath Navigate karein
      this.router.navigate(['/products'], {
        queryParams: { search: query }
      });
    } else {
      this.router.navigate(['/products']);
    }
  }

  logout() {
    this.authService.logout(); // AuthService se user token & state clear hoga
    this.router.navigate(['/login']);
  }
}