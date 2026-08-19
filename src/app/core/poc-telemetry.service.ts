import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class PocTelemetryService {
  guardedRequestInterceptorHits = 0;
  guardedResponseInterceptorHits = 0;
}
