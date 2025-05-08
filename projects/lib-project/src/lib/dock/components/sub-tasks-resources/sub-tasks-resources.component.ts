import { AfterViewChecked, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent, SideNavbarComponent, DialogModelComponent, DialogPopupComponent, UtilService ,resourceStatus, solutionModes, ToastService, PROGRAM_RESOURCES} from 'lib-shared-modules';
import { MatIconModule, getMatIconFailedToSanitizeLiteralError } from '@angular/material/icon';
import { MatCardModule }  from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LibProjectService } from '../../../lib-project.service'
import { Subscription } from 'rxjs/internal/Subscription';
import { v4 as uuidv4 } from 'uuid';
import { CommonModule } from '@angular/common';
import { CommentsBoxComponent } from 'lib-shared-modules';
import { DynamicFormModule } from 'dynamic-form-suma';

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
    FormsModule,
    CommentsBoxComponent,
    DynamicFormModule
  ],
  templateUrl: './sub-tasks-resources.component.html',
  styleUrl: './sub-tasks-resources.component.scss'
})
export class SubTasksResourcesComponent implements OnInit,OnDestroy, AfterViewChecked{
  resources:any;
  taskData : any[] = [];
  subtask: FormGroup;
  learningResources:any
  projectId:string|number = '';
  projectData:any;
  viewOnly:boolean= false;
  mode:any = "";
  commentPayload:any;
  commentsList:any = [];
  projectInReview:boolean = false;
  observationFormDetails:any;
  allowOpenLinks:boolean = false;
  ProgramResourceId:string|number = ''
  private subscription: Subscription = new Subscription();
  private autoSaveSubscription: Subscription = new Subscription();
  language:any = JSON.parse(localStorage.getItem('preferred_language') ?? '{}')?.value ?? 'en';

  constructor(private dialog : MatDialog,private fb: FormBuilder,private libProjectService:LibProjectService, private route:ActivatedRoute, private router:Router, private utilService:UtilService, private toastService:ToastService) {
    this.subtask = this.fb.group({
      subtasks: this.fb.array([])
    });
  }

  ngOnInit() {
    this.subscription.add(
    this.libProjectService.currentProjectMetaData.subscribe(data => {
      this.allowOpenLinks =  data?.tasksData.allowOpenLinks
      this.learningResources = data?.tasksData.subTaskLearningResources
      this.observationFormDetails =  data?.tasksData.observationDeatils
    })
    )
    this.subscription.add(
      this.route.queryParams.subscribe((params:any) => {
        this.mode = params.mode;
        this.ProgramResourceId = params.programResourceId;
        this.projectId = params.projectId;
       if(params.mode){
          if(params.programId){
            if(Object.keys(this.libProjectService.projectData)?.length) {
              this.projectData = this.libProjectService.projectData;
              this.createSubTaskForm()
              this.addSubtaskData()
            }
            else {
              this.libProjectService.readProgram(params.programId).subscribe((res:any)=> {
                this.libProjectService.programData = res.result;
                const matchedResource = res.result.resources.find((resource:any) =>resource.id == params.programResourceId);
                this.libProjectService.setProjectData(matchedResource);
                this.libProjectService.projectData = matchedResource;
                this.libProjectService.formMeta = matchedResource.formMeta ? matchedResource.formMeta : this.libProjectService.formMeta;
                this.projectData = matchedResource
                this.createSubTaskForm()
                this.addSubtaskData()
              })
            }
            if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.META_REQUEST_FOR_EDIT || this.mode === solutionModes.META_REVIEW)&& (this.mode !==  solutionModes.VIEWONLY)) {
              this.getCommentConfigs()
            }
          }
          else if(Object.keys(this.libProjectService.projectData)?.length && this.projectId) {
            this.projectData = this.libProjectService.projectData;
            this.createSubTaskForm()
            this.addSubtaskData()
            if (params.mode === solutionModes.EDIT || params.mode === solutionModes.REQUEST_FOR_EDIT) {
              this.startAutoSaving();
            }
            if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.META_REQUEST_FOR_EDIT || this.mode === solutionModes.META_REVIEW)&& (this.mode !==  solutionModes.VIEWONLY)) {
              this.getCommentConfigs()
            }
          }
          else {
            this.libProjectService.readProject(params.projectId).subscribe((res:any)=> {
              this.libProjectService.setProjectData(res.result);
              this.projectData = res?.result
             this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
              this.createSubTaskForm()
              this.addSubtaskData()
              if (params.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) {
              this.startAutoSaving();
            }
            if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.META_REQUEST_FOR_EDIT || this.mode === solutionModes.META_REVIEW)&& (this.mode !==  solutionModes.VIEWONLY)) {
              this.getCommentConfigs()
            }
            })
          }

          if (params.mode === solutionModes.EDIT || params.mode === solutionModes.REQUEST_FOR_EDIT) {
            this.subscription.add(
            this.libProjectService.isProjectSave.subscribe((isProjectSave:boolean) => {
              if(isProjectSave && this.router.url.includes('sub-tasks')) {
                this.submit();
              }
            }));
            this.subscription.add( // Check validation before sending for review.
            this.libProjectService.isSendForReviewValidation.subscribe(
              (reviewValidation: boolean) => {
                if(reviewValidation) {
                    this.subtask.markAllAsTouched()
                    this.libProjectService.formMeta.formValidation.subTasks =  this.subtasks?.status? this.subtasks?.status: "INVALID"
                    this.libProjectService.triggerSendForReview();
                }
              }
            )
          );
          // this.libProjectService.formMeta.formValidation.subTasks =  this.subtasks?.status? this.subtasks?.status: "INVALID"
          }
          if (params.mode === solutionModes.VIEWONLY || params.mode === solutionModes.REVIEW || params.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.COPY_EDIT || params.mode === solutionModes.META_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT || this.mode === solutionModes.META_REVIEW) {
            this.viewOnly = true;
          }
        }else{
          this.createSubTaskForm()
        }

      })
    );
    this.subscription.add(
      this.subtask.valueChanges.subscribe(changes => {
        this.libProjectService.isFormDirty = true;
      })
    )

    this.subscription.add(
      this.libProjectService.projectApiErrors.subscribe(
        (errors: any) => {
          for (let index = 0; index < errors.length; index++) {
            if(errors[index].parsedLocation.children?.name == "children"){
              // this.libProjectService.formMeta.formValidation.subTasks = "INVALID"
               this.taskData[errors[index].parsedLocation.index].subTasks.get('subtasks').controls[errors[index].parsedLocation.children.index].setErrors({ pattern: errors[index].msg })
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

  ngAfterViewChecked() {
    if((this.mode == solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) && this.projectId && this.subtask.pristine && this.libProjectService.tabValidation.subTasks == "INVALID" && this.libProjectService.formMeta.formValidation.subTasks == "INVALID") {
      this.subscription.add(
        this.libProjectService.projectApiErrors.subscribe(
          (errors: any) => {
            if(errors.length > 0) {
              for (let index = 0; index < errors.length; index++) {
                if(errors[index].parsedLocation.children?.name == "children"){
                  // this.libProjectService.formMeta.formValidation.subTasks = "INVALID"
                   this.taskData[errors[index].parsedLocation.index].subTasks.get('subtasks').controls[errors[index].parsedLocation.children.index].setErrors({ pattern: errors[index].msg })
                }
              }
            }
          }
        )
      );
    }
  }

  get subtasks() {
    return this.subtask.get('subtasks') as FormArray;
  }

  getButtonStates = (task: any) => {
    const disableAll = !task?.name?.length || task?.solution_details?.name;
    const disableObservation = !!(task?.learning_resources?.length || task?.resources?.length || task?.children?.length);

    return [
      { "label": "ADD_OBSERVATION", "disable": disableAll || disableObservation },
      { "label": "ADD_LEARNING_RESOURCE", "disable": disableAll },
      { "label": "ADD_SUBTASKS", "disable": disableAll }
    ];
  };

  createSubTaskForm() {

    const createTaskObject = (task?: any) => {
       let subtask =task?.children  ?  task.children.map((child: any) => this.fb.control(child.name)):[]
        return {
            buttons: task ? this.getButtonStates(task) : [{"label": "ADD_OBSERVATION", "disable": true}, {"label": "ADD_LEARNING_RESOURCE", "disable": true}, {"label": "ADD_SUBTASKS", "disable": true}],
            name: task?.name,
            subTasks: this.fb.group({
              subtasks: this.fb.array(task?.children?.length > 0 ? subtask : [])
            }),
             resources : task?.learning_resources?.length > 0 ? task.learning_resources : [],
             children: task?.children ? task.children : [],
             solution_details: task?.solution_details ? task?.solution_details : {}
        };
    };
    if (this.libProjectService.projectData?.tasks?.length > 0) {
      if(this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT){
        if (this.libProjectService?.projectData.tasks){
          this.libProjectService?.projectData.tasks.forEach((task: any) => {
              this.taskData.push(createTaskObject(task));
          });
        }else{
            this.taskData.push(createTaskObject());
        }
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
          const dialogObservation = this.dialog.open(DialogModelComponent, {
            disableClose: true,
            data: {
              control: this.observationFormDetails.observationFormDetails,
              ExistingObservation:this.taskData[taskIndex].solution_details,
              language:this.language
            }
            });
            const componentInstanceObservation = dialogObservation.componentInstance;
            componentInstanceObservation.saveLearningResource.subscribe((result: any) => {
              if (result) {
                this.taskData[taskIndex].solution_details = {
                  ...result[0],
                  min_no_of_submissions_required: this.observationFormDetails.minSubmissionRequired.validators.min,
                  type: "observation",
                };
                this.saveSubtask()
                this.taskData[taskIndex].buttons = this.getButtonStates(this.taskData[taskIndex])
              }
            });
          break;

        case 'ADD_LEARNING_RESOURCE':
          const dialogRef = this.dialog.open(DialogModelComponent, {
            disableClose: true,
            data: {
              control: this.learningResources,
              ExistingResources:this.taskData[taskIndex].resources,
              language:this.language
            }
            });

            const componentInstance = dialogRef.componentInstance;
            componentInstance.saveLearningResource.subscribe((result: any) => {
              if (result) {
                this.taskData[taskIndex].resources = this.taskData[taskIndex].resources.concat(result) // Save resources to the specific task
                this.saveSubtask()
                this.taskData[taskIndex].buttons = this.getButtonStates(this.taskData[taskIndex])
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
    <FormArray>this.taskData[taskIndex].subTasks.get('subtasks').push(this.fb.control(''));
    this.taskData[taskIndex].children.push(this.fb.control(''));
    this.taskData[taskIndex].buttons = this.getButtonStates(this.taskData[taskIndex])
  }

  onDeleteSubtask(taskIndex: number, subTaskIndex: number) {
    this.libProjectService.validateAndHighlightErrors({error: [...this.libProjectService.reviewErrors.filter((obj:any) => !obj.location.includes(`tasks[${taskIndex}].children[${subTaskIndex}]`))]});
    <FormArray>this.taskData[taskIndex].subTasks.get('subtasks').removeAt(subTaskIndex);
    this.taskData[taskIndex].children.splice(subTaskIndex, 1);
    this.taskData[taskIndex].buttons = this.getButtonStates(this.taskData[taskIndex])
    if(this.libProjectService.reviewErrors.length > 0 && this.libProjectService.reviewErrors.find((element:any) => element.location.includes('tasks') && element.location.includes('children'))) {
      this.libProjectService.tabValidation.subTasks = "INVALID"
    }
    else {
      this.libProjectService.tabValidation.subTasks = "VALID"
    }
  }

  deleteResource(taskIndex: number, resourceIndex: number) {
    this.taskData[taskIndex].resources.splice(resourceIndex, 1);
    this.saveSubtask()
    this.taskData[taskIndex].buttons = this.getButtonStates(this.taskData[taskIndex])
  }

  deleteObservation(taskIndex: number){
    this.taskData[taskIndex].solution_details={}
    this.saveSubtask()
    this.taskData[taskIndex].buttons = this.getButtonStates(this.taskData[taskIndex])
  }


  startAutoSaving() {
      this.subscription.add(
        this.libProjectService
        .startAutoSave(this.projectId, this.mode)
        .subscribe((data) => {this.libProjectService.isFormDirty = false})
      )
  }

  addSubtaskData(){
    if(this.projectData?.tasks) {
      for (let i = 0; i < this.projectData.tasks.length; i++) {
        let subtasks:any = []  // Move subtasks initialization here
        this.projectData.tasks[i]['learning_resources'] = this.taskData[i]?.resources,
        this.projectData.tasks[i].type = this.taskData[i]?.solution_details.name ? "observation" : (this.taskData[i]?.resources.length ? "content" : "simple");
        for (let j = 0; j < this.taskData[i]?.subTasks.value.subtasks.length; j++) {
          subtasks.push(
            {
              "id": this.taskData[i]?.children?.[j]?.id ? this.taskData[i].children[j].id : uuidv4(),
              "name": this.taskData[i]?.subTasks.value.subtasks[j],
              "type": this.taskData[i]?.solution_details.name ? "observation" : (this.taskData[i]?.resources.length ? "content" : "simple"),
              "parent_id": this.projectData?.tasks[i].id,
              "sequence_no": j + 1,
              "is_mandatory": this.projectData.tasks[i].is_mandatory,
              "allow_evidences": this.projectData.tasks[i].allow_evidences,
            }
          )
        }
        this.projectData.tasks[i]['children'] = subtasks;
        this.projectData.tasks[i]['solution_details'] = this.taskData[i]?.solution_details;
      }
    }
  }


  submit() {
    this.saveSubtask();
    this.libProjectService.updateProjectDraft(this.projectId).subscribe();
  }

  ngOnDestroy(){
    if((this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) && this.libProjectService.projectData.id && this.utilService.saveResources){
     this.saveSubtask();
      if (this.autoSaveSubscription) {
        this.autoSaveSubscription.unsubscribe();
      }
    this.libProjectService.createOrUpdateProject(this.libProjectService.projectData,this.projectId).subscribe((res)=> console.log(res))
    }
    if ((this.libProjectService?.projectData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.META_REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW  ) && (this.mode !== solutionModes.VIEWONLY)) {
      this.libProjectService.checkValidationForRequestChanges()
    }
    this.subscription.unsubscribe();
  }

  saveSubtask(){
    this.libProjectService.isFormDirty = true;
    this.addSubtaskData();
    this.libProjectService.setProjectData({'tasks': this.projectData.tasks});
  }

  saveComment(quillInput:any){ //  This method is checking validation when a comment is updated or deleted.
    this.libProjectService.checkValidationForRequestChanges(quillInput)
  }

  getCommentConfigs() {
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


  savingSubtask(taskIndex:any,j:any){
    this.libProjectService.removeItemFromAPIErrors('tasks['+taskIndex+"]."+"children["+j+']')
    this.saveSubtask();
    if(this.libProjectService.reviewErrors.length > 0 && this.libProjectService.reviewErrors.find((element:any) => element.location.includes('tasks') && element.location.includes('children'))) {
      this.libProjectService.tabValidation.subTasks = "INVALID"
    }
    else {
      this.libProjectService.tabValidation.subTasks = "VALID"
    }
    this.taskData[taskIndex].children[j] = this.taskData[taskIndex]?.subTasks.value.subtasks[j]
    this.taskData[taskIndex].buttons = this.getButtonStates(this.taskData[taskIndex])
  }

  addMinSubmissionsRequired(event:any,taskIndex:any){
    let inputValue = parseInt(event.target.value, 10); // Convert the input value to a number
    if (inputValue < this.observationFormDetails.minSubmissionRequired.validators.min) {
      inputValue = this.observationFormDetails.minSubmissionRequired.validators.min;
    } else if (inputValue > this.observationFormDetails.minSubmissionRequired.validators.max ) {
      inputValue = this.observationFormDetails.minSubmissionRequired.validators.max;
    }
    event.target.value = inputValue;
    this.taskData[taskIndex].solution_details.min_no_of_submissions_required = inputValue;
    this.saveSubtask()
  }

  openResourceLink(url:any){
    if(this.allowOpenLinks){
      window.open(url, '_blank');
    }
  }
}
