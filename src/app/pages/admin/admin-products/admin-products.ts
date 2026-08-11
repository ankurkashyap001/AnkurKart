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

  // Modal State
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  selectedProductId = signal<number | null>(null);

  // Form Data
  productForm = signal({
    name: '',
    category: 'Groceries',
    price: 0,
    stock: 0,
    unit: '1 kg',
    image_url: '',
    description: ''
  });

  // Filtered products list computed
  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.products();
    return this.products().filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.category?.toLowerCase().includes(q)
    );
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
        this.toastService.error(err.error?.message || 'Failed to fetch products.');
      }
    });
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.selectedProductId.set(null);
    this.productForm.set({
      name: '',
      category: 'Groceries',
      price: 0,
      stock: 0,
      unit: '1 kg',
      image_url: '',
      description: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(product: any) {
    this.isEditMode.set(true);
    this.selectedProductId.set(product.id);
    this.productForm.set({
      name: product.name || '',
      category: product.category || 'Groceries',
      price: product.price || 0,
      stock: product.stock || 0,
      unit: product.unit || '1 unit',
      image_url: product.image_url || '',
      description: product.description || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveProduct() {
    const data = this.productForm();
    if (!data.name || data.price <= 0) {
      this.toastService.error('Please enter a valid product name and price.');
      return;
    }

    if (this.isEditMode() && this.selectedProductId()) {
      this.adminService.updateProduct(this.selectedProductId()!, data).subscribe({
        next: () => {
          this.toastService.success('Product updated successfully!');
          this.closeModal();
          this.loadProducts();
        },
        error: (err: any) => {
          this.toastService.error(err.error?.message || 'Failed to update product.');
        }
      });
    } else {
      this.adminService.createProduct(data).subscribe({
        next: () => {
          this.toastService.success('New product added successfully!');
          this.closeModal();
          this.loadProducts();
        },
        error: (err: any) => {
          this.toastService.error(err.error?.message || 'Failed to add product.');
        }
      });
    }
  }

  deleteProduct(id: number | string, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.adminService.deleteProduct(id).subscribe({
        next: () => {
          this.toastService.success('Product deleted.');
          this.loadProducts();
        },
        error: (err: any) => {
          this.toastService.error(err.error?.message || 'Failed to delete product.');
        }
      });
    }
  }
}