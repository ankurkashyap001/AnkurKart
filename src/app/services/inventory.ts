import { Injectable, signal } from '@angular/core';

// हर एक इन्वेंटरी आइटम का ढांचा कैसा होगा (Interface)
export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

@Injectable({
  providedIn: 'root' // providedIn: 'root' का मतलब है पूरा होटल (App) इसे इस्तेमाल कर सकता है
})
export class InventoryService {

  // 1. हमारा मुख्य इलेक्ट्रॉनिक बॉक्स (Signal) जिसमें सामान की लिस्ट है
  items = signal<InventoryItem[]>([
    { id: 1, name: 'MacBook Pro', quantity: 5, price: 150000 },
    { id: 2, name: 'iPhone 13', quantity: 12, price: 60000 }
  ]);

  constructor() { }

  // 2. नया सामान लिस्ट में जोड़ने का मेथड (Action)
  addItem(newItem: InventoryItem) {
    // .update() मेथड पुराने एरे को लेता है और उसमें नया आइटम जोड़कर बक्से को अपडेट कर देता है
    this.items.update(oldItems => [...oldItems, newItem]);
  }
}