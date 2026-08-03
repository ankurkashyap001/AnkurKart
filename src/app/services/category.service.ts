import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, CategoryDataResponse, SalesCategory } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private api = inject(ApiService);

  getCategories(): Observable<SalesCategory[]> {
    return this.api.get<ApiResponse<CategoryDataResponse>>('categories').pipe(
      map(res => res.data?.sales_category || [])
    );
  }
}