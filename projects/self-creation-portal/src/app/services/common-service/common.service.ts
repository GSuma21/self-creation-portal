import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ROUTE_PATHS } from 'lib-shared-modules'

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(private router:Router, private route: ActivatedRoute) { }

  createUrlWithParams(baseUrl: string, params: { [key: string]: any }): string {
    let httpParams = new HttpParams();
    for (const key in params) {
      if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    }
    return `${baseUrl}?${httpParams.toString()}`;
  }
  
  generateParams(pagination: any, filters: any, sortOptions: any, pageStatus: string = '' ): { [key: string]: any } { 
    return {
      page: pagination.currentPage + 1,
      limit: pagination.pageSize,
      type: filters.current.type.join(',') || "",
      status: filters.status || '',
      sort_by:  sortOptions.sort_by || '',
      sort_order: sortOptions.sort_order || '',
      filter: '',
      search: (filters.search) || '',
      listing: pageStatus || '',
      activeFilterButton: filters.activeFilterButton || '',
    };
  }

  applyQueryParams(params: any, pagination: any, filters: any, sortOptions: any) {
    pagination.currentPage = +params['page'] - 1 || 0;
    pagination.pageSize = +params['limit'] || pagination.pageSize;
    filters.current.type = params['type'] ? params['type'].split(',') : [];
    filters.status = params['status'] || '';
    filters.search = params['search'] ? (params['search']) : '';
    sortOptions.sort_by = params['sort_by'] || '';
    sortOptions.sort_order = params['sort_order'] || '';
    filters.activeFilterButton = params['activeFilterButton'] || ''; 
  }

  updateQueryParams(params: { [key: string]: any }) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: ''
    });
  }

  //Check for ISO date format
  isISODate(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
    return isoDateRegex.test(value);
  }
}