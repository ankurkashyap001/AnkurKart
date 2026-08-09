import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  Math = Math;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  public cartService = inject(CartService);

  // Raw API Signals
  allProducts = signal<any[]>([]);
  categories = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // Active Filter Signals
  searchQuery = signal<string>('');
  selectedCategorySlug = signal<string>('');
  selectedSort = signal<string>('relevance');

  ngOnInit() {
    this.fetchCategories();
    this.fetchProducts();

    // Listen to query param changes (?search=...&category=...)
    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['search'] || '');
      this.selectedCategorySlug.set(params['category'] || '');
    });
  }

  // Fetch Categories with backend response mapping (data.sales_category)
  fetchCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        // Handle backend key: res.data.sales_category
        const rawList = res?.data?.sales_category || res?.data || res || [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          const formattedCategories = rawList.map((cat: any) => {
            const name = cat.category_name || cat.name || '';
            return {
              id: cat.category_id || cat.id,
              name: name,
              slug: (cat.slug || name).toLowerCase().replace(/\s+/g, '-'),
              logo: cat.category_logo_url_web || cat.category_logo_url || cat.logo || null
            };
          });

          this.categories.set(formattedCategories);
        } else {
          this.extractCategoriesFromProducts();
        }
      },
      error: (err) => {
        console.warn('Category API error, falling back to product categories:', err);
        this.extractCategoriesFromProducts();
      }
    });
  }

  // Fallback to extract unique categories directly from loaded products
  private extractCategoriesFromProducts() {
    const products = this.allProducts();
    if (!products || products.length === 0) return;

    const categoryMap = new Map<string, any>();

    products.forEach((p: any) => {
      const catName = p.category?.name || p.category_name || p.category;
      if (!catName) return;

      const catSlug = (p.category?.slug || p.category_slug || catName).toLowerCase().replace(/\s+/g, '-');
      const catId = p.category?.id || p.category_id;

      if (!categoryMap.has(catSlug)) {
        categoryMap.set(catSlug, {
          id: catId,
          name: catName,
          slug: catSlug,
          logo: p.category?.logo || null
        });
      }
    });

    this.categories.set(Array.from(categoryMap.values()));
  }

  fetchProducts() {
    this.isLoading.set(true);
    this.productService.getProducts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.allProducts.set(list);
        this.isLoading.set(false);

        // Fallback category extraction if categories list is currently empty
        if (this.categories().length === 0) {
          this.extractCategoriesFromProducts();
        }
      },
      error: () => {
        this.allProducts.set([]);
        this.isLoading.set(false);
      }
    });
  }

  // Reactive Computed Signal for Search, Category Filtering & Sorting
  filteredProducts = computed(() => {
    let list = [...this.allProducts()];

    const query = this.searchQuery().trim().toLowerCase();
    const catSlug = this.selectedCategorySlug().toLowerCase();
    const sort = this.selectedSort();

    // 1. Filter by Search Query
    if (query) {
      list = list.filter(p => 
        (p.title || p.name || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.category?.name || p.category_name || '').toLowerCase().includes(query)
      );
    }

    // 2. Filter by Category Slug / Name / ID
    if (catSlug) {
      list = list.filter(p => {
        const pCatName = (p.category?.name || p.category_name || p.category || '').toLowerCase();
        const pCatSlug = (p.category?.slug || p.category_slug || pCatName).toLowerCase().replace(/\s+/g, '-');
        const pCatId = String(p.category_id || p.category?.id || '');

        return pCatSlug === catSlug || pCatName === catSlug || pCatId === catSlug;
      });
    }

    // 3. Apply Sorting
    if (sort === 'low-high') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'high-low') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return list;
  });

  // Filter Actions & Router Sync
  selectCategory(slug: string) {
    this.updateQueryParams({ category: slug || null });
  }

  clearSearch() {
    this.updateQueryParams({ search: null });
  }

  clearCategory() {
    this.updateQueryParams({ category: null });
  }

  clearAllFilters() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: ''
    });
  }

  onSortChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedSort.set(val);
  }

  private updateQueryParams(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  // Cart Quantity Helper
  getCartQuantity(productId: number): number {
    const cartItems = this.cartService.cart()?.items || [];
    const item = cartItems.find((i: any) => i.product_id === productId);
    return item ? item.quantity : 0;
  }
}