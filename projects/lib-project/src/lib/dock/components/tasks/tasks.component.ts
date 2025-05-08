import { AfterViewChecked, Component, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogPopupComponent, HeaderComponent, SideNavbarComponent, ToastService, UtilService, CommentsBoxComponent ,resourceStatus, solutionModes, PROGRAM_RESOURCES} from 'lib-shared-modules';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LibProjectService } from '../../../lib-project.service'
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';
import { v4 as uuidv4 } from 'uuid';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DynamicFormModule } from 'dynamic-form-suma';

@Component({
  selector: 'lib-tasks',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SideNavbarComponent, MatFormFieldModule, MatIconModule, FormsModule, ReactiveFormsModule, MatInputModule, MatSlideToggleModule, MatSelectModule, MatButtonModule, TranslateModule, MatTooltipModule,CommentsBoxComponent, DynamicFormModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit, OnDestroy {

  tasksForm: FormGroup;
  projectId: string | number = '';
  taskFileTypes: string[] = [];
  tasksData: any;
  SHIFT_TASK_UP = 'SHIFT_TASK_UP';
  SHIFT_TASK_DOWN = 'SHIFT_TASK_DOWN'
  viewOnly: boolean = false;
  mode: any = "";
  commentPayload:any;
  commentsList:any = [];
  projectInReview:boolean = false;
  ProgramResourceId:string|number = ''
  private autoSaveSubscription: Subscription = new Subscription();
  maxTaskLength = this.libProjectService.projectConfig?.max_task_count ? this.libProjectService.projectConfig?.max_task_count : 10;
  language:any =  JSON.parse(localStorage.getItem('preferred_language') ?? '{}')?.value ?? 'en';
  private subscription: Subscription = new Subscription();
  constructor(private fb: FormBuilder, private libProjectService: LibProjectService, private route: ActivatedRoute, private router: Router, private dialog: MatDialog, private _snackBar: MatSnackBar, private toastService: ToastService, private utilService:UtilService) {
    this.tasksForm = this.fb.group({
      tasks: this.fb.array([])
    });
  }

  ngOnInit() {
    this.subscription.add(
      this.libProjectService.currentProjectMetaData.subscribe(data => {
        this.tasksData = data?.tasksData.tasks;
        this.taskFileTypes = this.tasksData?.fileType.options.map((item:any) => item.value)
      })
    )
    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.projectId = params.projectId;
        this.libProjectService.projectData.id = params.projectId;
        this.mode = params.mode;
        this.ProgramResourceId = params.programResourceId;
        if(params.programId){
          if (params.mode) {
            if (Object.keys(this.libProjectService.projectData).length > 1) {
              this.tasksForm.reset()
              let fileType:any
              if (this.libProjectService.projectData.tasks && this.libProjectService.projectData.tasks.length) {
                this.libProjectService.projectData.tasks.forEach((element:any) => {
                  fileType = element.allow_evidences === false ? [this.taskFileTypes] : [element.evidence_details?.file_types || ''];
                  const task = this.fb.group({
                    id: [element.id],
                    name: [element.name ? element.name : '', Validators.required],
                    is_mandatory: [element.is_mandatory ? element.is_mandatory : false],
                    allow_evidences: [element.allow_evidences ? element.allow_evidences : false],
                    evidence_details: this.fb.group({
                      file_types: fileType,
                      min_no_of_evidences: [element.evidence_details?.min_no_of_evidences ? element.evidence_details?.min_no_of_evidences : 1, Validators.min(1)]
                    }),
                    learning_resources:element?.learning_resources? [element.learning_resources] : [],
                    children: [element?.children],
                    type:[element?.type],
                    sequence_no:[element?.sequence_no],
                    solution_details:element?.solution_details ?element.solution_details :{}
                  });
                  this.tasks.push(task);
                })
              }
              else{
                this.addTask();
              }
            }
            else {
              this.libProjectService.readProgram(params.programId).subscribe((res:any)=> {
                this.tasksForm.reset()
                let fileType:any
                this.libProjectService.programData = res.result;
                const matchedResource = res.result.resources.find((resource:any) =>resource.id == params.programResourceId);
                this.libProjectService.setProjectData(matchedResource)
                this.libProjectService.projectData = matchedResource;
                this.libProjectService.formMeta = matchedResource.formMeta ? matchedResource.formMeta : this.libProjectService.formMeta;
                if(matchedResource && matchedResource.tasks && matchedResource.tasks.length) {
                  matchedResource.tasks.forEach((element:any) => {
                    fileType = element.allow_evidences === false ? [this.taskFileTypes] : [element.evidence_details?.file_types || ''];
                    const task = this.fb.group({
                      id:[element.id],
                      name: [element.name ? element.name : '', Validators.required],
                      is_mandatory: [element.is_mandatory ? element.is_mandatory : false],
                      allow_evidences: [element.allow_evidences ? element.allow_evidences : false],
                      evidence_details: this.fb.group({
                        file_types: fileType,
                        min_no_of_evidences: [element.evidence_details?.min_no_of_evidences ? element.evidence_details.min_no_of_evidences : 1, Validators.min(1)]
                      }),
                      learning_resources:[element.learning_resources ?  element.learning_resources : []],
                      children: [element.children],
                      type:[element.type],
                      sequence_no: [element.sequence_no],
                      solution_details:element.solution_details ?element.solution_details :{}
                    });
                    this.tasks.push(task);
                  })
                }
              })
            }
            if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.META_REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.META_REQUEST_FOR_EDIT)&& (this.mode !==  solutionModes.VIEWONLY)) {
              this.getCommentConfigs(params.programResourceId)
            }
          }
        }
        else if (params.projectId) {
          if (params.mode) {
            if (Object.keys(this.libProjectService.projectData).length > 1) {
              this.tasksForm.reset()
              let fileType:any
              if (this.libProjectService.projectData.tasks && this.libProjectService.projectData.tasks.length) {
                this.libProjectService.projectData.tasks.forEach((element:any) => {
                  fileType = element.allow_evidences === false ? [this.taskFileTypes] : [element.evidence_details?.file_types || ''];
                  const task = this.fb.group({
                    id: [element.id],
                    name: [element.name ? element.name : '', Validators.required],
                    is_mandatory: [element.is_mandatory ? element.is_mandatory : false],
                    allow_evidences: [element.allow_evidences ? element.allow_evidences : false],
                    evidence_details: this.fb.group({
                      file_types: fileType,
                      min_no_of_evidences: [element.evidence_details?.min_no_of_evidences ? element.evidence_details?.min_no_of_evidences : 1, Validators.min(1)]
                    }),
                    learning_resources:element?.learning_resources? [element.learning_resources] : [],
                    children: [element?.children],
                    type:[element?.type],
                    sequence_no:[element?.sequence_no],
                    solution_details:element?.solution_details ?element.solution_details :{}
                  });
                  this.tasks.push(task);
                })
              }
              else{
                this.addTask();
              }
              if(params.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT){
                this.startAutoSaving();
              }
              if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW ||  this.mode === solutionModes.META_REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.META_REQUEST_FOR_EDIT)&& (this.mode !==  solutionModes.VIEWONLY)) {
                this.getCommentConfigs()
              }

            }
            else {
              this.libProjectService.readProject(this.projectId).subscribe((res:any)=> {
                this.tasksForm.reset()
                this.libProjectService.projectData = res.result;
                let fileType:any
               this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
                if(res && res.result.tasks && res.result.tasks.length) {
                  res.result.tasks.forEach((element:any) => {
                    fileType = element.allow_evidences === false ? [this.taskFileTypes] : [element.evidence_details?.file_types || ''];
                    const task = this.fb.group({
                      id:[element.id],
                      name: [element.name ? element.name : '', Validators.required],
                      is_mandatory: [element.is_mandatory ? element.is_mandatory : false],
                      allow_evidences: [element.allow_evidences ? element.allow_evidences : false],
                      evidence_details: this.fb.group({
                        file_types: fileType,
                        min_no_of_evidences: [element.evidence_details?.min_no_of_evidences ? element.evidence_details.min_no_of_evidences : 1, Validators.min(1)]
                      }),
                      learning_resources:[element.learning_resources ?  element.learning_resources : []],
                      children: [element.children],
                      type:[element.type],
                      sequence_no: [element.sequence_no],
                      solution_details:element.solution_details ?element.solution_details :{}
                    });
                    this.tasks.push(task);
                  })
                  if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.META_REVIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.META_REQUEST_FOR_EDIT)&& (this.mode !==  solutionModes.VIEWONLY)) {
                    this.getCommentConfigs()
                  }
                }
                else {
                  this.addTask();
                }
                if(params.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) {
                  this.startAutoSaving();
                }
              })
            }
          }
        }
        else {
          this.libProjectService
          .createOrUpdateProject({ ...this.libProjectService.projectData, ...{ title: 'Untitled project' } })
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
          })
        }

        if (this.mode === solutionModes.VIEWONLY || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.COPY_EDIT || this.mode === solutionModes.META_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT || this.mode === solutionModes.META_REVIEW) {
          this.viewOnly = true
          // this.tasksForm.disable()
        }
      })
    )
    this.subscription.add(
      this.libProjectService.isProjectSave.subscribe((isProjectSave:boolean) => {
        if(isProjectSave && this.router.url.includes('tasks')) {
          this.submit();
        }
      })
    );
    this.subscription.add( // Check validation before sending for review.
      this.libProjectService.isSendForReviewValidation.subscribe(
        (reviewValidation: boolean) => {
          if(reviewValidation) {
            if((this.mode == solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) && this.projectId) {
              this.tasksForm.markAllAsTouched();
              this.checkValidation()
              this.libProjectService.triggerSendForReview();
            }
          }
        }
      )
    );
    this.subscription.add(
      this.tasksForm.valueChanges.subscribe(changes => {
        this.libProjectService.isFormDirty = true;
      })
    )
    // this.checkValidation()
    this.subscription.add(
      this.libProjectService.projectApiErrors.subscribe(
        (errors: any) => {
          for (let index = 0; index < errors.length; index++) {
            if(errors[index].parsedLocation.name === "tasks" && !(errors[index].parsedLocation.children)){
             let a = this.tasks.controls[errors[index].parsedLocation.index]
             this.tasks.controls.forEach((taskGroup: any, i: number) => {
              if(i == errors[index].parsedLocation.index ){
                this.tasksData.description.errorMessage.pattern = errors[index].msg
                taskGroup.controls.name.setErrors({ pattern: errors[index].msg });
                this.tasksForm.markAllAsTouched();
              }
            });
            }
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

  get tasks() {
    return this.tasksForm.get('tasks') as FormArray;
  }

  ngAfterViewChecked() {
    if((this.mode == solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) && this.projectId) {
      if(this.tasksForm.pristine && this.libProjectService.tabValidation.tasks == "INVALID" && this.libProjectService.formMeta.formValidation.tasks == "INVALID") {
        this.libProjectService.projectApiErrors.subscribe(
          (errors: any) => {
            for (let index = 0; index < errors.length; index++) {
              if(errors[index].parsedLocation.name === "tasks" && !(errors[index].parsedLocation.children)){
               let a = this.tasks.controls[errors[index].parsedLocation.index]
               this.tasks.controls.forEach((taskGroup: any, i: number) => {
                if(i == errors[index].parsedLocation.index ){
                  this.tasksData.description.errorMessage.pattern = errors[index].msg
                  taskGroup.controls.name.setErrors({ pattern: errors[index].msg });
                  this.tasksForm.markAllAsTouched();
                }
              });
              }
            }

          }
        )
        this.tasksForm.markAllAsTouched();
      }
    }
  }

  addTask() {
    const taskIndex = this.tasks.length;
    const taskGroup = this.fb.group({
      id: uuidv4(),
      type: "simple",
      name: ['', taskIndex === 0 ? Validators.required : Validators.nullValidator],
      is_mandatory: [false],
      allow_evidences: [false],
      evidence_details: this.fb.group({
        file_types: [this.taskFileTypes, Validators.required],
        min_no_of_evidences: [1, [Validators.min(this.tasksData?.minEvidences.validators.min), Validators.max(this.tasksData?.minEvidences.validators.max)]]
      })
    });
    this.tasks.push(taskGroup);
    // this.checkValidation()
  }

  deleteTask(index: number) {
    let content = (this.tasks.value[index].children &&  this.tasks.value[index].children.length) || (this.tasks.value[index].learning_resources && this.tasks.value[index].learning_resources.length) ? "DELETE_TASK_WITH_SUBTASK_MESSAGE" :"DELETE_TASK_MESSAGE";
    const dialogRef = this.dialog.open(DialogPopupComponent, {
      width: '39.375rem',
      disableClose: true,
      data: {
        header: "DELETE_TASK",
        content: content,
        cancelButton: "NO",
        exitButton: "YES"
      }
    });

    return dialogRef.afterClosed().toPromise().then(result => {
      if (result.data === "NO") {
        return true;
      } else if (result.data === "YES") {
        this.libProjectService.validateAndHighlightErrors({error: [...this.libProjectService.reviewErrors.filter((obj:any) => !obj.location.includes(`tasks[${index}]`))]});
        this.tasks.removeAt(index);
        this.checkValidation(index)
        return true;
      } else {
        return false;
      }
    });
  }

  checkValidation(index?:any) {
    if(index !== undefined && index !== null) {
      this.libProjectService.removeItemFromAPIErrors('tasks['+index+']')
    }
    this.saveTasks()
    this.libProjectService.formMeta.formValidation.tasks = (this.tasks?.status && this.tasks.length <= this.maxTaskLength)  ? this.tasks?.status: "INVALID"
  }

  startAutoSaving() {
      this.subscription.add(
        this.libProjectService
        .startAutoSave(this.projectId, this.mode)
        .subscribe((data) => {this.libProjectService.isFormDirty = false})
      )
  }

  moveTask(index: number, direction: number) {
    if ((index + direction) >= 0 && (index + direction) < this.tasks.length) {
      const task = this.tasks.at(index);
      this.tasks.removeAt(index);
      this.tasks.insert(index + direction, task);
      let movingErrors = [...this.libProjectService.reviewErrors.filter((obj:any) => obj.location.includes(`tasks[${index}]`))].map((item:any) => ({ ...item, location:  `tasks[${index + direction}]`+ item.location.slice(8)}))
      let notMovable = [...this.libProjectService.reviewErrors.filter((obj:any) => !obj.location.includes(`tasks[${index}]`))]
      // movingErrors
      let movingErrorsTarget = [...this.libProjectService.reviewErrors.filter((obj:any) => obj.location.includes(`tasks[${index + direction}]`))].map((item:any) => ({ ...item, location:  `tasks[${index}]`+ item.location.slice(8)}))
      let nonMovingErrorsTarget = [...this.libProjectService.reviewErrors.filter((obj:any) => !obj.location.includes(`tasks[${index + direction}]`))]
      // movingErrors
      if(movingErrors.length > 0) {
        this.libProjectService.validateAndHighlightErrors({error: notMovable.concat(movingErrors)});
      }
      if(movingErrorsTarget.length > 0) {
        this.libProjectService.validateAndHighlightErrors({error: nonMovingErrorsTarget.concat(movingErrorsTarget)});
      }
    }
  }

  submit() {
    this.tasks.value.forEach((item:any, index:any) => {
      item.sequence_no = index + 1;
      item.type = item.type ? item.type : "simple"
      if(item.allow_evidences == true && item.evidence_details.file_types.length == 0){
       item.evidence_details.file_types = this.tasksData.fileType.options.map((item:any)=> item.value);
      }else if(item.allow_evidences == false){
        item.evidence_details = {}
      }
    });
    this.checkValidation()
    this.libProjectService.updateProjectDraft(this.projectId).subscribe();
  }

  ngOnDestroy(){
    this.taskFileTypes = []
    if((this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) && this.libProjectService.projectData.id && this.utilService.saveResources){
      this.checkValidation()
      this.libProjectService.createOrUpdateProject(this.libProjectService.projectData,this.projectId).subscribe((res)=> console.log(res))
    }
    if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.META_REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW ) && (this.mode !== solutionModes.VIEWONLY)) {
      this.libProjectService.checkValidationForRequestChanges()
    }
    this.subscription.unsubscribe();
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  addingTask() {
    const taskCantAddMessage =  !this.isAnyTaskFilled()
      ? 'FILL_THE_DISCRIPTION_OF_THE_ALREADY_ADDED_FIRST'
      : this.tasks.length >= this.maxTaskLength
        ? 'TASK_LIMIT_REACHED'
        : '';

    if (taskCantAddMessage) {
      let data = {
        "message": taskCantAddMessage,
        "class": "error"
      }
     this.toastService.openSnackBar(data)
    } else {
      this.addTask();
    }
  }

  adjustValue(event: any, task:any): void {
    let inputValue = parseInt(event.target.value, 10); // Convert the input value to a number
    if (inputValue < this.tasksData.minEvidences.validators.min) {
      inputValue = this.tasksData.minEvidences.validators.min;
    } else if (inputValue > this.tasksData.minEvidences.validators.max) {
      inputValue = this.tasksData.minEvidences.validators.max;
    }

   // Update the form control value with the adjusted value
   const evidenceDetailsControl = task.get('evidence_details').get('min_no_of_evidences');
   if (evidenceDetailsControl) {
     evidenceDetailsControl.setValue(inputValue);
   }

   event.target.value = inputValue;
   this.libProjectService.setProjectData({ 'tasks': this.tasks.value });
  }

  saveTasks(){
    this.tasks.value.forEach((item: any, index: any) => {
      item.sequence_no = index + 1;
      item.type = item.type ? item.type : "simple"
      if(item.allow_evidences == false){
        item.evidence_details = {}
      }
    });
    this.libProjectService.setProjectData({ 'tasks': this.tasks.value })
  }

  isAnyTaskFilled(): boolean {
    return this.tasks.value.every((task:any) => task.name && task.name.trim() !== '')
  }

 disableSlideMandatory(event: MatSlideToggleChange,task: any){
    if (this.viewOnly) {
      event.source.checked = !event.checked;
    }
  }
 disableSlide(event: MatSlideToggleChange,task: any) {
    if (this.viewOnly) {
      event.source.checked = !event.checked;
      const fileTypesControl = task.get('allow_evidences');
          fileTypesControl.setValue(!event.checked); // Select all file types
    }
    this.saveTasks();
  }

  saveComment(quillInput:any){ //  This method is checking validation when a comment is updated or deleted.
    this.libProjectService.checkValidationForRequestChanges(quillInput)
  }

  getCommentConfigs(resourceId?:string|number) {
    this.subscription.add(
      this.route.data.subscribe((data: any) => {
        this.utilService.getCommentList(resourceId ? resourceId :this.projectId).subscribe((commentListRes: any) => {
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

  showTooltip(tooltip: MatTooltip) {
    tooltip.disabled = false;
    tooltip.show();
  }

  hideTooltip(tooltip: MatTooltip) {
    tooltip.hide();
    tooltip.disabled = true;
  }
}
