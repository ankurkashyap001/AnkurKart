import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css'
})
export class AdminProducts implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  products = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All Categories');
  selectedStockStatus = signal<string>('All');

  // Modal State
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  selectedProductId = signal<number | null>(null);

  // Form Data
  // 1. Updated Form Signal State
  productForm = signal({
  title: '',
  description: '',
  price: 0,
  sale_price: null as number | null,
  stock_quantity: 0,
  is_active: true,
  category_id: 1, // Default Category ID
  image_url: ''
});

  // Filtered computed list
  // Filtered computed list
  filteredProducts = computed(() => {
    let list = this.products();
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const stock = this.selectedStockStatus();

    if (q) {
      list = list.filter(p => 
        (p.title || p.name || '').toLowerCase().includes(q) || 
        (p.sku || '').toLowerCase().includes(q)
      );
    }
    if (cat !== 'All Categories') {
      list = list.filter(p => p.category === cat);
    }
    if (stock === 'In Stock') {
      list = list.filter(p => (p.stock_quantity ?? p.stock ?? 0) > 10);
    } else if (stock === 'Low Stock') {
      list = list.filter(p => {
        const qty = p.stock_quantity ?? p.stock ?? 0;
        return qty > 0 && qty <= 10;
      });
    } else if (stock === 'Out of Stock') {
      list = list.filter(p => (p.stock_quantity ?? p.stock ?? 0) <= 0);
    }

    return list;
  });

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.adminService.getProducts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.products.set(list);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.toastService.error(err.error?.message || 'Failed to load products');
      }
    });
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.selectedProductId.set(null);
    this.productForm.set({
      title: '',
      description: '',
      price: 0,
      sale_price: null,
      stock_quantity: 0,
      is_active: true,
      category_id: 1,
      image_url: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(product: any) {
    this.isEditMode.set(true);
    this.selectedProductId.set(product.id);
    this.productForm.set({
      title: product.title || product.name || '',
      description: product.description || '',
      price: product.price || 0,
      sale_price: product.sale_price || null,
      stock_quantity: product.stock_quantity ?? product.stock ?? 0,
      is_active: product.is_active ?? true,
      category_id: product.categories?.[0]?.id || product.category_id || 1,
      image_url: product.image_url || product.primary_image?.url || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveProduct() {
    const data = this.productForm();
  
    if (!data.title || data.price <= 0) {
      this.toastService.error('Please enter valid product title and price');
      return;
    }
  
    if (!data.image_url) {
      this.toastService.error('Please enter an image URL');
      return;
    }
  
    // 🔴 Payload strictly matching all Laravel Controller Validation Rules
    const payload = {
      title: data.title,
      description: data.description || data.title,
      price: Number(data.price),
      sale_price: data.sale_price ? Number(data.sale_price) : null,
      stock_quantity: Number(data.stock_quantity),
      is_active: Boolean(data.is_active),
      category_ids: [Number(data.category_id || 1)], // 👈 Array of Category IDs expected by Laravel
      image_url: data.image_url                      // 👈 Required string field
    };
  
    if (this.isEditMode() && this.selectedProductId()) {
      this.adminService.updateProduct(this.selectedProductId()!, payload).subscribe({
        next: () => {
          this.toastService.success('Product updated successfully!');
          this.closeModal();
          this.loadProducts();
        },
        error: (err: any) => {
          this.toastService.error(err.error?.message || 'Failed to update product');
        }
      });
    } else {
      this.adminService.createProduct(payload).subscribe({
        next: () => {
          this.toastService.success('Product added successfully!');
          this.closeModal();
          this.loadProducts();
        },
        error: (err: any) => {
          this.toastService.error(err.error?.message || 'Failed to add product');
        }
      });
    }
  }

  deleteProduct(id: number | string, title: string) {
    if (confirm(`Delete "${title}"?`)) {
      this.adminService.deleteProduct(id).subscribe({
        next: () => {
          this.toastService.success('Product deleted');
          this.loadProducts();
        },
        error: () => this.toastService.error('Failed to delete product')
      });
    }
  }
}