import { Injectable } from '@angular/core';
import { ConfigService, HttpProviderService } from 'lib-shared-modules';
import { BehaviorSubject, EMPTY, interval, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgramWithRolloutService {
  rolloutDataSubject = new BehaviorSubject<any>(null);
  currentRolloutData = this.rolloutDataSubject.asObservable();
  private rolledOutTriger = new BehaviorSubject<boolean>(false);
  isRolledOutTriger = this.rolledOutTriger.asObservable();
  rollOutDetails:any = {};
  resourceDetails:any = {};
  rolloutId:string = '';
  instanceConfig: any;
  isFormDirty:boolean = true;
  tabValidation:any={
    rolloutDetails: "INVALID",
  }
  constructor( private httpService: HttpProviderService,  private Configuration: ConfigService,) { }


  setRolloutData(data: any) {
    this.rolloutDataSubject.next(data);
  }

  checkisRolledOutTriger(newAction: boolean) {
    this.rolledOutTriger.next(newAction);
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

  readPublishedResources(projectId: number | string) {
    return this.httpService.post(
      this.Configuration.urlConFig.PROGRAM_URLS.PUBLISHED_RESOURCES,{
        "resource_ids": [projectId]}
    );
  }
  readProject(projectId: number | string) {
    return this.httpService.get(
      this.Configuration.urlConFig.PROJECT_URLS.READ_PROJECT + projectId
    );
  }

  saveRollOut() {
    return this.httpService.post(this.Configuration.urlConFig.ROLL_OUT.CREATE_UPDATE_DELETE + (this.rolloutId ? ('/'+this.rolloutId) : ''),this.rollOutDetails);
  }

  publishRollout() {
    return this.httpService.get(this.Configuration.urlConFig.ROLL_OUT.PUBLISH + (this.rolloutId ? ('/'+this.rolloutId) : ''));
  }

  getRolloutDetails() {
    const config = {
      url: this.Configuration.urlConFig.ROLL_OUT.DETAILS+'/'+this.rolloutId,
    };
    return this.httpService.get(config.url);
  }

  setConfig() {
    const config = {
      url: this.Configuration.urlConFig.INSTANCES.CONFIG_LIST,
    };
    return this.httpService.get(config.url);
  }

  startAutoSave() {
    return interval(
      this.instanceConfig?.auto_save_interval
        ? this.instanceConfig?.auto_save_interval
        : 30000
    ).pipe(
      switchMap(() => {
        if(this.isFormDirty) {
          return this.saveRollOut();
        }
        else {
          return EMPTY
        }
      })
    );
  }
}
