import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { map, merge, startWith, throwError } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';

import { inject } from '@angular/core';
import { LibSharedModulesService } from 'lib-shared-modules';
import { environment } from 'environments';
import { MatDialog } from '@angular/material/dialog';
import { fromEvent } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const commonService = inject(LibSharedModulesService);
  const matDialog = inject(MatDialog);
  const authToken = localStorage.getItem('accToken');
  let onlineStatus: boolean = true
  let onlineEvent = fromEvent(window, 'online').pipe(map(() => true));
  let offlineEvent = fromEvent(window, 'offline').pipe(map(() => false));
  let isOnline$ = merge(onlineEvent, offlineEvent).pipe( startWith(navigator.onLine));
   isOnline$.subscribe(isOnline => {
    onlineStatus = isOnline
    // if(!onlineStatus){
    //   commonService.openErrorToast("OFFLINE_MSG_NETWORK")
    // }
  });

  let authReq = req.clone({})
  if(onlineStatus){
    if (req.headers.get('X-Requested-With') === 'XMLHttpRequest') {
      if(authToken) {
        if(req.url.includes('entity-management')){
          authReq = req.clone({
            url: `${environment.baseURL}${req.url}`,
            setHeaders: {
              'x-auth-token': `${authToken}`
            }
          });
        }
        else {
          authReq = req.clone({
            url: `${environment.baseURL}${req.url}`,
            setHeaders: {
              'x-auth-token': `${environment.prefix} ${authToken}`
            }
          });
        }
      }else {
        authReq = req.clone({
          url: `${environment.baseURL}${req.url}`
        });
      }
    }
  }else{
    commonService.openErrorToast("OFFLINE_MSG_NETWORK")
    return throwError("error");
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      commonService.openErrorToast(!onlineStatus ? "OFFLINE_MSG_NETWORK" : error.error.message)
      if(error.status === 403){
        matDialog.closeAll();
      }
      if(error.status === 401){
        matDialog.closeAll();
        commonService.navigateToLogin()
      }
      return throwError(error);
    }))
};
