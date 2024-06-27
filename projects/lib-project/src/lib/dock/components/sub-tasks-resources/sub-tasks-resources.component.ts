import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent, SideNavbarComponent, DialogModelComponent } from 'lib-shared-modules';
import { MatIconModule, getMatIconFailedToSanitizeLiteralError } from '@angular/material/icon';
import { MatCardModule }  from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LibProjectService } from '../../../lib-project.service'
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'lib-sub-tasks-resources',
  standalone:true,
  imports: [
    HeaderComponent,
    SideNavbarComponent,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    TranslateModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './sub-tasks-resources.component.html',
  styleUrl: './sub-tasks-resources.component.scss'
})
export class SubTasksResourcesComponent implements OnInit,OnDestroy{
  myForm: FormGroup = this.fb.group({});
  resources:any;
  taskData : any[] = [];
  subtask: FormGroup;
  learningResources:any
  projectId:string|number = '';
  projectData:any;
  private subscription: Subscription = new Subscription();
  private projectDataSubscription: Subscription | undefined;

  constructor(private dialog : MatDialog,private fb: FormBuilder,private libProjectService:LibProjectService, private route:ActivatedRoute, private router:Router) {
    this.subtask = this.fb.group({
      subtasks: this.fb.array([])
    });
  }

  ngOnInit() {
    this.projectDataSubscription = this.libProjectService.currentProjectData.subscribe(data => {
      this.learningResources = data?.tasksData.subTaskLearningResources
    });
    this.subscription.add(
      this.route.queryParams.subscribe((params:any) => {
        this.projectId = params.projectId;
          this.libProjectService.readProject(params.projectId).subscribe((res:any)=> {
            this.libProjectService.projectData = res.result;
            this.projectData = res?.result
            this.createSubTaskForm(res?.result?.tasks?.length, res?.result?.tasks)
            this.addSubtaskData()
          })
      })
    );
    this.subscription.add(
      this.libProjectService.isProjectSave.subscribe((isProjectSave:boolean) => {
        if(isProjectSave && this.router.url.includes('sub-tasks')) {
          this.submit();
        }
      })
    );

  }
  createSubTaskForm(taskLength:number,tasks?:any){
    for (let i = 0; i < taskLength; i++) {
      this.taskData.push({
        buttons: [{"label":"ADD_OBSERVATION","disable":true},{"label":"ADD_LEARNING_RESOURCE","disable":false},{"label":"ADD_SUBTASKS","disable":false}],
        subTasks: this.fb.group({
          subtasks: this.fb.array(tasks?.length > 0 && tasks[i].subtask?.length > 0 ? tasks[i]?.subtask : [])  // Initialize a new FormArray for each task
      }),
        resources: tasks?.length > 0 && tasks[i].resources?.length > 0 ? tasks[i]?.resources : []
      });
    }
  }

  onAction(button : string, taskIndex: number) {
      switch (button) {
        case 'ADD_OBSERVATION':
          break;

        case 'ADD_LEARNING_RESOURCE':
          const dialogRef = this.dialog.open(DialogModelComponent, {
            data: {
              control: this.learningResources,
              ExistingResources:this.taskData[taskIndex].resources
            }
            });

            const componentInstance = dialogRef.componentInstance;
            componentInstance.saveLearningResource.subscribe((result: any) => {
              if (result) {
                this.taskData[taskIndex].resources = this.taskData[taskIndex].resources.concat(result) // Save resources to the specific task
              }
            });
          break;

        case 'ADD_SUBTASKS':
          this.addSubTask(taskIndex)
          break;

        default:
          break;
      }
  }

  addSubTask(taskIndex: number) {
    const control = <FormArray>this.taskData[taskIndex].subTasks.get('subtasks');
    control.push(this.fb.control(''));
  }

  onDeleteSubtask(taskIndex: number, subTaskIndex: number) {
    const control = <FormArray>this.taskData[taskIndex].subTasks.get('subtasks');
    control.removeAt(subTaskIndex);
  }

  deleteResource(taskIndex: number, resourceIndex: number) {
    this.taskData[taskIndex].resources.splice(resourceIndex, 1);
  }
  onSubtasks(form: FormGroup, taskIndex: number) {}

  addSubtaskData(){
    if(this.projectData?.tasks) {
      for (let i = 0; i < this.projectData.tasks.length; i++) {
        this.projectData.tasks[i]['resources'] = this.taskData[i].resources
        this.projectData.tasks[i]['subtask'] = this.taskData[i].subTasks.value.subtasks
      }
    }
  }

  submit() {
    this.addSubtaskData();
    console.log(this.projectData.tasks)
    if(this.projectData.tasks)
    this.libProjectService.updateProjectData({'tasks': this.projectData.tasks});
    this.libProjectService.updateProjectDraft(this.projectId).subscribe((res) => {
      this.libProjectService.readProject(this.projectId).subscribe((response:any) => {
        this.libProjectService.projectData = response.result;
        this.libProjectService.openSnackBar()
      })
    })
  }

  ngOnDestroy(){
    this.submit();
    this.libProjectService.saveProjectFunc(false);
    this.subscription.unsubscribe();
    if (this.projectDataSubscription) {
      this.projectDataSubscription.unsubscribe();
    }
  }
}
