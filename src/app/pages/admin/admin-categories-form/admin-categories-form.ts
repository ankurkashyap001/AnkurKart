import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories-form.html',
  styleUrl: './admin-categories-form.css'
})
export class AdminCategoryForm implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  categories = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('All');

  // Modal & Form State
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  selectedCategoryId = signal<number | string | null>(null);
  isSubmitting = signal<boolean>(false);

  // Image Upload State
  previewUrl = signal<string | null>(null);
  selectedFile: File | null = null;

  categoryForm = signal({
    name: '',
    slug: '',
    is_active: true
  });

  // Filtered List
  filteredCategories = computed(() => {
    let list = this.categories();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    if (q) {
      list = list.filter(c => 
        (c.name || c.category_name || '').toLowerCase().includes(q) ||
        (c.slug || '').toLowerCase().includes(q)
      );
    }

    if (status === 'Active') {
      list = list.filter(c => c.is_active !== false);
    } else if (status === 'Inactive') {
      list = list.filter(c => c.is_active === false);
    }

    return list;
  });

  // Dynamic Stats
  totalCount = computed(() => this.categories().length);
  activeCount = computed(() => this.categories().filter(c => c.is_active !== false).length);
  inactiveCount = computed(() => this.categories().filter(c => c.is_active === false).length);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.adminService.getCategories().subscribe({
      next: (res: any) => {
        const raw = res?.data?.sales_category || res?.data || (Array.isArray(res) ? res : []);
        const list = raw.map((item: any) => ({
          id: item.category_id || item.id,
          name: item.category_name || item.name,
          slug: item.slug || (item.category_name || item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          image_url: item.category_logo_url_web || item.category_logo_url || item.image_url || item.image || null,
          is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
          created_at: item.created_at || 'Recently'
        }));
        this.categories.set(list);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.toastService.error(err.error?.message || 'Failed to load categories');
      }
    });
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedCategoryId.set(null);
    this.selectedFile = null;
    this.previewUrl.set(null);
    this.categoryForm.set({
      name: '',
      slug: '',
      is_active: true
    });
    this.isModalOpen.set(true);
  }

  openEditModal(category: any): void {
    this.isEditMode.set(true);
    this.selectedCategoryId.set(category.id);
    this.selectedFile = null;
    this.previewUrl.set(category.image_url || null);
    this.categoryForm.set({
      name: category.name || '',
      slug: category.slug || '',
      is_active: category.is_active ?? true
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onNameChange(name: string): void {
    const current = this.categoryForm();
    const autoSlug = !this.isEditMode() 
      ? name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') 
      : current.slug;
    
    this.categoryForm.set({ ...current, name, slug: autoSlug });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
  
    const file = input.files[0];
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'image/avif'
    ];
  
    if (!allowed.includes(file.type)) {
      this.toastService.error('Only JPG, PNG, WEBP, SVG, and AVIF formats are allowed.');
      return;
    }
  
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.error('Image size must be less than 2MB');
      return;
    }
  
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl.set(null);
  }

  saveCategory(): void {
    const data = this.categoryForm();
    if (!data.name.trim()) {
      this.toastService.error('Please enter category name');
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    formData.append('name', data.name.trim());
    if (data.slug) {
      formData.append('slug', data.slug.trim());
    }
    formData.append('is_active', data.is_active ? '1' : '0');

    if (this.selectedFile instanceof File) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    const catId = this.selectedCategoryId();

    this.adminService.saveCategory(formData, catId).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success(`Category ${this.isEditMode() ? 'updated' : 'created'} successfully!`);
        this.closeModal();
        this.loadCategories();
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to save category');
      }
    });
  }

  deleteCategory(id: number | string, name: string): void {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.adminService.deleteCategory(id).subscribe({
        next: () => {
          this.toastService.success('Category deleted successfully');
          this.loadCategories();
        },
        error: (err: any) => {
          this.toastService.error(err.error?.message || 'Failed to delete category');
        }
      });
    }
  }
}