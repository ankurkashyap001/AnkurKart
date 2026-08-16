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

  defaultImage = 'https://placehold.co/150x150/eef2ff/6f42c1?text=AnkurCart';

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchProducts();

    // Listen to query param changes (?search=...&category=...&sort=...)
    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['search'] || '');
      this.selectedCategorySlug.set(params['category'] || '');
      if (params['sort']) {
        this.selectedSort.set(params['sort']);
      }
    });
  }

  // Fetch Categories from Backend API
  fetchCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        const rawList = res?.data?.sales_category || res?.data || (Array.isArray(res) ? res : []);

        if (Array.isArray(rawList) && rawList.length > 0) {
          const formattedCategories = rawList.map((cat: any) => {
            const name = cat.category_name || cat.name || '';
            const id = String(cat.category_id || cat.id);
            const slug = cat.slug || name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            return {
              id: id,
              name: name,
              slug: slug,
              logo: cat.image_url || cat.category_logo_url_web || cat.category_logo_url || cat.image || cat.logo || null
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

  // Fallback Category Extraction from Product List
  private extractCategoriesFromProducts(): void {
    const products = this.allProducts();
    if (!products || products.length === 0) return;

    const categoryMap = new Map<string, any>();

    products.forEach((p: any) => {
      const catObj = p.categories?.[0] || p.category;
      const catName = typeof catObj === 'object' ? (catObj?.name || catObj?.category_name) : (p.category_name || p.category);
      if (!catName || typeof catName !== 'string') return;

      const catId = String(catObj?.id || p.category_id || p.sales_category_id || catName);
      const catSlug = catObj?.slug || catName.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: catId,
          name: catName,
          slug: catSlug,
          logo: catObj?.image_url || catObj?.logo || p.category_image || null
        });
      }
    });

    this.categories.set(Array.from(categoryMap.values()));
  }

  fetchProducts(): void {
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
        (p.sku || '').toLowerCase().includes(query) ||
        (p.category?.name || p.category_name || '').toLowerCase().includes(query)
      );
    }

    // 2. Comprehensive Category Matching (ID / Slug / Name / Array relations)
    if (catFilter && catFilter !== 'all') {
      const matchedCat = this.categories().find(c => 
        String(c.id).toLowerCase() === catFilter || 
        c.slug.toLowerCase() === catFilter || 
        c.name.toLowerCase() === catFilter
      );

      const targetId = matchedCat ? String(matchedCat.id) : catFilter;
      const targetSlug = (matchedCat?.slug || catFilter).toLowerCase();
      const targetName = (matchedCat?.name || catFilter).toLowerCase();

      list = list.filter(p => {
        // A. Check category ID
        const pId = String(p.category_id || p.sales_category_id || p.category?.id || '');
        if (pId && targetId && pId === targetId) return true;

        // B. Check category slug & name fields
        const pCatSlug = (p.category_slug || p.category?.slug || '').toLowerCase();
        if (pCatSlug && (pCatSlug === targetSlug || pCatSlug === catFilter)) return true;

        const pName = (p.category_name || p.category?.name || (typeof p.category === 'string' ? p.category : '') || '').toLowerCase();
        const pGeneratedSlug = pName.replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        if (pGeneratedSlug && (pGeneratedSlug === targetSlug || pGeneratedSlug === catFilter)) return true;
        if (pName && (pName === targetName || pName.includes(targetName) || targetName.includes(pName))) return true;

        // C. Check categories[] array relationship (many-to-many / pivot)
        if (Array.isArray(p.categories) && p.categories.length > 0) {
          const matchInArray = p.categories.some((c: any) => {
            const cId = String(c.id || c.category_id || '');
            const cSlug = (c.slug || '').toLowerCase();
            const cName = (c.name || c.category_name || '').toLowerCase();
            const cGenSlug = cName.replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            return (cId && cId === targetId) || 
                   (cSlug && (cSlug === targetSlug || cSlug === catFilter)) ||
                   (cGenSlug && (cGenSlug === targetSlug || cGenSlug === catFilter)) ||
                   (cName && (cName === targetName || cName.includes(targetName)));
          });

          if (matchInArray) return true;
        }

        return false;
      });
    }

    // 3. Sorting
    if (sort === 'low-high') {
      list.sort((a, b) => (a.sale_price || a.price || 0) - (b.sale_price || b.price || 0));
    } else if (sort === 'high-low') {
      list.sort((a, b) => (b.sale_price || b.price || 0) - (a.sale_price || a.price || 0));
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sort === 'discount') {
      list.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
    }

    return list;
  });

  selectCategory(cat: any): void {
    const paramVal = cat ? (cat.slug || String(cat.id)) : null;
    this.updateQueryParams({ 
      category: paramVal, 
      search: null 
    });
  }

  clearSearch(): void {
    this.updateQueryParams({ search: null });
  }

  clearCategory(): void {
    this.updateQueryParams({ category: null });
  }

  clearAllFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: ''
    });
  }

  isCategoryActive(cat: any): boolean {
    const activeVal = this.selectedCategorySlug().toLowerCase();
    if (!activeVal) return false;

    return String(cat.id).toLowerCase() === activeVal || 
           cat.slug.toLowerCase() === activeVal || 
           cat.name.toLowerCase() === activeVal;
  }

  getActiveCategoryName(): string {
    const activeVal = this.selectedCategorySlug().toLowerCase();
    if (!activeVal) return '';

    const found = this.categories().find(c => 
      String(c.id).toLowerCase() === activeVal || 
      c.slug.toLowerCase() === activeVal || 
      c.name.toLowerCase() === activeVal
    );

    return found ? found.name : activeVal;
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedSort.set(val);
    this.updateQueryParams({ sort: val !== 'relevance' ? val : null });
  }

  private updateQueryParams(params: any): void {
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

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultImage;
  }
}