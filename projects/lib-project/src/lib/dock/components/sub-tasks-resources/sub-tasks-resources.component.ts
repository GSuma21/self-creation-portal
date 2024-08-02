import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent, SideNavbarComponent, DialogModelComponent, DialogPopupComponent } from 'lib-shared-modules';
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
import { v4 as uuidv4 } from 'uuid';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-sub-tasks-resources',
  standalone:true,
  imports: [
    CommonModule,
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
  viewOnly:boolean= false;
  mode:any = ""
  private subscription: Subscription = new Subscription();
  private autoSaveSubscription: Subscription = new Subscription();

  constructor(private dialog : MatDialog,private fb: FormBuilder,private libProjectService:LibProjectService, private route:ActivatedRoute, private router:Router) {
    this.subtask = this.fb.group({
      subtasks: this.fb.array([])
    });
  }

  ngOnInit() {
    this.subscription.add(
    this.libProjectService.currentProjectMetaData.subscribe(data => {
      this.learningResources = data?.tasksData.subTaskLearningResources
    })
    )
    this.subscription.add(
      this.route.queryParams.subscribe((params:any) => {
        this.mode = params.mode;
        this.projectId = params.projectId;
        if(params.mode){
          if(Object.keys(this.libProjectService.projectData).length) {
            this.projectData = this.libProjectService.projectData;
            this.createSubTaskForm()
            this.addSubtaskData()
            if (params.mode === "edit") {
              this.startAutoSaving();
            }
          }
          else {
            this.libProjectService.readProject(params.projectId).subscribe((res:any)=> {
              this.libProjectService.setProjectData(res.result);
              this.projectData = res?.result
              this.createSubTaskForm()
              this.addSubtaskData()
              if (params.mode === "edit") {
              this.startAutoSaving();
            }
            })
          }

          if (params.mode === "edit") {
             this.subscription.add(
            this.libProjectService.isProjectSave.subscribe((isProjectSave:boolean) => {
              if(isProjectSave && this.router.url.includes('sub-tasks')) {
                this.submit();
              }
            })
          );
            }
           if(params.mode === "viewOnly"){
              this.viewOnly =true
          }
        }else{
          this.createSubTaskForm()
        }

      })
    );
  }


  createSubTaskForm() {
    const getButtonStates = (taskDescriptionLength: number) => {
        return taskDescriptionLength
            ? [{"label": "ADD_OBSERVATION", "disable": true}, {"label": "ADD_LEARNING_RESOURCE", "disable": false}, {"label": "ADD_SUBTASKS", "disable": false}]
            : [{"label": "ADD_OBSERVATION", "disable": true}, {"label": "ADD_LEARNING_RESOURCE", "disable": true}, {"label": "ADD_SUBTASKS", "disable": true}];
    };

    const createTaskObject = (task?: any) => {
       let subtask =task?.children  ?  task.children.map((child: any) => this.fb.control(child.name)):[]
        return {
            buttons: task ? getButtonStates(task.name.length) : [{"label": "ADD_OBSERVATION", "disable": true}, {"label": "ADD_LEARNING_RESOURCE", "disable": true}, {"label": "ADD_SUBTASKS", "disable": true}],
            subTasks: this.fb.group({
              subtasks: this.fb.array(task?.children?.length > 0 ? subtask : [])
            }),
             resources : task?.learning_resources?.length > 0 ? task.learning_resources : [],
             children: task?.children ? task.children : []
        };
    };
    if (this.libProjectService.projectData?.tasks?.length > 0) {
      if(this.mode === 'edit'){
        this.subscription.add(
          this.libProjectService.readProject(this.projectId).subscribe((res:any)=> {
            if(res.result.tasks.length > 0){
              res.result.tasks.forEach((task: any) => {
                  this.taskData.push(createTaskObject(task));
              });
            }else if (this.libProjectService?.projectData.tasks){
              this.libProjectService?.projectData.tasks.forEach((task: any) => {
                  this.taskData.push(createTaskObject(task));
              });
            }else{
                this.taskData.push(createTaskObject());
            }
           })
         )
      }else{
        if (this.libProjectService?.projectData.tasks){
          this.libProjectService?.projectData.tasks.forEach((task: any) => {
              this.taskData.push(createTaskObject(task));
          });
        }else{
            this.taskData.push(createTaskObject());
        }
      }
    } else {
            this.taskData.push(createTaskObject());
    }
}

  onAction(button : string, taskIndex: number) {
      switch (button) {
        case 'ADD_OBSERVATION':
          break;

        case 'ADD_LEARNING_RESOURCE':
          const dialogRef = this.dialog.open(DialogModelComponent, {
            disableClose: true,
            data: {
              control: this.learningResources,
              ExistingResources:this.taskData[taskIndex].resources
            }
            });

            const componentInstance = dialogRef.componentInstance;
            componentInstance.saveLearningResource.subscribe((result: any) => {
              if (result) {
                this.taskData[taskIndex].resources = this.taskData[taskIndex].resources.concat(result) // Save resources to the specific task
                this.saveSubtask()
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

  startAutoSaving() {
    this.subscription.add(
      this.libProjectService
      .startAutoSave(this.projectId)
      .subscribe((data) => console.log(data))
    )
  }

  addSubtaskData(){
    if(this.projectData?.tasks) {
      for (let i = 0; i < this.projectData.tasks.length; i++) {
        let subtasks:any = []  // Move subtasks initialization here
        this.projectData.tasks[i]['learning_resources'] = this.taskData[i]?.resources,
        this.projectData.tasks[i].type = this.taskData[i]?.resources.length ? "content" : "simple";
        for (let j = 0; j < this.taskData[i]?.subTasks.value.subtasks.length; j++) {
          subtasks.push(
            {
              "id": this.taskData[i]?.children?.[j]?.id ? this.taskData[i].children[j].id : uuidv4(),
              "name": this.taskData[i]?.subTasks.value.subtasks[j],
              "type": this.taskData[i]?.resources.length ? "content" : "simple",
              "parent_id": this.projectData?.tasks[i].id,
              "sequence_no": j + 1,
              "is_mandatory": this.projectData.tasks[i].is_mandatory,
              "allow_evidences": this.projectData.tasks[i].allow_evidences,
            }
          )
        }
        this.projectData.tasks[i]['children'] = subtasks;
      }
    }
  }


  submit() {
    this.saveSubtask();
    this.libProjectService.updateProjectDraft(this.projectId).subscribe();
  }

  ngOnDestroy(){
    if(this.mode === 'edit' && Object.keys(this.libProjectService.projectData).length > 0){
      this.saveSubtask()
      if (this.autoSaveSubscription) {
        this.autoSaveSubscription.unsubscribe();
      }
    this.libProjectService.createOrUpdateProject(this.libProjectService.projectData,this.projectId).subscribe((res)=> console.log(res))
    }
    this.subscription.unsubscribe();
  }

  saveSubtask(){
    this.addSubtaskData();
    this.libProjectService.setProjectData({'tasks': this.projectData.tasks});
  }
}