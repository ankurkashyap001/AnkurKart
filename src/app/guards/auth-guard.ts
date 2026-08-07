import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      return true;
    }
  }

  // Token na hone par login screen par bhejega aur origin URL returnUrl mein pass karega
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};