import {HttpInterceptorFn} from '@angular/common/http';

/** Server-only provider: this file is registered only from app.config.server.ts. */
export const serverCredentialInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/admin-secret')) return next(req);

  return next(
    req.clone({
      setHeaders: {
        'X-Service-Token': process.env['POC_SSR_SERVICE_TOKEN'] ?? 'SSR-SERVICE-CREDENTIAL',
      },
    }),
  );
};
