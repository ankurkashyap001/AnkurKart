import { Routes } from '@angular/router';
import { InventoryList } from './components/inventory-list/inventory-list';
import { AddItem } from './components/add-item/add-item';
import { Counter } from './counter/counter'; 
import { Computed } from './computed/computed';
import { Cart } from './cart/cart';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Footer } from './components/footer/footer';
import { Navbar } from './components/navbar/navbar';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // हमारे मुख्य कमरे (Routes)
  { path: 'items', component: InventoryList },
  { path: 'add', component: AddItem },
  { path: 'counter', component: Counter },
  { path: 'computed', component: Computed },
  { path: 'cart', component: Cart },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'footer', component: Footer },
  { path: 'navbar', component: Navbar },
  { path: 'home', component: Home}
]; 