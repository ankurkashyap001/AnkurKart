import { Component, signal , computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Component({  
  selector: 'app-cart',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
// export class Cart {
//   // cartItems = signal<{ id: number, name: string, price: number, quantity: number }[]>([]);
//   // totalItems = computed(() => this.cartItems().length);
//   // subtotal = computed(() => this.cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0));
//   // tax = computed(() => this.subtotal() * 0.18);
//   // grandTotal = computed(() => this.subtotal() + this.tax());
//   // addItem(item: { id: number, name: string, price: number, quantity: number }) {
//   //   this.cartItems.set([...this.cartItems(), item]);
//   // } 
//   // updateQuantity(id: number, quantity: number) {
//   //   this.cartItems.set(this.cartItems().map(item => item.id === id ? { ...item, quantity: item.quantity + quantity } : item));
//   // }
//   // removeItem(id: number) {
//   //   this.cartItems.set(this.cartItems().filter(item => item.id !== id));
//   // }     
// }
export class Cart {
  // 1. Core State (Signal) - Hamara Cart Items array
  cartItems = signal<CartItem[]>([
    { id: 1, name: 'Laptop', price: 50000, quantity: 1 },
    { id: 2, name: 'Wireless Mouse', price: 1000, quantity: 2 }
  ]);

  // 2. Computed Signals (Automatic Calculation)
  
  // Total Items count
  totalItems = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  // Subtotal (Price * Quantity)
  subtotal = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  // Tax calculation (18% of subtotal)
  tax = computed(() => {
    return Math.round(this.subtotal() * 0.18);
  });

  // Grand Total (Subtotal + Tax)
  grandTotal = computed(() => {
    return this.subtotal() + this.tax();
  });

  // Item quantity update karne ka function
  updateQuantity(productId: number, change: number) {
    this.cartItems.update(items =>
      items.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  }
}