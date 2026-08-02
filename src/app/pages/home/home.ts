import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  categories = [
    { id: 1, name: 'Handcrafted Decor', discount: 'Up to 35% off', image: 'assets/images/decor.png' },
    { id: 2, name: 'Organic Spices', discount: 'Up to 20% off', image: 'assets/images/spices.png' },
    { id: 3, name: 'Herbal Wellness', discount: 'Up to 25% off', image: 'assets/images/wellness.png' },
    { id: 4, name: 'Artisanal Fabrics', discount: 'Up to 15% off', image: 'assets/images/fabrics.png' },
    { id: 5, name: 'Premium Tea', discount: 'Up to 30% off', image: 'assets/images/tea.png' },
    { id: 6, name: 'Gourmet Gifts', discount: 'Up to 40% off', image: 'assets/images/gifts.png' },
  ];
}