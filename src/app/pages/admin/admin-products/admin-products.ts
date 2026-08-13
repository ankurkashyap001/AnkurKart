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
  productForm = signal({
    name: '',
    sku: '',
    category: 'Dairy & Breakfast',
    price: 0,
    stock: 0,
    unit: '1 L',
    image_url: '',
    status: 'Active'
  });

  // Filtered computed list
  filteredProducts = computed(() => {
    let list = this.products();
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const stock = this.selectedStockStatus();

    if (q) {
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    if (cat !== 'All Categories') {
      list = list.filter(p => p.category === cat);
    }
    if (stock === 'In Stock') {
      list = list.filter(p => (p.stock ?? 0) > 10);
    } else if (stock === 'Low Stock') {
      list = list.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 10);
    } else if (stock === 'Out of Stock') {
      list = list.filter(p => (p.stock ?? 0) <= 0);
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
      name: '',
      sku: '',
      category: 'Dairy & Breakfast',
      price: 0,
      stock: 0,
      unit: '1 L',
      image_url: '',
      status: 'Active'
    });
    this.isModalOpen.set(true);
  }

  openEditModal(product: any) {
    this.isEditMode.set(true);
    this.selectedProductId.set(product.id);
    this.productForm.set({
      name: product.name || '',
      sku: product.sku || `SKU-${product.id}`,
      category: product.category || 'General',
      price: product.price || 0,
      stock: product.stock || 0,
      unit: product.unit || '1 unit',
      image_url: product.image_url || '',
      status: product.status || 'Active'
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveProduct() {
    const data = this.productForm();
    if (!data.name || data.price <= 0) {
      this.toastService.error('Please enter valid product details');
      return;
    }

    if (this.isEditMode() && this.selectedProductId()) {
      this.adminService.updateProduct(this.selectedProductId()!, data).subscribe({
        next: () => {
          this.toastService.success('Product updated successfully!');
          this.closeModal();
          this.loadProducts();
        },
        error: () => this.toastService.error('Failed to update product')
      });
    } else {
      this.adminService.createProduct(data).subscribe({
        next: () => {
          this.toastService.success('Product added successfully!');
          this.closeModal();
          this.loadProducts();
        },
        error: () => this.toastService.error('Failed to add product')
      });
    }
  }

  deleteProduct(id: number | string, name: string) {
    if (confirm(`Delete "${name}"?`)) {
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