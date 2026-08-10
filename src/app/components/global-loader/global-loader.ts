import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.css'
})
export class GlobalLoader {
  public loadingService = inject(LoadingService);
}