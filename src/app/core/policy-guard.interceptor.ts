import {HttpEventType, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {tap} from 'rxjs';
import {PocTelemetryService} from './poc-telemetry.service';
import type {Policy} from './poc.models';

export const policyGuardInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.endsWith('/api/policy-guarded')) return next(req);

  const telemetry = inject(PocTelemetryService);
  telemetry.guardedRequestInterceptorHits++;

  return next(req).pipe(
    tap((event) => {
      if (event.type !== HttpEventType.Response) return;
      telemetry.guardedResponseInterceptorHits++;
      const body = event.body as Policy;
      if (body?.signed !== true) {
        throw new Error('Unsigned policy rejected by application response interceptor');
      }
    }),
  );
};
