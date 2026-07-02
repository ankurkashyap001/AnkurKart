import { Routes } from '@angular/router';
import { InventoryList } from './components/inventory-list/inventory-list';
import { AddItem } from './components/add-item/add-item';

export const routes: Routes = [
  // जब कोई सीधे ऐप खोले (खाली पाथ), तो उसे सीधे /items पर भेज दो (Redirect)
  { path: '', redirectTo: 'items', pathMatch: 'full' },
  
  // हमारे मुख्य कमरे (Routes)
  { path: 'items', component: InventoryList },
  { path: 'add', component: AddItem }
];