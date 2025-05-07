import { Injectable } from '@angular/core';
import {
  HttpProviderService,
  PROJECT_DETAILS_PAGE,
  ReviewModelComponent,
  SUBMITTED_FOR_REVIEW,
  ToastService,
  UtilService,
  ROUTE_PATHS,
  resourceStatus,
  LibSharedModulesService,
  FormService,
  solutionModes,
  PROJECT_DETAILS
} from 'lib-shared-modules';
import { BehaviorSubject, map, Observable, switchMap, tap, EMPTY, of  } from 'rxjs';
import { ConfigService } from 'lib-shared-modules';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval } from 'rxjs/internal/observable/interval';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root',
})
export class LibProjectService {
  dataSubject = new BehaviorSubject<any>(null);
  currentProjectMetaData = this.dataSubject.asObservable();
  projectData: any = {};
  programData:any = {};
  private saveProject = new BehaviorSubject<boolean>(false);
  isProjectSave = this.saveProject.asObservable();
  private setProjectApiErrors = new BehaviorSubject<boolean>(false);
  projectApiErrors = this.setProjectApiErrors.asObservable();
  private sendForReviewValidation = new BehaviorSubject<boolean>(false);
  isSendForReviewValidation = this.sendForReviewValidation.asObservable();
  projectId: string | number = '';
  formMeta:any = ''
  viewOnly: boolean = false;
  mode: any = 'edit';
  projectConfig: any;
  instanceConfig: any;
  isFormDirty:boolean = true;
  tabValidation:any;
  reviewErrors:any = [];
  private saveProgramResource = new BehaviorSubject<boolean>(false);
  isProgramResourceSave = this.saveProgramResource.asObservable();

  constructor(
    private httpService: HttpProviderService,
    private Configuration: ConfigService,
    private route: ActivatedRoute,
    private router: Router,
    private _snackBar: MatSnackBar,
    private toastService: ToastService,
    private dialog: MatDialog,
    private utilService: UtilService,
    private sharedService:LibSharedModulesService,
    private formService: FormService,
  ) {
    this.route.queryParams.subscribe((params: any) => {
      this.mode = params.mode ? params.mode : 'edit';
    });
    this.setFormMetaData();
    this.tabValidation={
      projectDetails: "VALID",
      tasks:"VALID",
      subTasks:"VALID",
      certificates:'VALID'
    }
  }

  setData(data: any) {
    this.dataSubject.next(data);
  }

  setProjectData(data: any) {
    this.projectData = { ...this.projectData, ...data };
  }

  saveProjectFunc(newAction: boolean) {
    this.saveProject.next(newAction);
  }

  saveProgramResourceFunc(newAction: boolean) {
    this.saveProgramResource.next(newAction);
  }

  setProjectErrorsFunc(newAction:any) {
    this.setProjectApiErrors.next(newAction);
  }

  checkSendForReviewValidation(newAction: boolean) {
    this.sendForReviewValidation.next(newAction);
  }

  resetProjectMetaData() {
    this.dataSubject.next(null); // Emit null to clear the current data
  }

  updateProjectDraft(projectId: string | number) {
    return this.createOrUpdateProject(this.projectData, projectId).pipe(
      map((res: any) => {
        this.setProjectData(res.result);
        this.openSnackBarAndRedirect(res.message);
        this.saveProjectFunc(false);
        this.upDateProjectTitle();
        return res;
      })
    );
  }

  triggerSendForReview() {
    if (this.formMeta.formValidation.projectDetails === 'VALID' &&
      this.formMeta.formValidation.tasks === 'VALID' &&
      this.formMeta.formValidation.subTasks === 'VALID' &&
      (this.formMeta.isCertificateSelected && this.formMeta.formValidation.certificates === 'VALID') &&
      this.projectData.tasks.length <= (this.projectConfig?.max_task_count ? this.projectConfig.max_task_count : 10)
    ) {
      if(this.projectData.certificate && this.projectData.certificate.criteria.conditions.C3 && this.projectData.certificate.criteria.conditions.C3.expression.length == 0) {
        delete this.projectData.certificate.criteria.conditions.C3;
        this.projectData.certificate.criteria.expression = this.projectData.certificate.criteria.expression.includes("&&C3") ? this.projectData.certificate.criteria.expression.replace("&&C3", "") : this.projectData.certificate.criteria.expression;
      }
      if(this.projectData.certificate && this.projectData.certificate.criteria.conditions.C2) {
        this.projectData.certificate.criteria.conditions.C2.validationText = '';
        this.projectData.certificate.criteria.conditions.C2.validationText = "Add " + this.projectData.certificate.criteria.conditions.C2.conditions.C1.value + " evidence at the project level"
      }
      if(this.projectData.certificate && this.projectData.certificate.criteria.conditions.C3) {
        this.projectData.certificate.criteria.conditions.C3.validationText = ''; // to remove validation texts if old task were added.
        let array = Object.keys(this.projectData.certificate.criteria.conditions.C3.conditions)
        array.forEach((element:any) => {
          this.projectData.certificate.criteria.conditions.C3.validationText = this.projectData.certificate.criteria.conditions.C3.validationText + " Add "+this.projectData.certificate.criteria.conditions.C3.conditions[element].value + " evidence for the task " + this.projectData.tasks.find((task:any)=> task.id == element)?.name+'. '
        })
      }
      if (
        this.projectConfig?.show_reviewer_list &&
        this.projectData.stage !== resourceStatus.REVIEW
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
              this.createOrUpdateProject(
                this.projectData,
                this.projectData.id,
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
                this.sendForReview(reviewer_ids, this.projectData.id).subscribe(
                  (res: any) => {
                    let data = {
                      message: res.message,
                      class: 'success',
                    };
                    this.toastService.openSnackBar(data);
                    this.projectData = {};
                    this.router.navigate([SUBMITTED_FOR_REVIEW]);
                  },((err)=> {
                    this.setTaskEvidenceMetaData();
                    this.validateAndHighlightErrors(err)
                  })
                );
              });
            }
            return true;
          });
        });
      } else {
        this.createOrUpdateProject(
          this.projectData,
          this.projectData.id,
          true
        ).subscribe((res) => {
          this.getcommentsListAsOpen().subscribe((comment) => {
            this.sendForReview({}, this.projectData.id).subscribe(
              (res: any) => {
                if(comment.length > 0){
                  this.utilService
                  .updateComment(this.projectData.id, comment)
                  .subscribe((res: any) => {
                });
                }
                this.toastService.openSnackBar({
                  message: res.message,
                  class: 'success',
                });
                this.projectData = {};
                this.router.navigate([SUBMITTED_FOR_REVIEW]);
              },((err)=> {
                this.setTaskEvidenceMetaData()
                this.validateAndHighlightErrors(err)
              })
            );

      });
        })
      }
    } else {
      if(this.reviewErrors.length > 0) {
        this.openSnackBarAndRedirect('CHECK_HIGHLIGHT_FIELDS', 'error');
      }
      else {
        this.openSnackBarAndRedirect('FILL_ALL_THE_MANDATORY_FIELDS', 'error');
      }
    }
    this.checkSendForReviewValidation(false);
  }

  setTaskEvidenceMetaData() {
    if(this.projectData.certificate && !this.projectData.certificate.criteria.conditions.C3) {
      this.projectData.certificate.criteria.conditions.C3 = {
        validationText: '',
        expression: '',
        conditions: {},
      }
      this.projectData.certificate.criteria.expression = this.projectData.certificate.criteria.expression + "&&C3"
    }
  }


  validateAndHighlightErrors(err:any){
    this.parseLocations(err.error).subscribe((errors:any) =>{
      this.formService.getFormWithEntities(PROJECT_DETAILS).then((data:any) => {
        if (data) {
          errors.forEach((err:any) => {
            data.controls.some((item: any) => {
              if (item.name === err.parsedLocation.name) {
                this.formMeta.formValidation.projectDetails = "INVALID"
                return
              }
            });
            if(err.parsedLocation.name === "tasks" && (err.parsedLocation.children?.name !== "children")){
              this.formMeta.formValidation.tasks = "INVALID"
            }
            if(err.parsedLocation.name === "tasks" && err.parsedLocation.children?.name === "children"){
              this.formMeta.formValidation.subTasks = "INVALID"
            }
          });
        }
      })
      this.reviewErrors = errors
      this.setProjectErrorsFunc(errors)
    })
  }


  parseLocations(errors: any): Observable<any[]> {
    const pattern = /([a-zA-Z_]+)\[(\d+)\]/g;

    // Transform errors array and add parsedLocation to each error object
    const parsedErrors = errors.map((error: any) => {
      let match;
      let result: any = {};
      let input = error.location;
      let currentPointer = result;

      // Parse each level in location using regex pattern
      let lastMatchIndex = 0;
      while ((match = pattern.exec(input)) !== null) {
        const name = match[1];
        const index = parseInt(match[2], 10);

        // If we are at the last part, only add name and index
        if (pattern.lastIndex < input.length) {
          currentPointer.name = name;
          currentPointer.index = index;
          // Prepare the pointer for the next level (i.e., children)
          currentPointer.children = {};
          currentPointer = currentPointer.children;
        } else {
          // If it's the last part, only set the name and index
          currentPointer.name = name;
          currentPointer.index = index;
        }

        lastMatchIndex = pattern.lastIndex;
      }

      // If there is any remaining part of the location string that is not matched by the regex
      if (lastMatchIndex < input.length) {
        currentPointer.name = input.slice(lastMatchIndex);
      }

      return {
        ...error,
        parsedLocation: result
      };
    });

    // Return parsed errors as an observable
    return of(parsedErrors);
  }

  createOrUpdateProject(projectData?: any, projectId?: string | number,removeMetaData?:boolean) {
    this.projectData.title =
      this.projectData?.title?.length > 0
        ? this.projectData.title
        : 'Untitled project';
    this.setProjectData(this.projectData);
    this.saveProjectFunc(false);
    this.upDateProjectTitle();
    // to check is task Evidence required added in criteria or to remove criteria
    for (let key in projectData) {
      if (Array.isArray(projectData[key])) {
        projectData[key] = projectData[key].map((element: any) =>
          element.value ? element.value : element
        );
      }
      projectData[key] = projectData[key]?.value
        ? projectData[key].value
        : projectData[key];
    }
    const config = {
      url: projectId
        ? this.Configuration.urlConFig.PROJECT_URLS.CREATE_OR_UPDATE_PROJECT +
          '/' +
          projectId
        : this.Configuration.urlConFig.PROJECT_URLS.CREATE_OR_UPDATE_PROJECT,
      payload: projectData ? projectData : '',
    };
    // if(removeMetaData) {
    //   delete projectData.formMeta
    // }
    // else {
      projectData.formMeta = this.formMeta;
    // }
    return this.httpService.post(config.url, config.payload);
  }

  readProject(projectId: number | string) {
    return this.httpService.get(
      this.Configuration.urlConFig.PROJECT_URLS.READ_PROJECT + projectId
    );
  }
  // Getting form from api
  getForm(formBody: any) {
    const config = {
      url: this.Configuration.urlConFig.FORM_URLS.READ_FORM,
      payload: formBody,
    };
    return this.httpService.post(config.url, config.payload);
  }

  setFormMetaData() {
    this.formMeta = {
      formValidation:{
        projectDetails: 'INVALID',
        tasks: 'INVALID',
        subTasks: 'VALID',
        certificates: 'INVALID',
      },
      isCertificateSelected:'',
      isProjectEvidenceSelected:'0',
      taskEvidenceSelected:{}
    }
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

  upDateProjectTitle(title?: string) {
    const currentProjectMetaData = this.dataSubject.getValue();
    const updatedData = {
      ...currentProjectMetaData,
      sidenavData: {
        ...currentProjectMetaData.sidenavData,
        headerData: {
          ...currentProjectMetaData.sidenavData.headerData,
          title: title
            ? title
            : this.projectData?.title
            ? this.projectData?.title
            : 'PROJECT_NAME',
        },
      },
    };
    this.setData(updatedData);
  }

  deleteProject(projectId: number | string) {
    const config = {
      url: `${this.Configuration.urlConFig.PROJECT_URLS.CREATE_OR_UPDATE_PROJECT}/${projectId}`,
    };
    return this.httpService.delete(config.url);
  }

  getReviewerData() {
    const config = {
      url: this.Configuration.urlConFig.PROJECT_URLS.GET_REVIEWER_LIST,
    };
    return this.httpService.get(config.url);
  }

  setConfig() {
    const config = {
      url: this.Configuration.urlConFig.INSTANCES.CONFIG_LIST,
    };
    return this.httpService.get(config.url);
  }

  sendForReview(reviewers: any, projectId: any) {
    const config = {
      url: `${this.Configuration.urlConFig.PROJECT_URLS.SEND_FOR_REVIEW}/${projectId}`,
      payload: reviewers,
    };

    return this.httpService.post(config.url, config.payload);
  }

  startAutoSave(projectID: string | number, mode:any ="") {
    return interval(
      this.instanceConfig.auto_save_interval
        ? this.instanceConfig.auto_save_interval
        : 30000
    ).pipe(
      switchMap(() => {
        if(mode === solutionModes.META_EDIT && this.programData){
          this.programData.resources = this.programData.resources.map((resource:any) =>
            resource.id === this.projectData.id ? { ...this.projectData } : resource
          );
          return  this.updateProgramData(this.programData)
        }
        else if(this.isFormDirty && mode !== solutionModes.META_EDIT) {
          return this.createOrUpdateProject(
            this.projectData,
            this.projectData.id
          );
        }
        else {
          return EMPTY
        }
      })
    );
  }

  approveProject() {
    this.getcommentsListAsOpen().subscribe((res) => {
      this.utilService
        .approveResource(this.projectData.id, { comment: res })
        .subscribe((res: any) => {
          this.openSnackBarAndRedirect(
            res.message,
            'success',
            ROUTE_PATHS.SIDENAV.UP_FOR_REVIEW
          );
        });
    });
  }

  startOrResumeReview() {
    this.utilService
      .startOrResumeReview(this.projectData.id)
      .subscribe((data) => {
        this.router.navigate([PROJECT_DETAILS_PAGE], {
          queryParams: {
            projectId: this.projectData.id,
            mode: solutionModes.REVIEW,
            parent:"up-for-review"
          },
        });
      });
  }

  editProject() {
    if(this.projectData.status === resourceStatus.REQUEST_FOR_CHANGES){
      this.router.navigate([PROJECT_DETAILS_PAGE], {
        queryParams: {
          projectId: this.projectData.id,
          mode: solutionModes.REQUEST_FOR_EDIT,
          parent:"review"
        }
      });
    }else{
      this.router.navigate([PROJECT_DETAILS_PAGE], {
        queryParams: {
          projectId: this.projectData.id,
          mode: solutionModes.EDIT
        },
      });
    }

  }

  rejectProject(reason: any, isReported: any) {
    this.utilService
      .rejectOrReportedReview(
        this.projectData.id,
        reason ? { notes: reason } : {},
        isReported
      )
      .subscribe((res: any) => {
        this.openSnackBarAndRedirect(
          res.message,
          'success',
          ROUTE_PATHS.SIDENAV.UP_FOR_REVIEW
        );
      });
  }

  sendForRequestChange() {
    this.utilService.saveComment = false;
    this.getcommentsListAsOpen().subscribe((res) => {
      this.utilService
        .updateReview(this.projectData.id, { comment: res })
        .subscribe((data: any) => {
          this.openSnackBarAndRedirect(
            data.message,
            'success',
            ROUTE_PATHS.SIDENAV.UP_FOR_REVIEW
          );
        });
    });
  }

  checkValidationForRequestChanges(input:any = null) { // Method to check validation for enabling or disabling the 'REQUEST_CHANGES' button based on the content of `quillInput` and existing comments.
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

  changeCommentStatus(status:any){
    const currentProjectMetaData = this.dataSubject.getValue();
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

  getCertificatesList() {
    return this.httpService.get(this.Configuration.urlConFig.CERTIFICATE.LIST);
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

  getComments(): Observable<any[]> {
    return this.utilService
      .getCommentList(this.projectData.id)
      .pipe(map((response: any) => response.result.comments || []));
  }

  copyAndCreateProject(){
    const config = {
      url: this.Configuration.urlConFig.PROJECT_URLS.CREATE_OR_UPDATE_PROJECT +
          '?reference_id=' + this.projectData.id,
      payload: this.projectData,
    };
    return this.httpService.post(config.url, config.payload);
  }

  validateTasksData(){
    let projectMetaData:any;
    let pattern:any;
    if(this.currentProjectMetaData && this.projectData?.tasks && Array.isArray(this.projectData.tasks)){
    this.currentProjectMetaData.subscribe((data: any) => {
        projectMetaData = data;
        pattern = new RegExp(data?.tasksData.tasks.description.validators.pattern);
    });
    const isValid = this.projectData?.tasks.every((task: { name: string }) => {
      const isNameValid = task.name && task.name?.length > 0;
      const isMaxLengthValid = task?.name?.length <= projectMetaData?.tasksData.tasks.description.validators?.maxLength;
      const isPatternValid = pattern.test(task.name);
      const isTaskLength = this.projectData?.tasks?.length <= (this.projectConfig.max_task_count ? this.projectConfig.max_task_count :10)
      return isNameValid && isMaxLengthValid && isPatternValid && isTaskLength;
    });
    this.formMeta.formValidation.tasks = isValid ? "VALID" : "INVALID";
   }
  }

  removeItemFromAPIErrors(location:any) {
    this.reviewErrors = [...this.reviewErrors.filter((obj:any) => obj.location !== location)]
    this.setProjectErrorsFunc(this.reviewErrors);
  }

  readProgram(programId: number | string) {
    return this.httpService.get(
      this.Configuration.urlConFig.PROGRAM_URLS.READ_PROGRAM + programId
    );
  }

  updateProgramData(programData:any){
    const config = {
      url: this.Configuration.urlConFig.PROGRAM_URLS.CREATE_OR_UPDATE_PROGRAM +
          '/' +
          programData.id,
      payload:  programData
    };
    return this.httpService.post(config.url, config.payload);
  }
}
