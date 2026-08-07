import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Checkout } from './pages/checkout/checkout';
import { Cart } from './cart/cart';
import { InventoryList } from './components/inventory-list/inventory-list';
import { AddItem } from './components/add-item/add-item';
import { Counter } from './counter/counter';
import { Computed } from './computed/computed';

// 1. Missing AuthGuard import fixed (apne exact path ke according adjust kar lein)
import { authGuard } from './guards/auth-guard'; 

export const routes: Routes = [
  // 2. Default route ko 'login' ki jagah 'home' par redirect kar diya hai
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public E-Commerce Routes
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'cart', component: Cart },

  // Protected Routes (Login required)
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },

  // Practice / Admin Inventory Routes
  { path: 'items', component: InventoryList },
  { path: 'add', component: AddItem },
  { path: 'counter', component: Counter },
  { path: 'computed', component: Computed },

  // 3. Wildcard Route (Invalid URLs ko Home par bhejega)
  { path: '**', redirectTo: 'home' }
];