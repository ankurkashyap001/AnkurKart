import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit {
  private adminService = inject(AdminService);
  pendingOrdersCount = signal<number>(0);

  ngOnInit() {
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.pendingOrdersCount.set(stats.pending_deliveries || 0);
      },
      error: () => {}
    });
  }
}