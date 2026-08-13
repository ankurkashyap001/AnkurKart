import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Counter } from './counter/counter';
import { Computed } from './computed/computed';
import { Cart } from './cart/cart';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Footer } from './components/footer/footer';
import { Navbar } from './components/navbar/navbar';
import { HttpClientModule } from '@angular/common/http';
import { GlobalModal } from './components/global-modal/global-modal';
import { Home } from './pages/home/home';
import { CartDrawer } from './components/cart-drawer/cart-drawer';
import { Checkout } from './pages/checkout/checkout';
import { OrderDetail } from './pages/order-detail/order-detail';
import { AuthModal } from './components/auth-modal/auth-modal';
import { GlobalLoader } from './components/global-loader/global-loader';
import { ToastContainer } from './components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    Counter, 
    Computed, 
    Cart, 
    Login, 
    Register, 
    Footer, 
    Navbar, 
    Home, 
    CartDrawer, 
    Checkout, 
    OrderDetail, 
    GlobalLoader, 
    ToastContainer, 
    AuthModal, 
    GlobalModal
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);

  isAdminRoute = signal<boolean>(false);
  protected readonly title = signal('ankur-kart');

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Set to true whenever URL starts with /admin
      this.isAdminRoute.set(event.urlAfterRedirects.startsWith('/admin'));
    });
  }
}