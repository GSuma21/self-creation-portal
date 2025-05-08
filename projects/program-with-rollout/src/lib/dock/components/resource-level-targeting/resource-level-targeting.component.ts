import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router, ActivatedRoute } from '@angular/router';
import {
  CardComponent,
  CommentsBoxComponent,
  FormService,
  solutionModes,
  resourceStatus,
  SOLUTION_LIST,
  ToastService,
  UtilService,
  CHOOSE_RESOURCES,
} from 'lib-shared-modules';

import { min, Subscription } from 'rxjs';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MatFormField,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';
import { MatTooltip } from '@angular/material/tooltip';
import {MatTooltipModule} from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-resource-level-targeting',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    MatIconModule,
    MatLabel,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    CommentsBoxComponent,
    TranslateModule
  ],
  templateUrl: './resource-level-targeting.component.html',
  styleUrl: './resource-level-targeting.component.scss',
})
export class ResourceLevelTargetingComponent implements OnInit {
  resourceCount: any = 0;
  resources: any=[];
  parent: any;
  resourceIds: any = [];
  programId: any;
  resourceForm: any;
  private subscription: Subscription = new Subscription();
  mode:string = '';
  viewOnly:boolean = false;
  commentPayload: any;
  commentsList: any = [];
  ResourceInReview: boolean = false;
  language:any =  JSON.parse(localStorage.getItem('preferred_language') ?? '{}')?.value ?? 'en';

  constructor(
    private formService: FormService,
    private router: Router,
    private route: ActivatedRoute,
    private programWithRolloutService: ProgramWithRolloutService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private dialog: MatDialog,
    private utilService: UtilService
  ) {
    this.parent = this.route.snapshot.queryParamMap.get('parent');
    this.route.queryParamMap.subscribe((params) => {
      this.resourceIds = params.getAll('resourceIds').map((id) => Number(id));
      this.programId = this.route.snapshot.queryParamMap.get('programId');
    });
    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.mode = params.mode ? params.mode : ""
      })
    )
  }

  ngOnInit() {
    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.mode = params.mode ? params.mode : ""
      })
    )
    if(this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) {
      this.programWithRolloutService.removeQueryParam()
    }
    this.initForm();
    if (this.resourceIds.length) {
      this.subscription.add(
        this.programWithRolloutService
          .addResourceToProgram(
            { resource_ids: this.resourceIds },
            this.programId
          )
          .subscribe((res: any) => {
            const updatedParams = {
              parent: this.parent,
              programId: this.programId,
            };
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { parent: this.parent, programId: this.programId },
            });
            // Optionally, clear resourceIds in your component
            this.resourceIds = [];

            if (Object.keys(this.programWithRolloutService.programData).length > 1) {
              this.resourceCount =
                this.programWithRolloutService.programData.resources?.length;
              this.resources = (this.programWithRolloutService.programData.published_on && (this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT)) ? this.programWithRolloutService.programData.resources.slice().reverse():  this.programWithRolloutService.programData.resources
              if(this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) {
                this.programWithRolloutService.tabValidationForProgram.programResources =  (this.programWithRolloutService.programData.resources?.length > 0) ? 'VALID' : 'INVALID'
                this.programWithRolloutService.removeQueryParam()
              }
            } else {
              this.subscription.add(
                this.programWithRolloutService
                  .readProgram(this.programId)
                  .subscribe((res: any) => {
                    // this.programWithRolloutService.tabValidationForProgram = res.result.metaData
                    this.programWithRolloutService.formMeta.formValidation = res.result.metaData
                    this.programWithRolloutService.setProgramData(res.result);
                    this.programWithRolloutService.upDateProgramTitle(res.result.title);
                    this.resourceCount =
                      this.programWithRolloutService.programData.resources?.length;
                    this.resources = (this.programWithRolloutService.programData.published_on && (this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT)) ? this.programWithRolloutService.programData.resources.slice().reverse():  this.programWithRolloutService.programData.resources
                    if(this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) {
                      this.programWithRolloutService.tabValidationForProgram.programResources =  (this.programWithRolloutService.programData.resources?.length > 0) ? 'VALID' : 'INVALID'
                      this.programWithRolloutService.removeQueryParam()
                    }
                  })
              );
            }
          })
      );
      this.resourceCount =
        this.programWithRolloutService.programData.resources?.length;
      this.resources = (this.programWithRolloutService.programData.published_on && (this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT)) ? this.programWithRolloutService.programData.resources.slice().reverse():  this.programWithRolloutService.programData.resources
      this.addResourceFields();
      if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.CREATOR_VIEW) && (this.mode !== solutionModes.VIEWONLY)) {
        this.getCommentConfigs()
      }
    }
    this.subscription.add(
      this.programWithRolloutService.isProgramSave.subscribe(
        (isProjectSave: boolean) => {
          if (isProjectSave) {
            this.submit();
          }
        }
      )
    );
    if (this.mode === solutionModes.VIEWONLY || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.COPY_EDIT || this.mode == solutionModes.PUBLISHED_VIEW) {
      this.viewOnly = true
      // this.getProjectDetailsForViewOnly();
    }
    if (this.programId && !this.resourceIds?.length) {
      this.readProgram();
      if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.CREATOR_VIEW) && (this.mode !== solutionModes.VIEWONLY)) {
        this.getCommentConfigs()
      }
    }
    if(!this.resourceIds?.length  && !this.programId){
      this.submit();
    }

    this.subscription.add( // Check validation before sending for review.
      this.programWithRolloutService.isProgramSendForReviewValidation.subscribe(
        (reviewValidation: boolean) => {
          if(reviewValidation) {
            this.resourceForm.markAllAsTouched()
            this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting =  this.resourceForm.valid ? 'VALID' : 'INVALID'
            this.programWithRolloutService.triggerProgramSendForReview();
          }
        }
      )
    );

    this.subscription.add(
      this.programWithRolloutService.programApiErrors.subscribe(
        (errors: any) => {
          if (errors) {
            for (let index = 0; index < errors.length; index++) {
              if (errors[index].location.includes('resource')) {
                const match = errors[index].location.match(/\[(\d+)\]/)
                let i = match ? parseInt(match[1], 10) : 0;
                const resourceArray = this.resourceForm.get('resources') as FormArray;
                if (resourceArray) {
                  const resourceGroup = resourceArray.at(i); // Get the resource at the given index
                  const startDateControl = resourceGroup.get(errors[index].param); // Get the start_date control

                  if (startDateControl) {
                    startDateControl.setErrors({ pattern: true }); // Set dynamic error
                    startDateControl.markAsTouched(); // Ensure error is visible
                  }
                }
              }
            }
            this.resourceForm.markAllAsTouched()
            this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting = this.resourceForm.valid ? 'VALID' : 'INVALID'
          }
        }
      )
    );
    if(!this.programWithRolloutService.formMeta.formValidation) {
      this.programWithRolloutService.setValidationForProgram();
      this.programWithRolloutService.formMeta = this.programWithRolloutService.formMeta
    }
    this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting =  this.resourceForm.valid ? 'VALID' : 'INVALID'
    if(this.mode === solutionModes.META_EDIT){
       this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting=  this.resourceForm.valid ? 'VALID' : 'INVALID'
    }
    if(this.programWithRolloutService.programData.resources?.length == 0) {
      this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting = "INVALID";
    }

    if( this.programWithRolloutService.programData && this.mode === solutionModes.META_EDIT && this.programWithRolloutService.programData.status === resourceStatus.PUBLISHED){
      const currentDate = new Date();
      const startDateField = this.programWithRolloutService?.programData?.start_date;

      if (startDateField && startDateField) {
        const startDate = new Date(startDateField.value);
        if (currentDate >= startDate) {
          this.programWithRolloutService.programData.forEach((field:any) => {
            if (field.name === "start_date") {
                field.viewOnly = true;
            }
        });
        }
      }
    }

    this.subscription.add( // Check validation before publishing published program.
      this.programWithRolloutService.isProgramPublishalidation.subscribe(
        (programValidation: boolean) => {
          if (programValidation) {
            this.resourceForm.markAllAsTouched()
            this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting =  this.resourceForm.valid ? 'VALID' : 'INVALID'
            this.programWithRolloutService.triggerPublishProgram();
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
    if (this.resourceForm && this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting == 'INVALID' && this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting == "INVALID") {
      this.subscription.add(
        this.programWithRolloutService.programApiErrors.subscribe(
          (errors: any) => {
            if (errors) {
              for (let index = 0; index < errors.length; index++) {
                if (errors[index].location.includes('resource')) {
                  const match = errors[index].location.match(/\[(\d+)\]/)
                  let i = match ? parseInt(match[1], 10) : 0;
                  const resourceArray = this.resourceForm.get('resources') as FormArray;
                  if (resourceArray) {
                    const resourceGroup = resourceArray.at(i); // Get the resource at the given index
                    const startDateControl = resourceGroup.get(errors[index].param); // Get the start_date control

                    if (startDateControl) {
                      startDateControl.setErrors({ pattern: true }); // Set dynamic error
                      startDateControl.markAsTouched(); // Ensure error is visible
                    }
                  }
                }
                // this.dynamicFormData[errors[index].location].errorMessage.pattern = errors[index].msg;
              }
              this.resourceForm.markAllAsTouched()
              this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting = this.resourceForm.valid ? 'VALID' : 'INVALID'
            }
          }
        )
      );
      this.resourceForm.markAllAsTouched()
    }
  }


  initForm(): void {
    this.resourceForm = this.fb.group({
      resources: this.fb.array([]),
    });
  }

  get resourceFields(): FormArray {
    return this.resourceForm.get('resources') as FormArray;
  }

  readProgram() {
    this.resourceIds = [];
    if(Object.keys(this.programWithRolloutService.programData).length > 1){
      this.resourceCount =
      this.programWithRolloutService.programData.resources?.length;
    const resourceIds =
      this.programWithRolloutService.programData?.resources?.map(
        (resource: any) => resource.id
      );
      this.resources = (this.programWithRolloutService.programData.published_on && (this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT)) ? this.programWithRolloutService.programData.resources.slice().reverse():  this.programWithRolloutService.programData.resources
    this.addResourceFields();
    }else{
      this.subscription.add(
        this.programWithRolloutService
          .readProgram(this.programId)
          .subscribe((res: any) => {
            // this.programWithRolloutService.tabValidationForProgram = res.result.metaData
            this.programWithRolloutService.formMeta.formValidation = res.result.metaData
            this.programWithRolloutService.setProgramData(res.result);
            this.resourceCount =
              this.programWithRolloutService.programData.resources?.length;
            const resourceIds =
              this.programWithRolloutService.programData.resources.map(
                (resource: any) => resource.id
              );
              this.resources = (this.programWithRolloutService.programData.published_on && (this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT)) ? this.programWithRolloutService.programData.resources.slice().reverse():  this.programWithRolloutService.programData.resources
            this.addResourceFields();
          })
      );
    }

  }

  addResourceFields(): void {
    this.programWithRolloutService.programData.start_date = (typeof(this.programWithRolloutService.programData?.start_date) === 'object') ? new Date(this.programWithRolloutService.programData?.start_date).toISOString(): this.programWithRolloutService.programData?.start_date // keeping in UTC format
    this.programWithRolloutService.programData.end_date = (typeof(this.programWithRolloutService.programData?.end_date) === 'object') ? new Date(this.programWithRolloutService.programData?.end_date).toISOString(): this.programWithRolloutService.programData?.end_date
    this?.resources.forEach((element: any) => {
      element.start_date = (typeof(element.start_date) === 'object') ? new Date(element.start_date).toISOString(): element.start_date
      element.end_date = (typeof(element.end_date) === 'object') ? new Date(element.end_date).toISOString(): element.end_date
      const resourceGroup = this.fb.group({
        start_date: [
          element.start_date
            ? element.start_date
            : this.programWithRolloutService.programData?.start_date
            ? this.programWithRolloutService.programData?.start_date
            : '',
          [
            Validators.required,
            Validators.min(this.programWithRolloutService.programData?.start_date),
            Validators.max(
              element.end_date
                ? element.end_date
                : this.programWithRolloutService.programData?.end_date
                ? this.programWithRolloutService.programData?.end_date
                : '')
          ],
        ],
        end_date: [
          element.end_date
            ? element.end_date
            : (this.programWithRolloutService.programData?.end_date
            ? this.programWithRolloutService.programData?.end_date
            : ''),
          [
            Validators.required,
            Validators.min(
              element.start_date
                ? element.start_date
                : (this.programWithRolloutService.programData?.start_date
                ? this.programWithRolloutService.programData?.start_date:'')
            ),
            Validators.max(this.programWithRolloutService.programData?.end_date),
          ],
        ],
      });

      this.resourceFields.push(resourceGroup);
    });
  }

  getMaxDate(index: number): Date | undefined {
    return this.resources[index]?.end_date || this.programWithRolloutService.programData?.end_date ? new Date(new Date(this.resources[index]?.end_date || this.programWithRolloutService.programData?.end_date).setHours(23, 59, 59, 999)) : undefined;
  }

  getMinDate(index: number) {
    const start = new Date(this.resources[index]?.start_date || this.programWithRolloutService.programData?.start_date);
    const today = new Date();
    start.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
    return start < today ? today : start;
  }

  getProgramDate(type:string) {
    return this.programWithRolloutService.programData[type];
  }

  submit() {
    if (!this.programId) {
      this.subscription.add(
        this.programWithRolloutService
          .createOrUpdateProgram()
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
          })
      );
    } else {
      this.subscription.add(
        this.programWithRolloutService
          .updateProgramDraft(this.programId)
          .subscribe()
      );
    }

    // this.programWithRolloutService.updateProgramDraft(this.programId).subscribe();
  }

  openTargetCriteria(
    resourceIndex: number | string,
    elementIndex?: number | string
  ) {
    if(this.programWithRolloutService.programData.targeting_criteria.length == 0) {
      let data = {
        message: 'PLEASE_ADD_PROGRAM_TARGET_CRITERIA',
        class: 'error',
      };
      this.toastService.openSnackBar(data);
      return;
    }
  }

  onCardClick(cardItem: any) {
    this.router.navigate([CHOOSE_RESOURCES], {
      queryParams: {
        parent: this.parent,
        selectFor: 'programs',
        programId: this.programId,
      },
    });
  }

  updateResource(
    resourceIndex: number | string,
    targetIndex: string | number,
    targeItem?: any
  ) {
    if (!targeItem) {
      let targetCriteria = this.programWithRolloutService.programData.targeting_criteria
      this.programWithRolloutService.programData.resources[
        resourceIndex
      ].targeting_criteria.splice(targetIndex, 1);
      this.programWithRolloutService.programData.targeting_criteria = targetCriteria;
      this.subscription.add(
        this.programWithRolloutService
          .createOrUpdateProgram(
            this.programWithRolloutService.programData,
            this.programId
          )
          .subscribe((res: any) => {})
      );
    } else {
      const dialogRef = this.dialog.open(TargetCriteriaComponent, {
        width: '80%',
        height: '80%',
        disableClose: true,
        autoFocus: false,
        data: {
          data:{...targeItem,...{readOnly:true,mode:this.mode, page:'resource-level-targeting'}},
          targeting_criteria:      this.programWithRolloutService.programData.resources[
            resourceIndex
          ].targeting_criteria,
          language:this.language
        },
      });

      dialogRef.afterClosed().subscribe((res: any) => {
        if (res) {
          this.programWithRolloutService.programData.resources[
            resourceIndex
          ].targeting_criteria.splice(targetIndex, 1, res);
          this.subscription.add(
            this.programWithRolloutService
              .createOrUpdateProgram(
                this.programWithRolloutService.programData,
                this.programId
              )
              .subscribe((res: any) => {})
          );
        }
      });
    }
  }

  setValueToProgram(event: any, index: any, key: string) {
    if(event) {
      this.programWithRolloutService.removeItemFromAPIErrors(key);
    }
    if (this.programWithRolloutService.programData.published_on && (this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT)) {
      this.programWithRolloutService.programData.resources.slice().reverse()[index][key] = (key === 'start_date') ?  new Date(new Date(event.targetElement.value).setHours(0, 0, 0, 0)) : new Date(new Date(event.targetElement.value).setHours(23, 59, 59, 999)); // set time of start date to 00:00 and end date time to 11:59.
    } else {
      this.programWithRolloutService.programData.resources[index][key] = (key === 'start_date') ? new Date(new Date(event.targetElement.value).setHours(0, 0, 0, 0)) : new Date(new Date(event.targetElement.value).setHours(23, 59, 59, 999));
    }
    this.subscription.add(
      this.programWithRolloutService
        .createOrUpdateProgram(
          this.programWithRolloutService.programData,
          this.programId
        )
        .subscribe((res: any) => {
          this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting=  this.resourceForm.valid ? 'VALID' : 'INVALID'
          this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting=  this.resourceForm.valid ? 'VALID' : 'INVALID'
        })
    );
  }

  infoIconClickEvent(data: any) {}

  saveComment(quillInput:any){ //  This method is checking validation when a comment is updated or deleted.
    this.programWithRolloutService.checkValidationForRequestChanges(quillInput)
  }

  getCommentConfigs() {
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

  ngOnDestroy() {
    this.subscription.add( // Check validation before sending for review.
    this.programWithRolloutService.isProgramSendForReviewValidation.subscribe(
      (reviewValidation: boolean) => {
        if(reviewValidation) {
          this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting = this.resourceForm.valid ? 'VALID' : 'INVALID'
        }
      }
    )
  );
    if(!this.programWithRolloutService.formMeta.formValidation) {
      this.programWithRolloutService.setValidationForProgram();
      this.programWithRolloutService.formMeta = this.programWithRolloutService.formMeta
    }
    if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW ) && (this.mode !== solutionModes.VIEWONLY)) {
      this.programWithRolloutService.checkValidationForRequestChanges()
    }
    this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting = this.resourceForm.valid ? 'VALID' : 'INVALID'
    this.subscription.unsubscribe();
  }

  showTooltip(tooltip: MatTooltip) {
    tooltip.disabled = false;
    tooltip.show();
  }

  hideTooltip(tooltip: MatTooltip) {
    tooltip.hide();
    tooltip.disabled = true;
  }

  isStartDateDisabled(i: number): boolean {
    const resource = this.resourceForm.get('resources')?.value[i]; // Get the current resource item
    const startDate = new Date(resource?.start_date);
    const currentDate = new Date();

    return this.programWithRolloutService.programData.status === resourceStatus.PUBLISHED && this.mode === solutionModes.META_EDIT &&  currentDate > startDate;
  }

  isResourceGrayedOut(index:any){
    return ((this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW ||  this.mode === solutionModes.REVIEWER_VIEW)|| (this.mode === solutionModes.REQUEST_FOR_EDIT && this.programWithRolloutService.programData.status === resourceStatus.REQUEST_FOR_CHANGES && this.programWithRolloutService.programData.published_on)) && (new Date(this.programWithRolloutService.programData.published_on) > new Date(this.resources[index].created_at))
  }
}
