import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service'; // Updated Path
import { SalesCategory } from '../../models/category.model';       // Updated Path

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<SalesCategory[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  defaultCategoryImage = 'assets/images/category-placeholder.png';

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Categories fetch karne me dikkat aayi.');
        this.isLoading.set(false);
      }
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultCategoryImage;
  }
}