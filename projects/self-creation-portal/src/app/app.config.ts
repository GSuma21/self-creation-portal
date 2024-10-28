import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideTranslations } from './translation.providers';
import { LIBRARY_CONFIG, SlAuthLibModule } from 'authentication_frontend_library';
import { authInterceptor } from './services/interceptor/auth.interceptor';
import { environment } from 'environments';
import { switchMap, of } from 'rxjs';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { TimedPreloadingStrategy } from 'lib-shared-modules';
// Create a loader for translation files
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(TimedPreloadingStrategy)),
    provideAnimations(),
    provideTranslations(),
    provideHttpClient(),
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(SlAuthLibModule),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LIBRARY_CONFIG, useFactory: configFactory, deps: [HttpClient] }
  ],
};
// export function configFactory(http: HttpClient): any {
//   return http.get('assets/library.config.json');
// }
export function configFactory(http: HttpClient): any {
  return http.get("assets/library.config.json").pipe(switchMap((data:any)=>{
    data.baseUrl = environment.baseURL
    return of(data)
  }))
}
