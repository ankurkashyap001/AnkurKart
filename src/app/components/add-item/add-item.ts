import { Component, inject } from '@angular/core';
import { InventoryService, InventoryItem } from '../../services/inventory';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 1. टू-वे बाइंडिंग के लिए ज़रूरी मॉड्यूल

@Component({
  selector: 'app-add-item',
  standalone: true,
  imports: [FormsModule], // 2. स्टैंडअलोन नियम: इसे यहाँ रजिस्टर करें
  templateUrl: './add-item.html',
  styleUrls: ['./add-item.css']
})
export class AddItem {
// हमारी बैक-ऑफिस सर्विस और राउटिंग गाइड (Router) को इंजेक्ट करें
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  // फॉर्म के इनपुट्स को होल्ड करने के लिए एक कच्चा ऑब्जेक्ट (Set Value)
  newItemName: string = '';
  newItemQuantity: number = 1;
  newItemPrice: number = 0;

  // बटन क्लिक होने पर चलने वाला मेथड
  submitForm() {
    // अगर नाम खाली है तो आगे मत बढ़ो
    if (!this.newItemName.trim()) return;

    // एक नया आइटम ऑब्जेक्ट तैयार करें
    const product: InventoryItem = {
      id: Date.now(), // यूनिक आईडी के लिए करंट टाइमस्टैम्प ले लिया
      name: this.newItemName,
      quantity: this.newItemQuantity,
      price: this.newItemPrice
    };

    // 3. बैक-ऑफिस सर्विस के पास सामान भेजें (Signal Update होगा)
    this.inventoryService.addItem(product);

    // 4. सामान जुड़ने के बाद मेहमान को अपने आप वापस लिस्ट वाले पेज पर भेज दें
    this.router.navigate(['/items']);
  }
}