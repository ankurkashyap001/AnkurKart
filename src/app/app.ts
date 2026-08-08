import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
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
// import { Header } from './header/header';
// import { Footer } from './footer/footer';
// import { Sidebar } from './sidebar/sidebar';
// import { Content } from './content/content';
// import { Main } from './main/main';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Counter, Computed, Cart, Login, Register, Footer, Navbar, Home, CartDrawer, Checkout, OrderDetail, AuthModal, GlobalModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ankur-kart');
}
