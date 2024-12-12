import { Injectable } from '@angular/core';
import { ConfigService, HttpProviderService } from 'lib-shared-modules';

@Injectable({
  providedIn: 'root'
})
export class ProgramWithRolloutService {

  constructor( private httpService: HttpProviderService,  private Configuration: ConfigService,) { }

  getDataManagerList(){
    const config = {
      url: this.Configuration.urlConFig.PROGRAM_URLS.DATA_MANAGER_LIST,
    };
    return this.httpService.get(config.url);
  }

  readProject(projectId: number | string) {
    return this.httpService.get(
      this.Configuration.urlConFig.PROJECT_URLS.READ_PROJECT + projectId
    );
  }
}
