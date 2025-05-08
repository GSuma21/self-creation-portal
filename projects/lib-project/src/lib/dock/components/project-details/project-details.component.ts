import { AfterViewChecked, Component, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { LibProjectService } from '../../../lib-project.service';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-suma';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { MatDialog } from '@angular/material/dialog';
import { CommentsBoxComponent, DialogPopupComponent, FormService, PROGRAM_RESOURCES, PROJECT_DETAILS, ToastService, UtilService, solutionModes,resourceStatus } from 'lib-shared-modules';
@Component({
  selector: 'lib-project-details',
  standalone: true,
  imports: [DynamicFormModule, TranslateModule,CommentsBoxComponent],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss',
})
export class ProjectDetailsComponent implements OnDestroy, OnInit, AfterViewChecked{
  dynamicFormData: any;
  projectId: string | number = '';
  intervalId:any;
  formDataForTitle:any;
  viewOnly:boolean= false;
  mode:any="";
  commentPayload:any;
  commentsList:any = [];
  projectInReview:boolean = false;
  isFormDirty:boolean = true;
  allowOpenLinks:boolean = false;
  resourceId:string|number = '' // This variable represent projectId for comments.
  ProgramResourceId:string|number = ''
  @ViewChild('formLib') formLib: MainFormComponent | undefined;
  language:any = JSON.parse(localStorage.getItem('preferred_language') ?? '{}')?.value ?? 'en';
  private subscription: Subscription = new Subscription();
  constructor(
    private libProjectService: LibProjectService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private formService: FormService,
    private utilService:UtilService,
    private toastService: ToastService,
  ) {
    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.mode = params.mode ? params.mode : ""
        this.ProgramResourceId = params.programResourceId;
      })
    )
    if(this.mode !== solutionModes.CREATOR_VIEW) {
      this.startAutoSaving()
    }
   }
   ngOnInit() {
    if(this.mode === solutionModes.META_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT){
       this.programResourceDetailsAndMap();
    }
    if(this.mode === solutionModes.EDIT || this.mode === "" || this.mode === solutionModes.REQUEST_FOR_EDIT){
      this.getFormWithEntitiesAndMap();
    }
    if (this.mode === solutionModes.VIEWONLY || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.COPY_EDIT || this.mode === solutionModes.META_REVIEW) {
      this.viewOnly = true
      this.getProjectDetailsForViewOnly();
    }
    this.subscription.add(
      this.libProjectService.isProjectSave.subscribe(
        (isProjectSave: boolean) => {
          if (isProjectSave && this.router.url.includes('project-details')) {
            this.saveForm();
          }
        }
      )
    );

    // save resource of program
    this.subscription.add(
      this.libProjectService.isProgramResourceSave.subscribe(
        (isProgramResourceSave: boolean) => {
          if (isProgramResourceSave) {
             this.libProjectService.programData.resources = this.libProjectService.programData.resources.map((resource:any) =>
              resource.id === this.libProjectService.projectData.id ? { ...this.libProjectService.projectData } : resource
            );
            this.libProjectService.updateProgramData(this.libProjectService.programData).subscribe((res:any)=>{
              this.toastService.openSnackBar({
                message: 'CHANGES_SAVED_SUCCESSFULLY',
                class: 'success',
              });
              this.libProjectService.saveProgramResourceFunc(false)
              this.router.navigate([PROGRAM_RESOURCES],{ queryParams: { parent: this.route.snapshot.queryParamMap.get('topLevelParent') ? this.route.snapshot.queryParamMap.get('topLevelParent'):'draft', programId: this.route.snapshot.queryParamMap.get('programId'), mode: this.route.snapshot.queryParamMap.get('parentMode') ? this.route.snapshot.queryParamMap.get('parentMode'): solutionModes.EDIT }});
            })
            }
          }
      )
    );
    this.subscription.add(
      this.libProjectService.projectApiErrors.subscribe(
        (errors: any) => {
          if(this.dynamicFormData) {
            for (let index = 0; index < errors.length; index++) {
              if(this.dynamicFormData.find((item:any) => item.name === errors[index].parsedLocation.name)?.errorMessage) {
               this.dynamicFormData.find((item:any) => item.name === errors[index].parsedLocation.name).errorMessage.pattern = errors[index].msg;
              }
               // this.dynamicFormData[errors[index].location].errorMessage.pattern = errors[index].msg;
               this.formLib?.myForm.controls[errors[index].location]?.setErrors({pattern:errors[index].msg})
             }
          }
        }
      )
    );
    this.subscription.add( // Check validation before sending for review.
      this.libProjectService.isSendForReviewValidation.subscribe(
        (reviewValidation: boolean) => {
          if(reviewValidation) {
            this.formMarkTouched();
            this.libProjectService.triggerSendForReview();
          }
        }
      )
    );

    this.subscription.add(  // set a language
      this.utilService.isLanguageChanges.subscribe(
        (language: boolean) => {
          if (language) {
            this.language = language
          }
        }
      )
    );
  }

  ngAfterViewChecked() {
    if((this.mode == solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) && this.projectId) {
      if (this.viewOnly) {
        this.viewOnly = false;
        this.getFormWithEntitiesAndMap();
      }
      if(this.formLib && this.libProjectService.tabValidation.projectDetails == "INVALID" && this.libProjectService.formMeta.formValidation.projectDetails == "INVALID" && this.formLib.myForm.pristine) {
          this.subscription.add(
            this.libProjectService.projectApiErrors.subscribe(
              (errors: any) => {
                for (let index = 0; index < errors.length; index++) {
                 if(this.dynamicFormData.find((item:any) => item.name === errors[index].parsedLocation.name)?.errorMessage) {
                  this.dynamicFormData.find((item:any) => item.name === errors[index].parsedLocation.name).errorMessage.pattern = errors[index].msg;
                 }
                  // this.dynamicFormData[errors[index].location].errorMessage.pattern = errors[index].msg;
                  this.formLib?.myForm.controls[errors[index].location]?.setErrors({pattern:errors[index].msg})
                }
              }
            )
          );
          this.formMarkTouched();
      }
      this.libProjectService.formMeta.formValidation.projectDetails = (this.formLib?.myForm.status === "VALID" && this.formLib?.subform?.myForm.status === "VALID") ? "VALID" : "INVALID";
      if(this.libProjectService.projectData.tasks && this.libProjectService.formMeta.formValidation.tasks !== "INVALID"){
        this.libProjectService.validateTasksData()
      }
    }
  }

  getProjectDetailsForViewOnly(){
    this.formService.getFormWithEntities(PROJECT_DETAILS).then((data) => {
      if (data) {
        this.formDataForTitle = data.controls.find((item:any) => item.name === 'title');
          this.subscription.add(
            this.route.queryParams.subscribe((params: any) => {
              this.projectId = params.projectId;
              if (params.projectId || this.ProgramResourceId ) {
                  if (Object.keys(this.libProjectService.projectData).length > 1) { // project ID will be there so length considered as more than 1
                    this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
                    this.checkAndGetCommentConfigs()
                  } else {
                    this.subscription.add(
                      this.libProjectService
                        .readProject(this.projectId ? this.projectId : this.ProgramResourceId)
                        .subscribe((res: any) => {
                          this.libProjectService.setProjectData(res.result);
                         this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
                          this.readProjectDeatilsAndMap(data.controls,res.result);
                          this.libProjectService.upDateProjectTitle();
                          this.checkAndGetCommentConfigs()
                        })
                    );
                  }
              }
            })
          );
      }
    })
  }

  checkAndGetCommentConfigs(){
    if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.META_REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.META_REQUEST_FOR_EDIT) && (this.mode !== solutionModes.VIEWONLY)) {
      this.getCommentConfigs()
    }
  }

  getCommentConfigs() {
    this.commentsList = []
    this.subscription.add(
      this.route.data.subscribe((data: any) => {
        this.utilService.getCommentList(this.projectId ? this.projectId : this.ProgramResourceId).subscribe((commentListRes: any) => {
          const comments = commentListRes.result?.comments || [];
          const filteredComments = this.utilService.filterCommentByContext(comments, data.page);

          this.commentsList = this.commentsList.concat(filteredComments);
          this.commentPayload = data;
          this.projectInReview = this.mode === solutionModes.REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT ||  this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.META_REVIEW ;
          this.libProjectService.checkValidationForRequestChanges(comments);
        });
      })
    );
  }


  getFormWithEntitiesAndMap(){
    this.formService.getFormWithEntities(PROJECT_DETAILS).then((data) => {
      if (data) {
        this.formDataForTitle = data.controls.find((item:any) => item.name === 'title');
        this.subscription.add(
          this.route.queryParams.subscribe((params: any) => {
            this.projectId = params.projectId;
            this.libProjectService.projectData.id = params.projectId;
            if (params.projectId) {
              if (params.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT) {
                if (Object.keys(this.libProjectService.projectData).length > 1) { // project ID will be there so length considered as more than 1
                  this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
                } else {
                  this.subscription.add(
                    this.libProjectService
                      .readProject(this.projectId)
                      .subscribe((res: any) => {
                        this.libProjectService.setProjectData(res.result);
                       this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
                        this.readProjectDeatilsAndMap(data.controls,res.result);
                        this.libProjectService.upDateProjectTitle();
                        // comments list and configuration
                      })
                  );
                }
                this.checkAndGetCommentConfigs()
              }else{
                if (Object.keys(this.libProjectService.projectData).length > 1) { // project ID will be there so length considered as more than 1
                  this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
                } else {
                  this.subscription.add(
                    this.libProjectService
                      .readProject(this.projectId)
                      .subscribe((res: any) => {
                        this.libProjectService.setProjectData(res.result);
                       this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
                        this.readProjectDeatilsAndMap(data.controls,res.result);
                        // comments list and configuration
                      })
                  );
                }
                this.checkAndGetCommentConfigs()
              }
            } else {
              this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
            }
          })
        );
      }
    });
    this.libProjectService.currentProjectMetaData.subscribe(data => {
      this.allowOpenLinks =  data?.tasksData.allowOpenLinks;
    })
  }

  programResourceDetailsAndMap(){
    this.formService.getFormWithEntities(PROJECT_DETAILS).then((data) => {
      if (data) {
        this.route.queryParams.subscribe((params: any) => {
          let programId = params.programId;
          let programResourceId = params.programResourceId;
          this.subscription.add(
            this.libProjectService
              .readProgram(programId)
              .subscribe((res: any) => {
                this.libProjectService.programData = res.result;
               const matchedResource = res.result.resources.find((resource:any) =>resource.id == params.programResourceId);
               this.readProjectDeatilsAndMap(data.controls,matchedResource)
               this.libProjectService.setProjectData(matchedResource);
               this.libProjectService.formMeta = matchedResource.formMeta ? matchedResource.formMeta : this.libProjectService.formMeta;
               this.libProjectService.upDateProjectTitle()
               if(programId) {
                this.checkAndGetCommentConfigs();
               }
            }))
        })
      }
    })
  }
  readProjectDeatilsAndMap(formControls:any,res: any) {
    formControls.forEach((element: any) => {
      if (Array.isArray(res[element.name])) {
        element.value = res[element.name].map((arrayItem: any) => {
          return arrayItem.value ? arrayItem.value : arrayItem;
        });
      } else {
          if(res[element.name]) {
            element.value = res[element.name].value ? res[element.name].value : res[element.name];
          }
      }
      if (element.subfields) {
        element.subfields.forEach((subElement: any) => {
          subElement.value = res[element.name]?.[subElement.name]?.value
            ? res[element.name]?.[subElement.name].value
            : res[element.name]?.[subElement.name];
        });
      }

      if(this.mode === solutionModes.META_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT){
        this.allowEditForMetaData(element)
      }
    });
    this.dynamicFormData = formControls;
    if( this.formLib){
      this.libProjectService.formMeta.formValidation.projectDetails = ( this.formLib?.myForm.status === "INVALID" || this.formLib?.subform?.myForm.status === "INVALID") ? "INVALID" : "VALID";
    }
    if(this.libProjectService.projectData.tasks && this.libProjectService.formMeta.formValidation.tasks !== "INVALID"){
      this.libProjectService.validateTasksData()
    }
  }

  allowEditForMetaData(formControls:any){
    const metaFields = [
      "title",
      "categories",
      "objective",
      "recommended_duration",
      "keywords",
      "recommended_for",
      "languages",
    ]

    if (!metaFields.includes(formControls.name)) {
      formControls.viewOnly = true;
    }
    this.dynamicFormData = formControls;
  }
  startAutoSaving() {
      this.intervalId = setInterval(() => {
        if((this.mode === solutionModes.META_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT) && !this.projectId){
          this.libProjectService.programData.resources = this.libProjectService.programData.resources.map((resource:any) =>
            resource.id === this.libProjectService.projectData.id ? { ...this.libProjectService.projectData } : resource
          );
          this.libProjectService.updateProgramData(this.libProjectService.programData).subscribe((res:any)=>{})
        }
        else if(!this.projectId && this.mode !== solutionModes.META_EDIT && this.mode != solutionModes.META_REVIEW) {
          this.createProject({title:'Untitled project'})
        } else {
          if((this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) && this.isFormDirty && this.mode != solutionModes.META_REVIEW) {
            this.subscription.add(this.libProjectService.createOrUpdateProject(this.libProjectService.projectData, this.projectId).subscribe((res:any)=>{
              this.isFormDirty = false;
            }))
          }
        }
      }, 30000);

  }
  createProject(payload?:any,showToast?:boolean) { // title should be send from calling methods only, due to title can be filled before project creation
      this.libProjectService
      .createOrUpdateProject(payload)
      .subscribe((res: any) => {
        (this.projectId = res.result.id),
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              projectId: this.projectId,
              mode: solutionModes.EDIT,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          this.libProjectService.projectData.id = res.result.id;
          if(showToast) {
            this.toastService.openSnackBar({
              message: res.message,
              class: 'success',
            })
          }
      })
  }

  saveForm() {
    if (this.libProjectService.projectData.title) {
      this.libProjectService.formMeta.formValidation.projectDetails = (this.formLib?.myForm.status === "INVALID" || this.formLib?.subform?.myForm.status === "INVALID") ? "INVALID" : "VALID";
      if (this.projectId) {
        this.libProjectService.updateProjectDraft(this.projectId).subscribe();
      }
      else {
        return this.createProject({title:this.libProjectService.projectData.title},true)
      }
    } else {
      const dialogRef = this.dialog.open(DialogPopupComponent, {
        width: '39.375rem',
        disableClose: true,
        autoFocus : false,
        data: {
          header: 'SAVE_CHANGES',
          content: 'ADD_TITLE_TO_CONTINUE_SAVING',
          form:[this.formDataForTitle],
          exitButton: 'CONTINUE',
          language:this.language
        },
      });
      return dialogRef
        .afterClosed()
        .toPromise()
        .then((result) => {
           if (result.data === 'CONTINUE') {
            if(result.title){
              this.libProjectService.upDateProjectTitle(result.title);
              this.libProjectService.setProjectData({title:result.title});
              if (this.projectId) {
                this.libProjectService.updateProjectDraft(this.projectId).subscribe();
              }
              else {
                return this.createProject(this.libProjectService.projectData,true)
              }
              this.getFormWithEntitiesAndMap()
              this.saveForm()
            }
            return true;
          } else {
            return false;
          }
        });
    }
  }
  getDynamicFormData(data: any) {
    const obj: { [key: string]: any } = {};
    if (!this.isEvent(data)) {
    this.isFormDirty = true;
    if(this.libProjectService.projectData.title != data.title) {
      this.libProjectService.upDateProjectTitle(data.title? data.title : 'PROJECT_NAME');
      }
    this.libProjectService.setProjectData(data);
    this.libProjectService.formMeta.formValidation.projectDetails = (this.formLib?.myForm.status === "INVALID" || this.formLib?.subform?.myForm.status === "INVALID") ? "INVALID" : "VALID";
    }
  }

  getFormControlChange(item:string) {
    if(item) {
      this.libProjectService.removeItemFromAPIErrors(item);
    }
  }
  isEvent(data:any) {
    return typeof data === 'object' && data !== null &&
           'type' in data && 'target' in data &&
           typeof data.preventDefault === 'function' &&
           typeof data.stopPropagation === 'function';
  };
  ngOnDestroy() {
    this.libProjectService.formMeta.formValidation.projectDetails = ( this.formLib?.myForm.status === "INVALID" || this.formLib?.subform?.myForm.status === "INVALID") ? "INVALID" : "VALID";
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if(this.utilService.saveResources && this.mode != solutionModes.META_REVIEW){
      if(this.mode === solutionModes.META_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT){
        this.libProjectService.programData.resources = this.libProjectService.programData.resources.map((resource:any) =>
          resource.id === this.libProjectService.projectData.id ? { ...this.libProjectService.projectData } : resource
        );
        this.libProjectService.updateProgramData(this.libProjectService.programData).subscribe((res:any)=>{})
      }
      if(this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT){
        if(this.libProjectService.projectData.id) {
          this.libProjectService.createOrUpdateProject(this.libProjectService.projectData,this.projectId).subscribe((res)=> console.log(res))
        }
      }
    }
    if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.META_REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW  ) && (this.mode !== solutionModes.VIEWONLY)) {
      this.libProjectService.checkValidationForRequestChanges()
    }
    // if(this.mode.length==0 && this.route.snapshot.queryParamMap.get('parent') == 'create') {
    //   this.createProject()
    // }
    this.libProjectService.saveProjectFunc(false);
    this.subscription.unsubscribe();
  }
  formMarkTouched() {
    this.formLib?.myForm.markAllAsTouched()
    this.formLib?.subform?.myForm.markAllAsTouched()
  }

  saveComment(quillInput:any){ //  This method is checking validation when a comment is updated or deleted.
    this.libProjectService.checkValidationForRequestChanges(quillInput)
  }
}
