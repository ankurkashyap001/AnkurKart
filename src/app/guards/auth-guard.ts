import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    // Check all possible token keys used in Login
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    if (token && token !== 'undefined' && token !== 'null') {
      return true; // Token exist karta hai, allow access
    }
  }

  // Token nahi mila to Login page par bhej do
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};