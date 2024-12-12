import { Injectable } from '@angular/core';
import { ConfigService, HttpProviderService } from 'lib-shared-modules';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgramWithRolloutService {
  dataSubject = new BehaviorSubject<any>(null);
  currentRolloutData = this.dataSubject.asObservable();
  constructor( private httpService: HttpProviderService,  private Configuration: ConfigService,) { }


  setData(data: any) {
    this.dataSubject.next(data);
  }
  
  getDataManagerList(){
    const config = {
      url: this.Configuration.urlConFig.PROGRAM_URLS.DATA_MANAGER_LIST,
    };
    return this.httpService.get(config.url);
  }

  deleteRollout(projectId: number | string) {
    const config = {
      url: `${this.Configuration.urlConFig.ROLL_OUT.CREATE_UPDATE_DELETE}/${projectId}`,
    };
    return this.httpService.delete(config.url);
  }
}
