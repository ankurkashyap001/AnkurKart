import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service'; 

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  public cartService = inject(CartService);
  public wishlistService = inject(WishlistService); // 👈 Inject WishlistService

  product = signal<any>(null);
  similarProducts = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  
  selectedImageIndex = signal<number>(0);
  quantity = signal<number>(1);
  isWishlisted = signal<boolean>(false);

  // Dynamic Image Selection
  productImages = computed(() => {
    const prod = this.product();
    if (!prod) return [];
    if (prod.images && prod.images.length > 0) {
      return prod.images.map((img: any) => img.url || img.image_url || img);
    }
    return [prod.primary_image || prod.image_url || 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80'];
  });

  currentImage = computed(() => {
    const imgs = this.productImages();
    return imgs[this.selectedImageIndex()] || imgs[0] || 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80';
  });

  // Price Calculations
  discountPercent = computed(() => {
    const p = this.product();
    if (!p || !p.original_price || p.original_price <= p.price) return 0;
    return Math.round(((p.original_price - p.price) / p.original_price) * 100);
  });

  savingsAmount = computed(() => {
    const p = this.product();
    if (!p || !p.original_price || p.original_price <= p.price) return 0;
    return p.original_price - p.price;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  loadProductDetails(id: string) {
    this.isLoading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (res: any) => {
        const prodData = res.data || res.product || res;
        this.product.set(prodData);
        this.selectedImageIndex.set(0);
        this.quantity.set(1);
        this.isLoading.set(false);
        this.loadSimilarProducts(prodData.category_id || prodData.category?.id);
      },
      error: (err) => {
        console.error('Error fetching product:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadSimilarProducts(categoryId?: number) {
    this.productService.getProducts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res.data || []);
        const filtered = list.filter((p: any) => p.id !== this.product()?.id);
        this.similarProducts.set(filtered.slice(0, 5));
      }
    });
  }

  selectImage(index: number) {
    this.selectedImageIndex.set(index);
  }

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart() {
    if (this.product()) {
      const qty = this.quantity();
      
      // Selected quantity ke hisab se item cart mein add karein
      for (let i = 0; i < qty; i++) {
        this.cartService.addToCart(this.product().id);
      }
    }
  }

  toggleWishlist() {
    this.isWishlisted.update(w => !w);
  }
}