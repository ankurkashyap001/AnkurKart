import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const httpLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // 1. Force show loader on every request start
  loadingService.show();

  return next(req).pipe(
    // 2. Artificial 2-second delay for testing loader visibility
    delay(2000),
    // 3. Finalize operator guarantees hide when API completes or fails
    finalize(() => {
      loadingService.hide();
    })
  );
};