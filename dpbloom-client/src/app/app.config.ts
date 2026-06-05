import {ApplicationConfig, EnvironmentProviders, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import {Configuration} from "./core/api";
import {environment} from "../environments/environment.development";
import {tokenInterceptor} from "./core/interceptors/token-interceptor";
import {errorInterceptor} from "./core/interceptors/error.interceptor";
import {provideToastr} from "ngx-toastr";
import {provideAnimations} from "@angular/platform-browser/animations";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    (provideAnimations() as unknown as EnvironmentProviders),
    provideToastr({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, tokenInterceptor, errorInterceptor])),
    { provide: Configuration, useFactory: apiConfigFactory }
  ]
};

export function apiConfigFactory(): Configuration {
  return new Configuration({
    basePath: environment.apiUrl,
  });
}
