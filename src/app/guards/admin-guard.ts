import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth } from '../services/auth';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(Auth);
  const toastService = inject(ToastService);
  const router = inject(Router);

  // 1. SSR BYPASS: On Node.js server, pass routing to browser where localStorage exists
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // 2. CLIENT-SIDE CHECK (Browser Only)
  let user: any = null;

  const rawUserStr = localStorage.getItem('user');
  if (rawUserStr) {
    try {
      user = JSON.parse(rawUserStr);
    } catch (e) {
      user = null;
    }
  }

  if (!user && authService.currentUser) {
    user = typeof authService.currentUser === 'function' ? authService.currentUser() : authService.currentUser;
  }

  // console.log('👉 [CLIENT BROWSER GUARD] Evaluated User:', user);

  // 3. Admin Verification
  const isAdmin = !!(
    user && (
      user.role === 'admin' || 
      user.is_admin === 1 || 
      user.is_admin === true || 
      user.is_admin === '1' ||
      user.email === 'admin@ankurkart.com'
    )
  );

  // console.log('👉 [CLIENT BROWSER GUARD] Is Admin?:', isAdmin);

  if (isAdmin) {
    return true;
  }

  toastService.error('Unauthorized access. Admin privileges required.');
  return router.createUrlTree(['/home']);
};