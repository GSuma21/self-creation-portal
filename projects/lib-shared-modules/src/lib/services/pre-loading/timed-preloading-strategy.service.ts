import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TimedPreloadingStrategy implements PreloadingStrategy {

  constructor() { }

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Check if route has a data property specifying preload
    if (route.data && route.data['preload']) {
      // Preload after a delay (e.g., 5 seconds)
      const delay = route.data['delay'] ? route.data['delay'] : 5000;
      return timer(delay).pipe(mergeMap(() => load()));
    }
    return of(null); // Skip preloading if preload is not set to true
  }
}
