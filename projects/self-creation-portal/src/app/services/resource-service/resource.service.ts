import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from "../common-service/common.service";
import { RESOURCE_URLS } from '../configs/url.config.json';
import { ConfigService, HttpProviderService } from 'lib-shared-modules';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  constructor(private httpService: HttpProviderService, private commonService: CommonService,private Configuration: ConfigService) { }

  getResourceList(pagination: any, filters: any, sortOptions: any, pageStatus: string = '', list: keyof typeof RESOURCE_URLS.ENDPOINTS = 'RESOURCE_LIST' , urlEndpoint:'' ): Observable<any> {
    const endpoint = urlEndpoint ? urlEndpoint : `${RESOURCE_URLS.BASE}${RESOURCE_URLS.ENDPOINTS[list]}`
    const params = this.commonService.generateParams(pagination, filters, sortOptions, pageStatus);
    const url = this.commonService.createUrlWithParams(endpoint, params);
    return this.httpService.get(url);
  }

  createRollOut(Id:string) {
    return this.httpService.post(this.Configuration.urlConFig.ROLL_OUT.CREATE_UPDATE_DELETE,{"resource_id": Id});
  }
}
