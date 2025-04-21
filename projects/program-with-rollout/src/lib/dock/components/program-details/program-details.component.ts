import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-suma';
import { CommentsBoxComponent, DialogPopupComponent, FormService, solutionModes, PROGRAM_DETAILS, resourceStatus, ToastService, UtilService } from 'lib-shared-modules';
import { Subscription } from 'rxjs/internal/Subscription';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'lib-program-details',
  standalone: true,
  imports: [DynamicFormModule, TranslateModule,CommentsBoxComponent],
  templateUrl: './program-details.component.html',
  styleUrl: './program-details.component.scss'
})
export class ProgramDetailsComponent {
  @ViewChild('formLib') formLib!: MainFormComponent;
  private subscription: Subscription = new Subscription();
  allowOpenLinks = true;
  viewOnly = false;
  dynamicFormData:any;
  intervalId:any;
  programId:any;
  mode:any;
  formDataForTitle:any
  commentPayload: any;
  commentsList: any = [];
  ResourceInReview: boolean = false;
  language:any =  JSON.parse(localStorage.getItem('preferred_language') ?? '{}')?.value ?? 'en';

  constructor( private formService: FormService,private dialog:MatDialog, private programWithRolloutService:ProgramWithRolloutService,  private router: Router,
      private route: ActivatedRoute, private toastService: ToastService, private utilService: UtilService) {
      this.subscription.add(
        this.route.queryParams.subscribe((params: any) => {
          this.mode = params.mode ? params.mode : ""
        })
      )
      this.programId =  this.route.snapshot.queryParamMap.get('programId');
     }

  ngOnInit() {
    this.getFormWithEntitiesAndMap()
    this.subscription.add(
      this.programWithRolloutService.isProgramSave.subscribe(
        (isProgramSave: boolean) => {
          if (isProgramSave) {
            this.saveForm();
          }
        }
      )
    );
    if (this.mode === solutionModes.VIEWONLY || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.COPY_EDIT) {
      this.viewOnly = true
      // this.getProjectDetailsForViewOnly();
    }
    else {
      this.startAutoSaving()
      this.programWithRolloutService.removeQueryParam()
    }
    if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.CREATOR_VIEW) && (this.mode !== solutionModes.VIEWONLY)) {
      this.getCommentConfigs()
    }
    this.subscription.add( // Check validation before sending for review.
      this.programWithRolloutService.isProgramSendForReviewValidation.subscribe(
        (reviewValidation: boolean) => {
          if (reviewValidation) {
            this.programWithRolloutService.formMeta.formValidation.programDetails = this.formLib?.myForm.status
            this.programWithRolloutService.formMeta.formValidation.programResources = this.programWithRolloutService.programData.resources?.length > 0 ? 'VALID' : 'INVALID'
            this.formLib?.myForm.markAllAsTouched()
            this.programWithRolloutService.triggerProgramSendForReview();
          }
        }
      )
    );
    if(!this.programWithRolloutService.formMeta.formValidation) {
      this.programWithRolloutService.setValidationForProgram();
      this.programWithRolloutService.formMeta = this.programWithRolloutService.formMeta
    }
    this.programWithRolloutService.formMeta.formValidation.programDetails = this.formLib?.myForm.status ? this.formLib?.myForm.status : "INVALID"


    this.subscription.add(
      this.programWithRolloutService.programApiErrors.subscribe(
        (errors: any) => {
          if (this.dynamicFormData) {
            for (let index = 0; index < errors.length; index++) {
              if (errors[index].location === 'program' && this.dynamicFormData.find((item: any) => item.name === errors[index].param)?.errorMessage) {
                this.dynamicFormData.find((item: any) => item.name === errors[index].param).errorMessage.pattern = errors[index].msg;
              }
              // this.dynamicFormData[errors[index].location].errorMessage.pattern = errors[index].msg;
              if(errors[index].location === 'program'){
                this.formLib?.myForm.controls[errors[index].param]?.setErrors({ pattern: errors[index].msg })
              }
            }
          }
        }
      )
    );

    this.subscription.add( // Check validation before publishing published program.
      this.programWithRolloutService.isProgramPublishalidation.subscribe(
        (programValidation: boolean) => {
          if (programValidation) {
            this.programWithRolloutService.formMeta.formValidation.programDetails = this.formLib?.myForm.status
            this.programWithRolloutService.formMeta.formValidation.programResources = this.programWithRolloutService.programData.resources?.length > 0 ? 'VALID' : 'INVALID'
            this.formLib?.myForm.markAllAsTouched()
            this.programWithRolloutService.triggerPublishProgram();
          }
        }
      )
    );
    this.subscription.add( // Check validation before sending for review.
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
    if ((this.mode == solutionModes.EDIT || this.mode == solutionModes.REQUEST_FOR_EDIT ||  this.mode == solutionModes.META_EDIT) && this.programId) {
      if (this.viewOnly) {
        this.viewOnly = false;
        this.getFormWithEntitiesAndMap();
      }
      if (this.formLib && this.programWithRolloutService.tabValidationForProgram.programDetails == 'INVALID' && this.programWithRolloutService.formMeta.formValidation.programDetails == "INVALID" && this.formLib.myForm.pristine) {
        this.subscription.add(
          this.programWithRolloutService.programApiErrors.subscribe(
            (errors: any) => {
              for (let index = 0; index < errors.length; index++) {
                if (errors[index].location === 'program' && this.dynamicFormData.find((item: any) => item.name === errors[index].param)?.errorMessage) {
                  this.dynamicFormData.find((item: any) => item.name === errors[index].param).errorMessage.pattern = errors[index].msg;
                }
                // this.dynamicFormData[errors[index].location].errorMessage.pattern = errors[index].msg;
                if(errors[index].location === 'program'){
                  this.formLib?.myForm.controls[errors[index].param]?.setErrors({ pattern: errors[index].msg })
                }
              }
            }
          )
        );
        this.formLib?.myForm.markAllAsTouched()
      }
      if(!this.programWithRolloutService.formMeta.formValidation) {
        this.programWithRolloutService.setValidationForProgram();
        this.programWithRolloutService.formMeta = this.programWithRolloutService.formMeta
      }
      this.programWithRolloutService.formMeta.formValidation.programDetails = (this.formLib?.myForm.status) ? this.formLib?.myForm.status : "INVALID";
    }
  }

    getFormWithEntitiesAndMap(){
        this.formService.getFormWithEntities(PROGRAM_DETAILS).then((data) => {
          data.controls.forEach((control:any) => {
            if (control.name === "viewers") {
              this.subscription.add(
                this.programWithRolloutService.getDataManagerList('programs').subscribe((dataManagerList:any)=> {
                  const items = dataManagerList.result?.data || []; // Access the array safely
                  const formattedOptions = items.map((item: any) => ({
                      label: item.name,
                      value: item.id
                  }));
                  control.options = [...formattedOptions];
                  })
              )
              }
            })
          this.formDataForTitle = data.controls.find((item:any) => item.name === 'title');
          if (data) {
            this.formDataForTitle = data.controls.find((item:any) => item.name === 'title');
            this.subscription.add(
              this.route.queryParams.subscribe((params: any) => {
                this.programId = params.programId;
                this.programWithRolloutService.programData.id = params.programId;
                if (params.programId) {
                  if (params.mode === solutionModes.EDIT) {
                    if (Object.keys(this.programWithRolloutService.programData).length > 1) {
                      this.readProgramDeatilsAndMap(data.controls, this.programWithRolloutService.programData);
                    } else {
                      this.subscription.add(
                        this.programWithRolloutService
                          .readProgram(this.programId)
                          .subscribe((res: any) => {
                            // this.programWithRolloutService.tabValidationForProgram = res.result.metaData
                            this.programWithRolloutService.formMeta.formValidation = res.result.metaData
                            if(res.result.status === resourceStatus.PUBLISHED && res.result.is_under_edit == false ){
                              this.programWithRolloutService.formMeta.publishedStartDate = res.result.start_date
                            }
                            this.programWithRolloutService.setProgramData(res.result);
                            this.readProgramDeatilsAndMap(data.controls, res.result);
                            this.programWithRolloutService.upDateProgramTitle();
                          })
                      );
                    }
                  } else {
                    if (Object.keys(this.programWithRolloutService.programData).length > 1) {
                      this.readProgramDeatilsAndMap(data.controls, this.programWithRolloutService.programData);
                    } else {
                      this.subscription.add(
                        this.programWithRolloutService
                          .readProgram(this.programId)
                          .subscribe((res: any) => {
                            // this.programWithRolloutService.tabValidationForProgram = res.result.metaData
                            this.programWithRolloutService.formMeta.formValidation = res.result.metaData
                            if(res.result.status === resourceStatus.PUBLISHED && res.result.is_under_edit == false ){
                              this.programWithRolloutService.formMeta.publishedStartDate = res.result.start_date
                            }
                            this.programWithRolloutService.setProgramData(res.result);
                            //  this.programWithRolloutService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
                            this.readProgramDeatilsAndMap(data.controls, res.result);
                            this.programWithRolloutService.upDateProgramTitle();
                            // comments list and configuration
                          })
                      );
                    }
                  }
                } else {
                  this.readProgramDeatilsAndMap(data.controls,this.programWithRolloutService.programData);
                }
              })
            );
          }
        });
        // this.libProjectService.currentProjectMetaData.subscribe(data => {
        //   this.allowOpenLinks =  data?.tasksData.allowOpenLinks;
        // })
      }
      readProgramDeatilsAndMap(formControls:any,res: any) {
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
          if (element.name === "viewers") {
            if(Array.isArray(element.value) && element.value.every((item:any) => typeof item !== 'number')){
              element.value = element.value.map((item: any) => item.id);
            }
          }

          if(this.mode === solutionModes.META_EDIT){
            this.allowEditForMetaData(element)
          }
        });
        if((this.programWithRolloutService.programData.published_on) && (this.mode === solutionModes.META_EDIT || this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT)){
          // check the program is started or not , if started start date  is not editable.
          const currentFormatedDate = (typeof(new Date()) === 'object') ? new Date(new Date()).toISOString(): new Date()
          const startDateField = formControls.find((field:any) => field.name === 'start_date');

          if (startDateField && startDateField.value) {
            this.programWithRolloutService.programData.start_date = (typeof(this.programWithRolloutService.programData?.start_date) === 'object') ? new Date(this.programWithRolloutService.programData?.start_date).toISOString(): this.programWithRolloutService.programData?.start_date 
            this.programWithRolloutService.programData.metaData.publishedStartDate  = this.programWithRolloutService.formMeta.publishedStartDate ? (typeof(this.programWithRolloutService.formMeta.publishedStartDate ) === 'object') ? new Date(this.programWithRolloutService.formMeta.publishedStartDate ).toISOString():this.programWithRolloutService.formMeta.publishedStartDate : (typeof(this.programWithRolloutService.programData.metaData.publishedStartDate ) === 'object') ? new Date(this.programWithRolloutService.programData.metaData.publishedStartDate ).toISOString():this.programWithRolloutService.programData.metaData.publishedStartDate ;
            const startDate = this.programWithRolloutService.programData.metaData.publishedStartDate  ? this.programWithRolloutService.programData.metaData.publishedStartDate  : this.programWithRolloutService.programData.start_date
            if (currentFormatedDate >= startDate) {
              formControls.forEach((field:any) => {
                if (field.name === "start_date") {
                    field.viewOnly = true;
                }
            });
            }
          }
          this.dynamicFormData = formControls;
        }else{
          this.dynamicFormData = formControls;
        }
      }

  getDynamicFormData(data:any){
    this.programWithRolloutService.formMeta.formValidation.programDetails = this.formLib?.myForm.status
    if(this.formLib?.myForm.status == "VALID") {
      this.programWithRolloutService.tabValidationForProgram.programDetails = this.formLib?.myForm.status
    }
    this.programWithRolloutService.setProgramData(data)
    this.programWithRolloutService.upDateProgramTitle(data.title)
    if(data.viewers.every((item:any) => typeof item === "object" && item !== null)){
      this.programWithRolloutService.programData.viewers = data?.viewers.map((item:any) => item.id? item.id : item.value);
    }
    if(this.programWithRolloutService.programData?.resources){
      this.programWithRolloutService.updateResourceTargetCriteria();
    }
  }

  getFormControlChange(item:any) {
    if(this.programWithRolloutService.programData.status == resourceStatus.PUBLISHED && (item?.name == 'start_date' || item?.name == 'end_date')){
      if(item.value !== this.programWithRolloutService.programData.start_date || item.value !== this.programWithRolloutService.programData.end_date ){
        this.changeResourceLevelTargetingToast()
      }
    }
    if(item) {
      this.programWithRolloutService.removeItemFromAPIErrors(item);
    }
  }


   /**
   * Handles click events triggered by controls.
   * Opens a dialog with predefined configurations and listens for the dialog close event.
   * Currently supports the "targeting_criteria" control name.
   *
   * @param control - The control object containing the name and associated data.
   */
    onClickTriggeredParent(control: any) {
      switch (control.name) {
        case "targeting_criteria":
          const dialogRef = this.dialog.open(TargetCriteriaComponent, {
            width: '80%',
            height: '80%',
            disableClose: true,
            autoFocus: false,
            data:{
              data: null,
              targeting_criteria:this.programWithRolloutService.programData.targeting_criteria,
              language:this.language
            },
          });

          dialogRef.afterClosed().subscribe((res: any) => {
            this.dynamicFormData.forEach((element:any) => {
              if(element.name == "targeting_criteria" && res) {

                element.value = this.programWithRolloutService.checkAndUpdateTargetCriteria(res,this.programWithRolloutService.programData.targeting_criteria)
                if (this.programWithRolloutService.programData.status === resourceStatus.PUBLISHED && ( JSON.stringify(res) !== JSON.stringify(this.programWithRolloutService.programData.targeting_criteria))) {
                  this.changeResourceLevelTargetingToast()
                }
                this.formLib.myForm.patchValue({ // adding target criteria to form
                  targeting_criteria: element.value,
                });
              }
            })
            this.updateTargetCriteria()
          });
          break;
        default:
          break;
      }
    }

    /**
   * Handles action events triggered by controls.
   * Performs operations based on the "action" property of the control, such as "VIEW", "EDIT", or "DELETE".
   *
   * @param control - The control object containing the action and associated item with an index.
   */
    onActionTriggeredParent(control:any){
      switch (control.action) {
        case "VIEW":
          break;
        case "EDIT":
          const dialogEditRef = this.dialog.open(TargetCriteriaComponent, {
            width: '80%',
            height: '80%',
            disableClose: true,
            autoFocus: false,
            data:{
              data: {...control.item,...{readOnly:false,mode:this.mode,page:'program-details'}},
              targeting_criteria:this.programWithRolloutService.programData.targeting_criteria,
              language: this.language
            },
          });

          dialogEditRef.afterClosed().subscribe((res: any) => {
            if(res) {
              this.dynamicFormData.forEach((element:any) => {
                if(element.name == "targeting_criteria") {
                  element.value.splice(control.index, 1,res);
                  this.formLib.myForm.patchValue({ // adding target criteria to form
                    targeting_criteria: element.value,
                  });
                  if (this.programWithRolloutService.programData.status === resourceStatus.PUBLISHED && ( JSON.stringify(res) !== JSON.stringify(control.item))) {
                    this.changeResourceLevelTargetingToast()
                  }
                }
              })
              this.updateTargetCriteria()
            }
          });
          break;
        case "DELETE":
          const dialogRef = this.dialog.open(DialogPopupComponent, {
            width: '39.375rem',
            disableClose: true,
            data: {
              header: "DELETE_TARGETING_DETAILS",
              content: "DELETE_TARGETING_DETAILS_MESSAGE",
              cancelButton: "CANCEL",
              exitButton: "DELETE"
            }
          });
          dialogRef.afterClosed().subscribe((res: any) => {
            if(res.data == "DELETE"){
              this.dynamicFormData.forEach((element:any) => {
                if(element.name == "targeting_criteria") {
                  element.value.splice(control.index, 1);
                  this.formLib.myForm.patchValue({ // adding target criteria to form
                    targeting_criteria: element.value,
                  });
                  if (this.programWithRolloutService.programData.status === resourceStatus.PUBLISHED && (JSON.stringify(res) !== JSON.stringify(this.programWithRolloutService.programData.targeting_criteria))) {
                    this.changeResourceLevelTargetingToast()
                  }
                }
              })
              this.updateTargetCriteria()
            }
          });
          break;
        default:
          break;
      }

    }

    updateTargetCriteria(){
      this.programWithRolloutService.programData.targeting_criteria =  this.dynamicFormData.find((element: any) => element.name === "targeting_criteria")?.value;
      this.programWithRolloutService.updateResourceTargetCriteria();
      this.subscription.add(
      this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData, this.programId).subscribe((res:any)=>{}))
    }

     startAutoSaving() {
        this.intervalId = setInterval(() => {
          if(!this.programId && !this.viewOnly) {
            this.createProgram({title:this.programWithRolloutService.programData.title ? this.programWithRolloutService.programData.title : 'Untitled program'})
          } else {
            if(this.mode === solutionModes.EDIT || this.mode === solutionModes.META_EDIT) {
              this.subscription.add(
                this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData, this.programId).subscribe((res:any)=>{}))
            }
          }
        }, 30000);
      }


      createProgram(payload?:any,showToast?:boolean) { // title should be send from calling methods only, due to title can be filled before program creation
        this.subscription.add(
          this.programWithRolloutService
          .createOrUpdateProgram(payload)
          .subscribe((res: any) => {
            (this.programId = res.result.id),
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                  programId: this.programId,
                  mode: solutionModes.EDIT,
                },
                queryParamsHandling: 'merge',
                replaceUrl: true,
              });
              this.programWithRolloutService.programData.id = res.result.id;
              if(showToast) {
                this.toastService.openSnackBar({
                  message: res.message,
                  class: 'success',
                })
              }
          })
        )
    }

  saveForm() {
    this.programWithRolloutService.saveProgramFunc(false);
    if (this.programWithRolloutService.programData.title) {
      // this.programWithRolloutService.formMeta.formValidation.projectDetail = (this.formLib?.myForm.status === "INVALID" || this.formLib?.subform?.myForm.status === "INVALID") ? "INVALID" : "VALID";
      if (this.programId) {
        return this.subscription.add(
          this.programWithRolloutService.updateProgramDraft(this.programId).subscribe()
        )
      }
      else {
        return this.subscription.add(
          this.createProgram({ title: this.programWithRolloutService.programData.title ? this.programWithRolloutService.programData.title : 'Untitled program' }, true)
        )
      }
    } else {
      const dialogRef = this.dialog.open(DialogPopupComponent, {
        width: '39.375rem',
        disableClose: true,
        autoFocus: false,
        data: {
          header: 'SAVE_CHANGES',
          content: 'ADD_TITLE_TO_CONTINUE_SAVING',
          form: [this.formDataForTitle],
          exitButton: 'CONTINUE',
          language:this.language
        },
      });
      return dialogRef
        .afterClosed()
        .toPromise()
        .then((result) => {
          if (result.data === 'CONTINUE') {
            if (result.title) {
              this.programWithRolloutService.upDateProgramTitle(result.title);
              this.programWithRolloutService.setProgramData({ title: result.title });
              if (this.programId) {
                this.programWithRolloutService.updateProgramDraft(this.programId).subscribe();
              }
              else {
                return this.createProgram(this.programWithRolloutService.programData, true)
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

  getCommentConfigs() {
    this.commentsList = []
    this.subscription.add(
      this.route.data.subscribe((data: any) => {
        this.utilService.getCommentList(this.programId).subscribe((commentListRes: any) => {
          const comments = commentListRes.result?.comments || [];
          const filteredComments = this.utilService.filterCommentByContext(comments, data.page);

          this.commentsList = this.commentsList.concat(filteredComments);
          this.commentPayload = data;
          this.ResourceInReview = this.mode === solutionModes.REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT ||  this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW ;
          this.programWithRolloutService.checkValidationForRequestChanges(comments, commentListRes.result?.childResources);
        });
      })
    );
  }

  saveComment(quillInput:any){ //  This method is checking validation when a comment is updated or deleted.
    this.programWithRolloutService.checkValidationForRequestChanges(quillInput)
  }

  ngOnDestroy() {
    if(this.programWithRolloutService.formMeta?.formValidation) {
      this.programWithRolloutService.formMeta.formValidation.programDetails = this.formLib?.myForm.status
    }
    if (this.programWithRolloutService.programData.id && this.utilService.saveResources && (this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.META_EDIT || this.mode === solutionModes.RESOURCE_EDIT)) {
      this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData, this.programId).subscribe()
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subscription.unsubscribe();
  }

  allowEditForMetaData(formControls: any) {
    const metaFields = [
      "targeting_criteria",
      "start_date",
      "end_date",
      "viewers",
    ]

    if (!metaFields.includes(formControls.name)) {
      formControls.viewOnly = true;
    }
    this.dynamicFormData = formControls;
  }

  changeResourceLevelTargetingToast(){
    this.toastService.openSnackBar({
      message: 'CHANGE_RESOURCE_LEVEL_TARGETING_TO_PUBLISH_PROGRAM',
      class: 'error',
    });
    this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting = "INVALID"
    this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting = "INVALID"
  }
}
