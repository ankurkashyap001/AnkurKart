import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface Category {
  id: number | string;
  name: string;
  slug: string;
  image_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private api = inject(ApiService);

  // Fallback high-quality Quick Commerce 3D icons when backend image is null
  private defaultIcons: Record<string, string> = {
    '1': 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png', // Dairy & Eggs
    '2': 'https://cdn-icons-png.flaticon.com/512/1625/1625048.png', // Fruits & Veg
    '3': 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png', // Cold Drinks
    '4': 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png', // Snacks
    '5': 'https://cdn-icons-png.flaticon.com/512/883/883806.png',   // Breakfast
    '6': 'https://cdn-icons-png.flaticon.com/512/992/992747.png',   // Bakery & Biscuits
    '7': 'https://cdn-icons-png.flaticon.com/512/924/924514.png',   // Tea & Coffee
    '8': 'https://cdn-icons-png.flaticon.com/512/5783/5783169.png', // Atta, Rice, Dal
    '9': 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png', // Masala & Oil
    '10': 'https://cdn-icons-png.flaticon.com/512/2405/2405597.png',// Sauces & Spreads
    '11': 'https://cdn-icons-png.flaticon.com/512/995/995053.png',  // Cleaning
    '12': 'https://cdn-icons-png.flaticon.com/512/3163/3163195.png' // Personal Care
  };

  getCategories(): Observable<Category[]> {
    return this.api.get<any>('categories').pipe(
      map((res: any) => {
        const rawList = res?.data?.sales_category || res?.data || (Array.isArray(res) ? res : []);
        
        return rawList.map((item: any) => {
          const id = item.category_id || item.id;
          const name = item.category_name || item.name || 'Category';
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const fallbackIcon = this.defaultIcons[String(id)] || 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png';

          return {
            id: id,
            name: name,
            slug: slug,
            image_url: item.category_logo_url || item.category_logo_url_web || item.image_url || fallbackIcon
          };
        });
      })
    );
  }
}