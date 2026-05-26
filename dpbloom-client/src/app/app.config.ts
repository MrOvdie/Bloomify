import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import {Configuration} from "./core/api";
import {environment} from "../environments/environment.development";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: Configuration, useFactory: apiConfigFactory }
  ]
};


export function apiConfigFactory(): Configuration {
  return new Configuration({
    basePath: environment.apiUrl,
  });
}
