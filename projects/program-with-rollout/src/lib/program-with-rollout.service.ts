import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConfigService,
  FormService,
  HttpProviderService,
  ROLL_OUT_DETAILS,
  ToastService,
  ReviewModelComponent,
  SUBMITTED_FOR_REVIEW,
  PROGRAM_DETAILS,
  UtilService,
  resourceStatus,
  ROUTE_PATHS
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
  dataSubject = new BehaviorSubject<any>(null);
  currentProjectMetaData = this.dataSubject.asObservable();
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
  tabValidationForProgram:any;
  formMeta:any;
  mode: any = 'edit';
  programConfig:any
  private saveProgram = new BehaviorSubject<boolean>(false);
  isProgramSave = this.saveProgram.asObservable();
  private programsendForReviewValidation = new BehaviorSubject<boolean>(false);
  isProgramSendForReviewValidation = this.programsendForReviewValidation.asObservable();
  private setProgramApiErrors = new BehaviorSubject<boolean>(false);
  programApiErrors = this.setProgramApiErrors.asObservable();
  reviewErrors:any = [];

  constructor(
    private httpService: HttpProviderService,
    private Configuration: ConfigService,
    private formService: FormService,
    private toastService: ToastService,
    private router: Router,
    private dialog: MatDialog,
    private utilService: UtilService,
    private route: ActivatedRoute
  ) {
    this.setValidationForProgram();
    this.tabValidationForProgram={
      programDetails: 'VALID',
      programResources: 'VALID',
      resourceLevelTargeting: 'VALID'
    }
    this.route.queryParams.subscribe((params: any) => {
      this.mode = params.mode ? params.mode : 'edit';
    });
  }

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

  getDataManagerList(type:any=""){
    const config = {
      url: type == 'programs' ?  this.Configuration.urlConFig.PROGRAM_URLS.PROGRAM_MANAGER_LIST: this.Configuration.urlConFig.ROLL_OUT.ROLLOUT_MANAGER_LIST,
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
        resource_ids: Array.isArray(resourceId) ? resourceId : [resourceId],
      }
    );
  }

  getcommentsListAsOpen(): Observable<any> {
    return this.getComments().pipe(
      map((comments: any[]) => {
        comments.forEach((comment: any) => {
          if (comment.status === resourceStatus.DRAFT) {
            comment.status = 'OPEN';
          }
        });
        return comments;
      })
    );
  }

  approveProject() {
    this.getcommentsListAsOpen().subscribe((res) => {
      this.utilService
        .approveResource(this.programData.id, { comment: res })
        .subscribe((res: any) => {
          this.openSnackBarAndRedirect(
            res.message,
            'success',
            ROUTE_PATHS.SIDENAV.UP_FOR_REVIEW
          );
        });
    });
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

  checkProgramSendForReviewValidation(newAction: boolean) {
    this.programsendForReviewValidation.next(newAction);
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
      : 'Untitled program';
    this.setProgramData(programData);
    this.saveProgramFunc(false);
    this.upDateProgramTitle();
    const config = {
      url: programId
        ? this.Configuration.urlConFig.PROGRAM_URLS.CREATE_OR_UPDATE_PROGRAM +
          '/' +
          programId
        : this.Configuration.urlConFig.PROGRAM_URLS.CREATE_OR_UPDATE_PROGRAM,
      payload: this.programData,
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

  removeResourcesFromPrograms(resourceId: any) {
    return this.httpService.post(
      this.Configuration.urlConFig.PROGRAM_URLS.REMOVE_RESOURCE +
        '/' +
        this.programData.id,
      {
        resource_ids: Array.isArray(resourceId) ? resourceId : [resourceId],
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


  getReviewerData() {
    const config = {
      url: this.Configuration.urlConFig.PROJECT_URLS.GET_REVIEWER_LIST,
    };
    return this.httpService.get(config.url);
  }

  triggerProgramSendForReview(){
    if(this.formMeta.formValidation.programDetails === 'VALID' && this.formMeta.formValidation.programResources === 'VALID' && this.formMeta.formValidation.resourceLevelTargeting === 'VALID'){
       if (
              this.programConfig?.show_reviewer_list
            ) {
              this.getReviewerData().subscribe((list: any) => {
                const dialogRef = this.dialog.open(ReviewModelComponent, {
                  disableClose: true,
                  data: {
                    header: 'SEND_FOR_REVIEW',
                    reviewdata: list.result.data,
                    sendForReview: 'SEND_FOR_REVIEW',
                    note_length: this.instanceConfig.note_length
                      ? this.instanceConfig.note_length
                      : 200,
                  },
                });
                dialogRef.afterClosed().subscribe((result: any) => {
                  if (result.sendForReview == 'SEND_FOR_REVIEW') {
                    this.createOrUpdateProgram(
                      this.programData,
                      this.programData.id,
                      true
                    ).subscribe((res) => {
                      const reviewer_ids =
                        result.selectedValues.length === list.result.data.length
                          ? result.reviewerNote
                            ? { notes: result.reviewerNote }
                            : {}
                          : {
                              reviewer_ids: result.selectedValues.map(
                                (item: any) => item.id
                              ),
                              ...(result.reviewerNote && {
                                notes: result.reviewerNote,
                              }),
                            };
                      this.sendForReview(reviewer_ids, this.programData.id).subscribe(
                        (res: any) => {
                          let data = {
                            message: res.message,
                            class: 'success',
                          };
                          this.toastService.openSnackBar(data);
                          this.programData = {};
                          this.router.navigate([SUBMITTED_FOR_REVIEW]);
                        },((err)=> {
                          this.validateAndHighlightErrorsForPrograms(err)
                        })
                      );
                    });
                  }
                  return true;
                });
              });
            } else {}
    }else{
      this.openSnackBarAndRedirect('Fill the mandatory fields and/or add at least one resource to the program.','error');
    }
    this.checkProgramSendForReviewValidation(false);

  }


  sendForReview(reviewers: any, programId: any) {
    const config = {
      url: `${this.Configuration.urlConFig.PROGRAM_URLS.SEND_FOR_REVIEW}/${programId}`,
      payload: reviewers,
    };

    return this.httpService.post(config.url, config.payload);
  }

  setValidationForProgram(){
    this.formMeta = {
      formValidation:{
        programDetails: 'INVALID',
        programResources: 'INVALID',
      resourceLevelTargeting: 'INVALID'
      }
    }
  }

  setProgramErrorsFunc(newAction:any) {
    this.setProgramApiErrors.next(newAction);
  }

  validateAndHighlightErrorsForPrograms(err: any) {
    this.formService.getForm(PROGRAM_DETAILS).subscribe((data: any) => {
      if (data) {
        err.error.forEach((err: any) => {
          data.result.data.fields.controls.some((item: any) => {
            if(item.name == err.param){
              this.formMeta.formValidation.programDetails = "INVALID"
              this.tabValidationForProgram.programDetails = 'INVALID';
              return
            }

          });
        });
        this.reviewErrors = err.error
        this.setProgramErrorsFunc(err.error);
      }
    });
  }

  updateResourceTargetCriteria(programId?:string|number) {
    if(this.programData.targeting_criteria?.length > 0) {
      this.programData.resources.forEach((resource:any)=>{
        if(!resource.targeting_criteria || JSON.stringify(resource.targeting_criteria) != JSON.stringify(this.programData.targeting_criteria)) {
          resource.targeting_criteria  = this.programData.targeting_criteria
        }
      })
    }
  }

  removeItemFromAPIErrors(location:any) {
    this.reviewErrors = [...this.reviewErrors.filter((obj:any) => obj.param !== location)]
    this.setProgramErrorsFunc(this.reviewErrors);
  }

  checkValidationForRequestChanges(input:any = "") { // Method to check validation for enabling or disabling the 'REQUEST_CHANGES' button based on the content of `quillInput` and existing comments.
    if(input === null){
      this.getComments().subscribe((data:any)=>{
        if(data.some((comment: any) => comment.status === resourceStatus.DRAFT)){
          this.changeCommentStatus(false)
        }else{
          this.changeCommentStatus(true)
        }
        })
    }else{
      if(Array.isArray(input) && input.some((comment: any) => comment.status === resourceStatus.DRAFT)){
        this.changeCommentStatus(false)
      }else if(!Array.isArray(input) && input.length > 0){
        this.changeCommentStatus(false)
      }else{
        this.changeCommentStatus(true)
      }
    }
  }

  getComments(): Observable<any[]> {
    return this.utilService
      .getCommentList(this.programData.id)
      .pipe(map((response: any) => response.result.comments || []));
  }

  changeCommentStatus(status:any){
    const currentProjectMetaData = this.rolloutDataSubject.getValue();
    if (
      Array.isArray(
        currentProjectMetaData?.sidenavData.headerData?.buttons?.[this.mode]
      )
    ) {
      currentProjectMetaData?.sidenavData.headerData?.buttons?.[
        this.mode
      ].forEach((element: any) => {
        if (element.title === 'REQUEST_CHANGES') {
          element.disable = status;
        }
      });
    }
  }

  copyAndCreateProgram(){
    const config = {
      url: this.Configuration.urlConFig.PROGRAM_URLS.CREATE_OR_UPDATE_PROGRAM +
          '?reference_id=' + this.programData.id,
      payload: this.programData,
    };
    return this.httpService.post(config.url, config.payload);
  }
}
