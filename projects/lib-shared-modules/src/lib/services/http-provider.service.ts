import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ToastService } from './toast/toast.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastComponent } from '../components/toast/toast.component';




@Injectable({
  providedIn: 'root'
})
export class HttpProviderService {

  constructor(private http:HttpClient,private toastService:ToastService,private _snackBar: MatSnackBar) { }


    get(endpoint: string, params?: HttpParams) {
      const updatedOptions = this.addXRequestedWithHeader();
      return this.http.get(endpoint, { ...params,...updatedOptions })
        .pipe(catchError(this.handleError));
    }


    post(endpoint: string, body: any, options?: { headers?: HttpHeaders, params?: HttpParams }) {
      const updatedOptions = this.addXRequestedWithHeader(options);
      return this.http.post(endpoint, body,updatedOptions)
        .pipe(catchError(this.handleError));
    }


    put(endpoint: string, body: any, options?: { headers?: HttpHeaders, params?: HttpParams }) {
      const updatedOptions = this.addXRequestedWithHeader(options);
      return this.http.put(endpoint, body, updatedOptions)
        .pipe(catchError(this.handleError));
    }


    delete(endpoint: string, options?: { headers?: HttpHeaders, params?: HttpParams }) {
      const updatedOptions = this.addXRequestedWithHeader(options);
      return this.http.delete(endpoint, updatedOptions)
        .pipe(catchError(this.handleError));
    }

    patch(endpoint: string, body: any, options?: { headers?: HttpHeaders, params?: HttpParams }) {
      const updatedOptions = this.addXRequestedWithHeader(options);
      return this.http.patch(endpoint, body,updatedOptions)
        .pipe(catchError(this.handleError));
    }

    /**
    * Method to handle errors.
    * @param error : Error from API response
    */
    handleError(error: HttpErrorResponse): Observable<never> {
      let errorMessage = '';
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client-side error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = `Server-side error: ${error.status} ${error.message}`;
      }
      // Here you can add additional logging if needed
      console.error(errorMessage);
      let data = {
        "message":errorMessage,
        "class":"error",
        "panelClass":"error"
      }
      this?.toastService.openSnackBar(data)
      return throwError(() => error.error);
    }

    private addXRequestedWithHeader(options?: any): any {
      if (!options) {
        options = { headers: new HttpHeaders() };
      }
      if (!options.headers) {
        options.headers = new HttpHeaders();
      }
      options.headers = options.headers.set('X-Requested-With', 'XMLHttpRequest');
      return options;
    }
}
