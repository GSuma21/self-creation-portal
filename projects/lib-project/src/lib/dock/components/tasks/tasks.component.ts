import { AfterViewChecked, Component, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogPopupComponent, HeaderComponent, SideNavbarComponent, ToastService, UtilService, CommentsBoxComponent, projectMode ,resourceStatus} from 'lib-shared-modules';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
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

@Component({
  selector: 'lib-tasks',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SideNavbarComponent, MatFormFieldModule, MatIconModule, FormsModule, ReactiveFormsModule, MatInputModule, MatSlideToggleModule, MatSelectModule, MatButtonModule, TranslateModule, MatTooltipModule,CommentsBoxComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit, OnDestroy {

  tasksForm: FormGroup;
  projectId: string | number = '';
  taskFileTypes: string[] = ['PDF', 'Image'];
  tasksData: any;
  SHIFT_TASK_UP = 'SHIFT_TASK_UP';
  SHIFT_TASK_DOWN = 'SHIFT_TASK_DOWN'
  viewOnly: boolean = false;
  mode: any = "";
  commentPayload:any;
  commentsList:any = [];
  projectInReview:boolean = false;
  private autoSaveSubscription: Subscription = new Subscription();
  maxTaskLength = this.libProjectService.projectConfig?.max_task_count ? this.libProjectService.projectConfig?.max_task_count : 10;
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
      })
    )
    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.projectId = params.projectId;
        this.libProjectService.projectData.id = params.projectId;
        this.mode = params.mode;
        if (params.projectId) {
          if (params.mode) {
            if (Object.keys(this.libProjectService.projectData).length > 1) {
              this.tasksForm.reset()
              if (this.libProjectService.projectData.tasks && this.libProjectService.projectData.tasks.length) {
                this.libProjectService.projectData.tasks.forEach((element:any) => {
                  const task = this.fb.group({
                    id: [element.id],
                    name: [element.name ? element.name : '', Validators.required],
                    is_mandatory: [element.is_mandatory ? element.is_mandatory : false],
                    allow_evidences: [element.allow_evidences ? element.allow_evidences : false],
                    evidence_details: this.fb.group({
                      file_types: [element.evidence_details?.file_types ? element.evidence_details.file_types : ''],
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
              if(params.mode === projectMode.EDIT || this.mode === projectMode.REQUEST_FOR_EDIT){
                this.startAutoSaving();
              }
              if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === projectMode.REVIEWER_VIEW || this.mode === projectMode.REVIEW || this.mode === projectMode.REQUEST_FOR_EDIT)&& (this.mode !==  projectMode.VIEWONLY)) {
                this.getCommentConfigs()
              }

            }
            else {
              this.libProjectService.readProject(this.projectId).subscribe((res:any)=> {
                this.tasksForm.reset()
                this.libProjectService.projectData = res.result;
               this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
                if(res && res.result.tasks && res.result.tasks.length) {
                  res.result.tasks.forEach((element:any) => {
                    const task = this.fb.group({
                      id:[element.id],
                      name: [element.name ? element.name : '', Validators.required],
                      is_mandatory: [element.is_mandatory ? element.is_mandatory : false],
                      allow_evidences: [element.allow_evidences ? element.allow_evidences : false],
                      evidence_details: this.fb.group({
                        file_types: [element.evidence_details?.file_types ? element.evidence_details.file_types : ''],
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
                  if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === projectMode.REVIEWER_VIEW || this.mode === projectMode.REVIEW || this.mode === projectMode.REQUEST_FOR_EDIT)&& (this.mode !==  projectMode.VIEWONLY)) {
                    this.getCommentConfigs()
                  }
                }
                else {
                  this.addTask();
                }
                if(params.mode === projectMode.EDIT || this.mode === projectMode.REQUEST_FOR_EDIT) {
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
                  mode: projectMode.EDIT,
                },
                queryParamsHandling: 'merge',
                replaceUrl: true,
              });
              this.libProjectService.projectData.id = res.result.id;
          })
        }

        if (this.mode === projectMode.VIEWONLY || this.mode === projectMode.REVIEW || this.mode === projectMode.REVIEWER_VIEW || this.mode === projectMode.CREATOR_VIEW || this.mode === projectMode.COPY_EDIT) {
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
            if((this.mode == projectMode.EDIT || this.mode === projectMode.REQUEST_FOR_EDIT) && this.projectId) {
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
    this.checkValidation()
  }

  get tasks() {
    return this.tasksForm.get('tasks') as FormArray;
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
        file_types: [[]],
        min_no_of_evidences: [1, [Validators.min(this.tasksData?.minEvidences.validators.min), Validators.max(this.tasksData?.minEvidences.validators.max)]]
      })
    });
    this.tasks.push(taskGroup);
    this.checkValidation()
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
        this.tasks.removeAt(index);
        this.checkValidation()
        return true;
      } else {
        return false;
      }
    });
  }

  checkValidation() {
    this.saveTasks()
    this.libProjectService.formMeta.formValidation.tasks = (this.tasks?.status && this.tasks.length <= this.maxTaskLength)  ? this.tasks?.status: "INVALID"
  }

  startAutoSaving() {
    this.subscription.add(
      this.libProjectService
      .startAutoSave(this.projectId)
      .subscribe((data) => {this.libProjectService.isFormDirty = false})
    )
  }

  moveTask(index: number, direction: number) {
    if ((index + direction) >= 0 && (index + direction) < this.tasks.length) {
      const task = this.tasks.at(index);
      this.tasks.removeAt(index);
      this.tasks.insert(index + direction, task);
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
    if((this.mode === projectMode.EDIT || this.mode === projectMode.REQUEST_FOR_EDIT) && this.libProjectService.projectData.id){
      this.checkValidation()
      this.libProjectService.createOrUpdateProject(this.libProjectService.projectData,this.projectId).subscribe((res)=> console.log(res))
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
      if(item.allow_evidences == true && item.evidence_details.file_types.length == 0){
       item.evidence_details.file_types = this.tasksData.fileType.options.map((item:any)=> item.value);
      }else if(item.allow_evidences == false){
        item.evidence_details = {}
      }
    });
    this.libProjectService.setProjectData({ 'tasks': this.tasks.value })
  }

  isAnyTaskFilled(): boolean {
    return this.tasks.value.every((task:any) => task.name && task.name.trim() !== '')
  }

 disableSlide(event: MatSlideToggleChange) {
    if (this.viewOnly) {
      event.source.checked = !event.checked;
    }
  }

  saveComment(quillInput:any){ //  This method is checking validation when a comment is updated or deleted.
    this.libProjectService.checkValidationForRequestChanges(quillInput)
  }

  getCommentConfigs() {
    this.subscription.add(
      this.route.data.subscribe((data: any) => {
        this.utilService.getCommentList(this.projectId).subscribe((commentListRes: any) => {
          const comments = commentListRes.result?.comments || [];
          const filteredComments = this.utilService.filterCommentByContext(comments, data.page);

          this.commentsList = this.commentsList.concat(filteredComments);
          this.commentPayload = data;
          this.projectInReview = this.mode === projectMode.REVIEW || this.mode === projectMode.REQUEST_FOR_EDIT ||  this.mode === projectMode.REVIEWER_VIEW || this.mode === projectMode.CREATOR_VIEW ;
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
