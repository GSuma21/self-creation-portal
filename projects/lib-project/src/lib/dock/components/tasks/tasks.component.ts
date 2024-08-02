import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogPopupComponent, HeaderComponent, SideNavbarComponent, ToastService } from 'lib-shared-modules';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'lib-tasks',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SideNavbarComponent, MatFormFieldModule, MatIconModule, FormsModule, ReactiveFormsModule, MatInputModule, MatSlideToggleModule, MatSelectModule, MatButtonModule, TranslateModule, MatTooltipModule],
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
  mode: any = ""
  private autoSaveSubscription: Subscription = new Subscription();
  maxTaskLength = this.libProjectService.projectConfig.max_task_count ? this.libProjectService.projectConfig.max_task_count : 10;
  private subscription: Subscription = new Subscription();
  constructor(private fb: FormBuilder, private libProjectService: LibProjectService, private route: ActivatedRoute, private router: Router, private dialog: MatDialog, private _snackBar: MatSnackBar, private toastService: ToastService) {
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
                this.libProjectService.projectData.tasks.forEach((element: any) => {
                  const task = this.fb.group({
                    id: [element.id],
                    name: [element.name ? element.name : '', Validators.required],
                    is_mandatory: [element.is_mandatory ? element.is_mandatory : false],
                    allow_evidence: [element.allow_evidence ? element.allow_evidence : false],
                    evidence_details: this.fb.group({
                      file_types: [element.evidence_details.file_types ? element.evidence_details.file_types : ''],
                      min_no_of_evidences: [element.evidence_details.min_no_of_evidences ? element.evidence_details.min_no_of_evidences : 1, Validators.min(1)]
                    }),
                    learning_resources:element.learning_resources? [element.learning_resources] : [],
                    children: [element.children],
                    sequence_no: [element.sequence_no]
                  });
                  this.tasks.push(task);
                })
              }
              else {
                this.addTask();
              }
              if(params.mode === 'edit') {
                this.startAutoSaving();
              }

            }
            else {
              this.libProjectService.readProject(this.projectId).subscribe((res: any) => {
                this.tasksForm.reset()
                this.libProjectService.projectData = res.result;
                if (res && res.result.tasks && res.result.tasks.length) {
                  res.result.tasks.forEach((element: any) => {
                    const task = this.fb.group({
                      id: [element.id],
                      name: [element.name ? element.name : '', Validators.required],
                      is_mandatory: [element.is_mandatory ? element.is_mandatory : false],
                      allow_evidence: [element.allow_evidence ? element.allow_evidence : false],
                      evidence_details: this.fb.group({
                        file_types: [element.evidence_details.file_types ? element.evidence_details.file_types : ''],
                        min_no_of_evidences: [element.evidence_details.min_no_of_evidences ? element.evidence_details.min_no_of_evidences : 1, Validators.min(1)]
                      }),
                      learning_resources:[element.learning_resources ?  element.learning_resources : []],
                      children: [element.children],
                      type:[element.type],
                      sequence_no: [element.sequence_no]
                    });
                    this.tasks.push(task);
                  })
                }
                else {
                  this.addTask();
                }
                if(params.mode === 'edit') {
                  this.startAutoSaving();
                }
              })
            }

            if (params.mode === 'viewOnly') {
              this.viewOnly = true
            }
          }
        }
        else {
          this.startAutoSaving();
          this.libProjectService
            .createOrUpdateProject({ ...this.libProjectService.projectData, ...{ title: 'Untitled project' } })
            .subscribe((res: any) => {
              (this.projectId = res.result.id),
                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: {
                    projectId: this.projectId,
                    mode: 'edit',
                  },
                  queryParamsHandling: 'merge',
                  replaceUrl: true,
                });
              this.libProjectService.projectData.id = res.result.id;
            })
        }
      })
    )

    if(this.mode === 'edit'){
      this.subscription.add(
        this.libProjectService.isProjectSave.subscribe((isProjectSave: boolean) => {
          if (isProjectSave && this.router.url.includes('tasks')) {
            // console.log("from subject it's getting called")
            this.submit();
          }
        })
      );
    }

    this.libProjectService.validForm.tasks = this.tasks?.status ? this.tasks?.status : "INVALID"
    this.libProjectService.checkValidationForSubmit()
  }

  get tasks() {
    return this.tasksForm.get('tasks') as FormArray;
  }

  addTask() {
    const taskGroup = this.fb.group({
      id: uuidv4(),
      type: "simple",
      name: ['', Validators.required],
      is_mandatory: [false],
      allow_evidence: [false],
      evidence_details: this.fb.group({
        file_types: [[]],
        min_no_of_evidences: [1, [Validators.min(this.tasksData.minEvidences.validators.min), Validators.max(this.tasksData.minEvidences.validators.max)]]
      })
    });
    this.tasks.push(taskGroup);
    this.libProjectService.validForm.tasks = this.tasks?.status ? this.tasks?.status : "INVALID"
    this.libProjectService.checkValidationForSubmit()
  }

  deleteTask(index: number) {
    let content = (this.tasks.value[index].subtask && this.tasks.value[index].subtask.length) || (this.tasks.value[index].resources && this.tasks.value[index].resources.length) ? "DELETE_TASK_WITH_SUBTASK_MESSAGE" : "DELETE_TASK_MESSAGE";
    const dialogRef = this.dialog.open(DialogPopupComponent, {
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
        this.libProjectService.validForm.tasks = this.tasks?.status ? this.tasks?.status : "INVALID"
        this.libProjectService.checkValidationForSubmit()
        return true;
      } else {
        return false;
      }
    });
  }

  checkValidation() {
    this.saveTasks(this.tasks, this.tasksData)
    this.libProjectService.validForm.tasks = this.tasks?.status ? this.tasks?.status : "INVALID"
    this.libProjectService.checkValidationForSubmit()
  }

  startAutoSaving() {
    this.saveTasks(this.tasks, this.tasksData)
    this.subscription.add(
      this.libProjectService
        .startAutoSave(this.projectId)
        .subscribe((data) => console.log(data))
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
    this.libProjectService.validForm.tasks = this.tasks?.status ? this.tasks?.status : "INVALID"
    this.saveTasks(this.tasks, this.tasksData)
    this.libProjectService.updateProjectDraft(this.projectId).subscribe();
  }

  ngOnDestroy() {
    if (this.mode === 'edit') {
      this.libProjectService.validForm.tasks = this.tasks?.status ? this.tasks?.status : "INVALID"
      this.libProjectService.checkValidationForSubmit()
      this.saveTasks(this.tasks, this.tasksData)
      if (this.autoSaveSubscription) {
        this.autoSaveSubscription.unsubscribe();
      }
      if( Object.keys(this.libProjectService.projectData).length > 0) {
        this.libProjectService.createOrUpdateProject(this.libProjectService.projectData, this.projectId).subscribe((res) => console.log(res))
      }
    }
    this.subscription.unsubscribe();
  }

  addingTask() {
    const taskCantAddMessage = !this.tasksForm.valid
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

  adjustValue(event: any): void {
    const inputValue = event.target.value;
    const min = this.tasksData.minEvidences.validators.min;
    const max = this.tasksData.minEvidences.validators.max;

    if (inputValue < min) {
      event.target.value = min;
    } else if (inputValue > max) {
      event.target.value = max;
    }
  }

  saveTasks(tasks:any, taskData:any = []){
    tasks.value.forEach((item: any, index: any) => {
      item.sequence_no = index + 1;
      item.type = item.type ? item.type : "simple"
      if(item.allow_evidence == true && item.evidence_details.file_types.length == 0){
       item.evidence_details.file_types = taskData.fileType.options.map((item:any)=> item.value);
      }else if(item.allow_evidence == false){
        item.evidence_details = {}
      }
    });
    this.libProjectService.setProjectData({ 'tasks': tasks.value })
  }

}