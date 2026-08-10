import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const httpLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Trigger loading state on request start
  loadingService.show();

  return next(req).pipe(
    // Artificial 1.5s delay for dev mode testing
    delay(1500),
    // Guarantees hide call when request completes or errors out
    finalize(() => {
      loadingService.hide();
    })
  );
};