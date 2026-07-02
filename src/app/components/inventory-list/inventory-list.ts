import { Component, inject } from '@angular/core';
import { from } from 'rxjs';
import { InventoryService } from '../../services/inventory';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-inventory-list',
  imports: [CurrencyPipe],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.css',
})
export class InventoryList {

  // नए Angular में inject() फंक्शन के जरिए हम सर्विस को सीधे इस्तेमाल कर सकते हैं (DI)
  private inventoryService = inject(InventoryService);

  // सर्विस के अंदर जो सिग्नल्स वाला बॉक्स (items) है, उसे एक वेरिएबल में रख लेते हैं
  // याद रखना: यह अभी भी एक सिग्नल है, इसे HTML में कॉल करने के लिए () लगाना होगा!
  inventoryItems = this.inventoryService.items;
}
  // inventoryItems = [
  //   {
  //     id: 1,
  //     sku: 'MED001',
  //     name: 'Paracetamol 500mg',
  //     category: 'Medicine',
  //     batchNo: 'BT1001',
  //     quantity: 120,
  //     price: 25,
  //     supplier: 'ABC Pharma',
  //     expiry: '2027-03-15',
  //     status: 'In Stock'
  //   },
  //   {
  //     id: 2,
  //     sku: 'MED002',
  //     name: 'Amoxicillin 250mg',
  //     category: 'Medicine',
  //     batchNo: 'BT1002',
  //     quantity: 75,
  //     price: 90,
  //     supplier: 'Sun Healthcare',
  //     expiry: '2026-12-20',
  //     status: 'Low Stock'
  //   },
  //   {
  //     id: 3,
  //     sku: 'MED003',
  //     name: 'Vitamin C Tablets',
  //     category: 'Supplements',
  //     batchNo: 'BT1003',
  //     quantity: 250,
  //     price: 180,
  //     supplier: 'Health Plus',
  //     expiry: '2028-01-10',
  //     status: 'In Stock'
  //   },
  //   {
  //     id: 4,
  //     sku: 'MED004',
  //     name: 'Insulin Injection',
  //     category: 'Injection',
  //     batchNo: 'BT1004',
  //     quantity: 20,
  //     price: 450,
  //     supplier: 'Novo Care',
  //     expiry: '2026-08-18',
  //     status: 'Low Stock'
  //   },
  //   {
  //     id: 5,
  //     sku: 'MED005',
  //     name: 'Surgical Gloves',
  //     category: 'Medical Supplies',
  //     batchNo: 'BT1005',
  //     quantity: 400,
  //     price: 15,
  //     supplier: 'SafeHands',
  //     expiry: '2029-05-01',
  //     status: 'In Stock'
  //   },
  //   {
  //     id: 6,
  //     sku: 'MED006',
  //     name: 'Face Mask',
  //     category: 'Medical Supplies',
  //     batchNo: 'BT1006',
  //     quantity: 15,
  //     price: 8,
  //     supplier: 'CareMed',
  //     expiry: '2028-11-30',
  //     status: 'Low Stock'
  //   },
  //   {
  //     id: 7,
  //     sku: 'MED007',
  //     name: 'Digital Thermometer',
  //     category: 'Equipment',
  //     batchNo: 'BT1007',
  //     quantity: 45,
  //     price: 350,
  //     supplier: 'MediTech',
  //     expiry: '2030-01-01',
  //     status: 'In Stock'
  //   },
  //   {
  //     id: 8,
  //     sku: 'MED008',
  //     name: 'Hand Sanitizer 500ml',
  //     category: 'Hygiene',
  //     batchNo: 'BT1008',
  //     quantity: 0,
  //     price: 120,
  //     supplier: 'CleanLife',
  //     expiry: '2026-07-15',
  //     status: 'Out of Stock'
  //   }
  // ];

