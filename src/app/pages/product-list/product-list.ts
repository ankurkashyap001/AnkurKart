import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';


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
  public wishlistService = inject(WishlistService);

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

  // Fetch Categories from Backend API
  fetchCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        const rawList = res?.data?.sales_category || res?.data || res || [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          const formattedCategories = rawList.map((cat: any) => {
            const name = cat.category_name || cat.name || '';
            const id = String(cat.category_id || cat.id);
            return {
              id: id,
              name: name,
              slug: name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              logo: cat.category_logo_url_web || cat.category_logo_url || cat.logo || null
            };
          });

          this.categories.set(formattedCategories);
        } else {
          this.extractCategoriesFromProducts();
        }
      },
      error: () => {
        this.extractCategoriesFromProducts();
      }
    });
  }

  // Fallback Category Extraction
  private extractCategoriesFromProducts() {
    const products = this.allProducts();
    if (!products || products.length === 0) return;

    const categoryMap = new Map<string, any>();

    products.forEach((p: any) => {
      const catName = p.category?.name || p.category_name || p.category;
      if (!catName || typeof catName !== 'string') return;

      const catId = String(p.category?.id || p.category_id || p.sales_category_id || catName);
      const catSlug = catName.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
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

  // Filtered Products Computed Signal
  filteredProducts = computed(() => {
    let list = [...this.allProducts()];

    const query = this.searchQuery().trim().toLowerCase();
    const catFilter = this.selectedCategorySlug().trim().toLowerCase();
    const sort = this.selectedSort();

    // 1. Search Query Filter
    if (query) {
      list = list.filter(p => 
        (p.title || p.name || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.category?.name || p.category_name || '').toLowerCase().includes(query)
      );
    }

    // 2. Category Filter (Matches ID, Slug, or Name)
    if (catFilter) {
      const matchedCat = this.categories().find(c => 
        String(c.id) === catFilter || 
        c.slug === catFilter || 
        c.name.toLowerCase() === catFilter
      );

      const targetId = matchedCat ? String(matchedCat.id) : catFilter;
      const targetName = matchedCat ? matchedCat.name.toLowerCase() : catFilter;
      const targetSlug = matchedCat ? matchedCat.slug : catFilter;

      list = list.filter(p => {
        const pId = String(p.category_id || p.sales_category_id || p.category?.id || '');
        const pName = (p.category_name || p.category?.name || (typeof p.category === 'string' ? p.category : '') || '').toLowerCase();
        const pSlug = pName.replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Match by Category ID
        if (pId && targetId && pId === targetId) return true;

        // Match by Slug
        if (pSlug && targetSlug && pSlug === targetSlug) return true;

        // Match by Name
        if (pName && targetName && (pName.includes(targetName) || targetName.includes(pName))) return true;

        return false;
      });
    }

    // 3. Sorting
    if (sort === 'low-high') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'high-low') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return list;
  });

  selectCategory(cat: any) {
    // Pass Category ID to URL to prevent '&' symbol conflicts
    const paramVal = cat ? String(cat.id) : null;
    this.updateQueryParams({ 
      category: paramVal, 
      search: null 
    });
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

  isCategoryActive(cat: any): boolean {
    const activeVal = this.selectedCategorySlug().toLowerCase();
    if (!activeVal) return false;

    return String(cat.id) === activeVal || 
           cat.slug === activeVal || 
           cat.name.toLowerCase() === activeVal;
  }

  getActiveCategoryName(): string {
    const activeVal = this.selectedCategorySlug().toLowerCase();
    if (!activeVal) return '';

    const found = this.categories().find(c => 
      String(c.id) === activeVal || c.slug === activeVal || c.name.toLowerCase() === activeVal
    );

    return found ? found.name : activeVal;
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

  getCartQuantity(productId: number): number {
    const cartItems = this.cartService.cart()?.items || [];
    const item = cartItems.find((i: any) => i.product_id === productId);
    return item ? item.quantity : 0;
  }
}