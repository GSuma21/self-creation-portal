import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  ConfigService,
  FormService,
  HttpProviderService,
  ROLL_OUT_DETAILS,
  ToastService,
} from 'lib-shared-modules';
import {
  BehaviorSubject,
  EMPTY,
  interval,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProgramWithRolloutService {
  rolloutDataSubject = new BehaviorSubject<any>(null);
  currentRolloutData = this.rolloutDataSubject.asObservable();
  private getValidationForRollout = new BehaviorSubject<boolean>(false); // check and get the validation for rolled out resource
  isRolledOutValid = this.getValidationForRollout.asObservable();
  getResourceStatus = new BehaviorSubject<any>(null);
  resourceStatus = this.getResourceStatus.asObservable();
  private setRolloutApiErrors = new BehaviorSubject<boolean>(false);
  rolloutApiErrors = this.setRolloutApiErrors.asObservable();
  rollOutDetails: any = {};
  resourceDetails: any = {};
  rolloutId: string = '';
  instanceConfig: any;
  isFormDirty: boolean = true;
  tabValidation: any = {
    rolloutDetails: 'INVALID',
  };
  buttonData:any;
  programData: any = {};
  private saveProgram = new BehaviorSubject<boolean>(false);
  isProgramSave = this.saveProgram.asObservable();
  constructor(
    private httpService: HttpProviderService,
    private Configuration: ConfigService,
    private formService: FormService,
    private toastService: ToastService,
    private router: Router
  ) {}

  setRolloutData(data: any) {
    this.rolloutDataSubject.next(data);
  }

  checkIsRolledOutValid(newAction: boolean) {
    this.getValidationForRollout.next(newAction);
  }

  setResourceStatus(data: any) {
    this.getResourceStatus.next(data);
  }

  setRolloutErrorsFunc(newAction: any) {
    this.setRolloutApiErrors.next(newAction);
  }

  getDataManagerList() {
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

  readPublishedResources(resourceId: number | string) {
    return this.httpService.post(
      this.Configuration.urlConFig.PROGRAM_URLS.PUBLISHED_RESOURCES,
      {
        resource_ids:Array.isArray(resourceId) ? resourceId : [resourceId],
      }
    );
  }
  readProject(projectId: number | string) {
    return this.httpService.get(
      this.Configuration.urlConFig.PROJECT_URLS.READ_PROJECT + projectId
    );
  }

  saveRollOut() {
    return this.httpService.post(
      this.Configuration.urlConFig.ROLL_OUT.CREATE_UPDATE_DELETE +
        (this.rolloutId ? '/' + this.rolloutId : ''),
      this.rollOutDetails
    );
  }

  publishRollout() {
    return this.httpService.get(
      this.Configuration.urlConFig.ROLL_OUT.PUBLISH +
        (this.rolloutId ? '/' + this.rolloutId : '')
    );
  }

  getRolloutDetails() {
    const config = {
      url: this.Configuration.urlConFig.ROLL_OUT.DETAILS + '/' + this.rolloutId,
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
        if (this.isFormDirty) {
          return this.saveRollOut();
        } else {
          return EMPTY;
        }
      })
    );
  }

  validateAndHighlightErrors(err: any) {
    this.formService.getForm(ROLL_OUT_DETAILS).subscribe((data: any) => {
      if (data) {
        err.error.forEach((err: any) => {
          data.result.data.fields.controls.some((item: any) => {
            if (item.name === err.param) {
              this.tabValidation.rolloutDetails = 'INVALID';
            }
          });
        });
        this.setRolloutErrorsFunc(err.error);
      }
    });
  }

  setProgramData(data: any) {
    this.programData = { ...this.programData, ...data };
  }

  saveProgramFunc(newAction: boolean) {
    this.saveProgram.next(newAction);
  }

  upDateProgramTitle(title?: string) {
    const currentProjectMetaData = this.rolloutDataSubject.getValue();
    const updatedData = {
      ...currentProjectMetaData,
      sidenavData: {
        ...currentProjectMetaData?.sidenavData,
        headerData: {
          ...currentProjectMetaData?.sidenavData.headerData,
          title: title
            ? title
            : this.programData?.title
            ? this.programData?.title
            : 'PROGRAM_NAME',
        },
      },
    };
    this.setRolloutData(updatedData);
  }

  createOrUpdateProgram(
    programData?: any,
    programId?: string | number,
    removeMetaData?: boolean
  ) {
    this.programData.title = programData?.title 
  ? programData.title 
  : this.programData?.title && this.programData.title.length > 0 
    ? this.programData.title 
    : 'Untitled project';
        this.setProgramData(programData);
        this.upDateProgramTitle();
    const config = {
      url: programId
        ? this.Configuration.urlConFig.PROGRAM_URLS.CREATE_OR_UPDATE_PROGRAM +
          '/' +
          programId
        : this.Configuration.urlConFig.PROGRAM_URLS.CREATE_OR_UPDATE_PROGRAM,
      payload:  this.programData
    };
    return this.httpService.post(config.url, config.payload);
  } 
  updateProgramDraft(projectId: string | number) {
    return this.createOrUpdateProgram(this.programData, projectId).pipe(
      map((res: any) => {
        this.setProgramData(res.result);
        this.openSnackBarAndRedirect(res.message);
        this.saveProgramFunc(false);
        this.upDateProgramTitle();
        return res;
      })
    );
  }

  openSnackBarAndRedirect(
    message?: string,
    panelClass?: string,
    url: any = ''
  ) {
    let data = {
      message: message ? message : 'YOUR_RESOURCE_HAS_BEEN_SAVED_AS_DRAFT',
      class: panelClass ? panelClass : 'success',
    };
    this.toastService.openSnackBar(data);
    if (url?.length) {
      this.router.navigate([`/home/${url}`]);
    }
  }

  addResourceToProgram(payload: any, programId: any) {
    return this.httpService.post(
      this.Configuration.urlConFig.PROGRAM_URLS.ADD_RESOURCES_TO_PROGRAMS +
        ('/' + programId),
      payload
    );
  }

  readProgram(programId: number | string) {
    return this.httpService.get(
      this.Configuration.urlConFig.PROGRAM_URLS.READ_PROGRAM + programId
    );
  }

  removeResourcesFromPrograms(resourceId:any){
    return this.httpService.post(
      this.Configuration.urlConFig.PROGRAM_URLS.REMOVE_RESOURCE  +
          '/' +
          this.programData.id,
      {
        resource_ids:Array.isArray(resourceId) ? resourceId : [resourceId],
      }
    );
  }

  resetProgramMetaData() {
    this.rolloutDataSubject.next(null); // Emit null to clear the current data
  }

  deleteProgram(programId: number | string) {
    const config = {
      url: `${this.Configuration.urlConFig.PROGRAM_URLS.CREATE_OR_UPDATE_PROGRAM}/${programId}`,
    };
    return this.httpService.delete(config.url);
  }
}
