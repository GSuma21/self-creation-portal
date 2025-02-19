import { Component } from '@angular/core';
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
    CommentsBoxComponent
  ],
  templateUrl: './resource-level-targeting.component.html',
  styleUrl: './resource-level-targeting.component.scss',
})
export class ResourceLevelTargetingComponent {
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

            this.subscription.add(
              this.programWithRolloutService
                .readProgram(this.programId)
                .subscribe((res: any) => {
                  this.programWithRolloutService.setProgramData(res.result);
                  this.programWithRolloutService.upDateProgramTitle(res.result.title);
                  this.resourceCount =
                    this.programWithRolloutService.programData.resources.length;
                  this.resources =
                    this.programWithRolloutService.programData.resources;
                })
            );
          })
      );
      this.resourceCount =
        this.programWithRolloutService.programData.resources.length;
      this.resources = this.programWithRolloutService.programData.resources;
      this.addResourceFields();
      if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW) && (this.mode !== solutionModes.VIEWONLY)) {
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
    if (this.mode === solutionModes.VIEWONLY || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.COPY_EDIT) {
      this.viewOnly = true
      // this.getProjectDetailsForViewOnly();
    }
    if (this.programId && !this.resourceIds?.length) {
      this.readProgram();
      if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW) && (this.mode !== solutionModes.VIEWONLY)) {
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
            this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting=  this.resourceForm.valid ? 'VALID' : 'INVALID'
            this.programWithRolloutService.triggerProgramSendForReview();
          }
        }
      )
    );

    this.subscription.add(
      this.programWithRolloutService.programApiErrors.subscribe(
        (errors: any) => {
          if(errors){
           this.resourceForm.markAllAsTouched()
           this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting=  this.resourceForm.valid ? 'VALID' : 'INVALID'
          }
        }
      )
    );
    this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting=  this.resourceForm.valid ? 'VALID' : 'INVALID'
    this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting = this.resourceForm.valid ? 'VALID' : 'INVALID'
  }

  ngAfterViewChecked() {
    if(this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting == 'INVALID'){
      this.resourceForm.markAllAsTouched()
    }
    this.subscription.add(
      this.programWithRolloutService.programApiErrors.subscribe(
        (errors: any) => {
          if(errors){
            this.resourceForm.markAllAsTouched()
            this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting=  this.resourceForm.valid ? 'VALID' : 'INVALID'
           }
        }
      )
    );
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
    this.subscription.add(
      this.programWithRolloutService
        .readProgram(this.programId)
        .subscribe((res: any) => {
          this.programWithRolloutService.setProgramData(res.result);
          this.resourceCount =
            this.programWithRolloutService.programData.resources.length;
          const resourceIds =
            this.programWithRolloutService.programData.resources.map(
              (resource: any) => resource.id
            );
          this.resources = this.programWithRolloutService.programData.resources;
          this.addResourceFields();
        })
    );
  }

  addResourceFields(): void {
    this.resources.forEach((element: any) => {
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

  getMaxDate(index: number) {
    return this.resources[index].end_date ? this.resources[index].end_date : this.programWithRolloutService.programData?.end_date;
  }

  getMinDate(index: number) {
    return this.resources[index].start_date ? this.resources[index].start_date : this.programWithRolloutService.programData?.start_date;
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
    this.router.navigate(['roll-out/choose-resource'], {
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
      this.programWithRolloutService.programData.resources[
        resourceIndex
      ].targeting_criteria.splice(targetIndex, 1);
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
        data: {...targeItem,...{readOnly:true}},
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
    this.programWithRolloutService.programData.resources[index][key] = new Date(
      event.targetElement.value
    );
    this.subscription.add(
      this.programWithRolloutService
        .createOrUpdateProgram(
          this.programWithRolloutService.programData,
          this.programId
        )
        .subscribe((res: any) => {})
    );
  }

  statusButtonClick(event: { label: string; item: any }) {}

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
          // this.libProjectService.checkValidationForRequestChanges(comments);
        });
      })
    );
  }

  ngOnDestroy() {
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

}
