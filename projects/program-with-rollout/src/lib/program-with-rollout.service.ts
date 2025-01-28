import { Injectable } from '@angular/core';
import { ConfigService, FormService, HttpProviderService, ROLL_OUT_DETAILS } from 'lib-shared-modules';
import { BehaviorSubject, EMPTY, interval, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgramWithRolloutService {
  rolloutDataSubject = new BehaviorSubject<any>(null);
  currentRolloutData = this.rolloutDataSubject.asObservable();
  private getValidationForRollout= new BehaviorSubject<boolean>(false); // check and get the validation for rolled out resource
  isRolledOutValid = this.getValidationForRollout.asObservable();
  getResourceStatus = new BehaviorSubject<any>(null);
  resourceStatus= this.getResourceStatus.asObservable();
  private setRolloutApiErrors = new BehaviorSubject<boolean>(false);
  rolloutApiErrors = this.setRolloutApiErrors.asObservable();
  rollOutDetails:any = {};
  resourceDetails:any = {};
  rolloutId:string = '';
  instanceConfig: any;
  isFormDirty:boolean = true;
  tabValidation:any={
    rolloutDetails: "INVALID",
  }
  programData:any ={}
  constructor( private httpService: HttpProviderService,  private Configuration: ConfigService, private formService: FormService,) { }


  setRolloutData(data: any) {
    this.rolloutDataSubject.next(data);
  }

  checkIsRolledOutValid(newAction: boolean) {
    this.getValidationForRollout.next(newAction);
  }

  setResourceStatus(data: any) {
    this.getResourceStatus.next(data);
  }

  setRolloutErrorsFunc(newAction:any) {
    this.setRolloutApiErrors.next(newAction);
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

  validateAndHighlightErrors(err:any){
    this.formService.getForm(ROLL_OUT_DETAILS).subscribe((data:any) => {
      if (data) {
        err.error.forEach((err:any) => {
          data.result.data.fields.controls.some((item: any) => {
            if (item.name === err.param) {
              this.tabValidation.rolloutDetails = 'INVALID'; 
            }
          });
        });
        this.setRolloutErrorsFunc(err.error)
      }
    })
  }


  setProgramData(data: any) {
    this.programData = { ...this.programData, ...data };
  }

  upDateProgramTitle(title?: string) {
    const currentProjectMetaData = this.rolloutDataSubject.getValue();
    const updatedData = {
      ...currentProjectMetaData,
      sidenavData: {
        ...currentProjectMetaData.sidenavData,
        headerData: {
          ...currentProjectMetaData.sidenavData.headerData,
          title: title
            ? title
            : this.programData?.title
            ? this.programData?.title
            : 'PROgram_NAME',
        },
      },
    };
    this.setRolloutData(updatedData);
  }
}
