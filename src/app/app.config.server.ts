import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {mergeApplicationConfig} from '@angular/core';
import {provideServerRendering, withRoutes} from '@angular/ssr';
import {appConfig} from './app.config';
import {serverRoutes} from './app.routes.server';
import {serverCredentialInterceptor} from './core/server-credential.interceptor';

const serverConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withInterceptors([serverCredentialInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
