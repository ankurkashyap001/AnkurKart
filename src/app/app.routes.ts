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

// Auth Guard Import
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  // Default Redirect
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public E-Commerce Routes
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'cart', component: Cart },

  // Protected Routes (Login required)
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },
  
  // Protected Order-Detail (Lazy Loaded)
  { 
    path: 'orders/:id', 
    loadComponent: () => import('./pages/order-detail/order-detail').then(m => m.OrderDetail),
    // canActivate: [authGuard]
  },

  // Practice / Admin Inventory Routes
  { path: 'items', component: InventoryList },
  { path: 'add', component: AddItem },
  { path: 'counter', component: Counter },
  { path: 'computed', component: Computed },

  // Wildcard Route
  { path: '**', redirectTo: 'home' }
];