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
//admin
import { AdminLayout } from './pages/admin/admin-layout/admin-layout';
import { AdminDashboard } from './pages/admin/admin-dashboard/admin-dashboard';
import { AdminOrders } from './pages/admin/admin-orders/admin-orders';
import { adminGuard } from './guards/admin-guard';
import { AdminProducts } from './pages/admin/admin-products/admin-products';

// Auth Guard Import
import { authGuard } from './guards/auth-guard';
import { AdminCategoryForm } from './pages/admin/admin-categories-form/admin-categories-form';


export const routes: Routes = [
  // User Facing Routes
  // Default Redirect
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public E-Commerce Routes
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'cart', component: Cart },
  { path: 'products/:id', loadComponent: () => import('./pages/product-detail/product-detail').then(m => m.ProductDetail)},
  { path: 'products', loadComponent: () => import('./pages/product-list/product-list').then(m => m.ProductList) },
  { path: 'wishlist', loadComponent: () => import('./pages/wishlist/wishlist').then(m => m.Wishlist) },

  // Protected Routes (Login required)
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },


  { 
    path: 'my-orders', 
    loadComponent: () => import('./pages/my-orders/my-orders').then(m => m.MyOrders),
    canActivate: [authGuard] 
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./pages/profile/profile').then(m => m.Profile),
    canActivate: [authGuard] 
  },
  // tracking order
  {
    path: 'orders/:id/track',
    loadComponent: () => import('./pages/order-tracking/order-tracking').then(m => m.OrderTracking)
  },
  
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

  //User Facing Routes ends here

  // ADMIN PANEL PROTECTED ROUTE
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'orders', component: AdminOrders },
      // Placeholder routes for Products, Categories, Users
      { path: 'products', component: AdminProducts }, // 👈 Updated here
      { path: 'categories', component: AdminCategoryForm },
      { path: 'users', component: AdminDashboard }
    ]
  },

  // Wildcard Route
  { path: '**', redirectTo: 'home' }
];