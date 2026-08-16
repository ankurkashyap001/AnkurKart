import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
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

  @Input() categoryData: any = null; // Passed when editing
  @Output() formClosed = new EventEmitter<boolean>(); // true if saved successfully

  isSubmitting = signal<boolean>(false);
  previewUrl = signal<string | null>(null);
  selectedFile: File | null = null;

  form = {
    name: '',
    slug: '',
    is_active: true
  };

  ngOnInit(): void {
    if (this.categoryData) {
      this.form.name = this.categoryData.name || this.categoryData.category_name || '';
      this.form.slug = this.categoryData.slug || '';
      this.form.is_active = this.categoryData.is_active ?? true;
      this.previewUrl.set(
        this.categoryData.image_url ||
        this.categoryData.category_logo_url ||
        this.categoryData.image ||
        null
      );
    }
  }

  onNameChange(name: string): void {
    this.form.name = name;
    if (!this.categoryData) {
      // Auto-generate slug for new category
      this.form.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // File Validation: Max 2MB & formats
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.error('Only JPG, PNG, WEBP, and SVG formats are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.toastService.error('File size must not exceed 2MB.');
      return;
    }

    this.selectedFile = file;

    // Generate local instant preview
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

  submitCategory(): void {
    if (!this.form.name.trim()) {
      this.toastService.error('Please enter category name');
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    formData.append('name', this.form.name.trim());
    formData.append('slug', this.form.slug.trim());
    formData.append('is_active', this.form.is_active ? '1' : '0');

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const categoryId = this.categoryData?.id || this.categoryData?.category_id || null;

    this.adminService.saveCategory(formData, categoryId).subscribe({
      next: () => {
        this.toastService.success(`Category ${categoryId ? 'updated' : 'created'} successfully!`);
        this.isSubmitting.set(false);
        this.formClosed.emit(true);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to save category');
      }
    });
  }

  close(): void {
    this.formClosed.emit(false);
  }
}