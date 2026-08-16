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
  isSubmitting = signal<boolean>(false);

  // Image Upload State
  previewUrl = signal<string | null>(null);
  selectedFile: File | null = null;

  // Form Data State
  productForm = signal({
    title: '',
    description: '',
    price: 0,
    sale_price: null as number | null,
    stock_quantity: 0,
    is_active: true,
    category_id: 1
  });

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

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
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

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedProductId.set(null);
    this.selectedFile = null;
    this.previewUrl.set(null);
    this.productForm.set({
      title: '',
      description: '',
      price: 0,
      sale_price: null,
      stock_quantity: 0,
      is_active: true,
      category_id: 1
    });
    this.isModalOpen.set(true);
  }

  openEditModal(product: any): void {
    this.isEditMode.set(true);
    this.selectedProductId.set(product.id);
    this.selectedFile = null;
    
    // Existing image preview fallback
    this.previewUrl.set(
      product.image_url || 
      product.primary_image?.url || 
      product.primary_image || 
      null
    );

    this.productForm.set({
      title: product.title || product.name || '',
      description: product.description || '',
      price: product.price || 0,
      sale_price: product.sale_price || null,
      stock_quantity: product.stock_quantity ?? product.stock ?? 0,
      is_active: product.is_active ?? true,
      category_id: product.categories?.[0]?.id || product.category_id || 1
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Allowed image formats
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.error('Only JPG, PNG, WEBP, and SVG formats are allowed.');
      return;
    }

    // Max 2MB file size constraint
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.error('Image size must be less than 2MB');
      return;
    }

    this.selectedFile = file;

    // Instant local preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl.set(null);
  }

  saveProduct(): void {
    const data = this.productForm();

    if (!data.title.trim() || data.price <= 0) {
      this.toastService.error('Please enter a valid product title and price');
      return;
    }

    this.isSubmitting.set(true);

    // Build FormData for multipart API compatibility
    const formData = new FormData();
    formData.append('title', data.title.trim());
    formData.append('description', data.description.trim() || data.title.trim());
    formData.append('price', String(Number(data.price)));
    
    if (data.sale_price) {
      formData.append('sale_price', String(Number(data.sale_price)));
    }
    
    formData.append('stock_quantity', String(Number(data.stock_quantity)));
    formData.append('category_id', String(Number(data.category_id)));
    formData.append('category_ids[]', String(Number(data.category_id)));
    formData.append('is_active', data.is_active ? '1' : '0');

    // Attach image binary if selected
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const productId = this.selectedProductId();

    this.adminService.saveProduct(formData, productId).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success(`Product ${this.isEditMode() ? 'updated' : 'added'} successfully!`);
        this.closeModal();
        this.loadProducts();
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to save product');
      }
    });
  }

  deleteProduct(id: number | string, title: string): void {
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