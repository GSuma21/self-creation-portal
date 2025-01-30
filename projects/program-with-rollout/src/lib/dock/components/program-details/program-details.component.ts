import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-suma';
import { DialogPopupComponent, FormService, modes, PROGRAM_DETAILS, ToastService } from 'lib-shared-modules';
import { Subscription } from 'rxjs/internal/Subscription';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'lib-program-details',
  standalone: true,
  imports: [DynamicFormModule, TranslateModule],
  templateUrl: './program-details.component.html',
  styleUrl: './program-details.component.scss'
})
export class ProgramDetailsComponent {
  @ViewChild('formLib') formLib: MainFormComponent | undefined;
  private subscription: Subscription = new Subscription();
  allowOpenLinks = true;
  viewOnly = false;
  dynamicFormData:any;
  intervalId:any;
  programId:any;
  mode:any;
  formDataForTitle:any

  constructor( private formService: FormService,private dialog:MatDialog, private programWithRolloutService:ProgramWithRolloutService,  private router: Router,
      private route: ActivatedRoute, private toastService: ToastService,) {
      this.startAutoSaving()
      this.subscription.add(
        this.route.queryParams.subscribe((params: any) => {
          this.mode = params.mode ? params.mode : ""
        })
      )
     }
  
   ngOnInit() {
    this.getFormWithEntitiesAndMap()
    // this.subscription.add(
    //   this.programWithRolloutService.createProgramTest().subscribe((res:any)=>{
    //     console.log(res)
    //   })
    // )
    this.subscription.add(
      this.programWithRolloutService.isProgramSave.subscribe(
        (isProjectSave: boolean) => {
          if (isProjectSave) {
            this.saveForm();
          }
        }
      )
    );
    }

    getFormWithEntitiesAndMap(){
        this.formService.getFormWithEntities(PROGRAM_DETAILS).then((data) => {
          this.formDataForTitle = data.controls.find((item:any) => item.name === 'title');
          this.readProjectDeatilsAndMap(data.controls,[]);
          if (data) {
            this.formDataForTitle = data.controls.find((item:any) => item.name === 'title');
            this.subscription.add(
              this.route.queryParams.subscribe((params: any) => {
                this.programId = params.programId;
                this.programWithRolloutService.programData.id = params.programId;
                if (params.programId) {
                  if (params.mode === modes.EDIT) {
                    if (Object.keys(this.programWithRolloutService.programData).length > 1) { // project ID will be there so length considered as more than 1
                      this.readProjectDeatilsAndMap(data.controls,this.programWithRolloutService.programData);
                    } else {
                      this.subscription.add(
                        this.programWithRolloutService
                          .readProgram(this.programId)
                          .subscribe((res: any) => {
                            console.log(res)
                          //   this.libProjectService.setProjectData(res.result);
                          //  this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
                          //   this.readProjectDeatilsAndMap(data.controls,res.result);
                          //   this.libProjectService.upDateProjectTitle();
                            // comments list and configuration
                          })
                      );
                    }
                    // this.checkAndGetCommentConfigs()
                  }else{
                    if (Object.keys(this.programWithRolloutService.programData).length > 1) { // project ID will be there so length considered as more than 1
                      this.readProjectDeatilsAndMap(data.controls,this.programWithRolloutService.programData);
                    } else {
                      this.subscription.add(
                        this.programWithRolloutService
                          .readProgram(this.programId)
                          .subscribe((res: any) => {
                            this.programWithRolloutService.setProgramData(res.result);
                          //  this.programWithRolloutService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
                            this.readProjectDeatilsAndMap(data.controls,res.result);
                            // comments list and configuration
                          })
                      );
                    }
                    // this.checkAndGetCommentConfigs()
                  }
                } else {
                  this.readProjectDeatilsAndMap(data.controls,this.programWithRolloutService.programData);
                }
              })
            );
          }
        });
        // this.libProjectService.currentProjectMetaData.subscribe(data => {
        //   this.allowOpenLinks =  data?.tasksData.allowOpenLinks;
        // })
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
        });
        this.dynamicFormData = formControls;
        // if( this.formLib){
        //   this.libProjectService.formMeta.formValidation.projectDetails = ( this.formLib?.myForm.status === "INVALID" || this.formLib?.subform?.myForm.status === "INVALID") ? "INVALID" : "VALID";
        // }
        // if(this.libProjectService.projectData.tasks && this.libProjectService.formMeta.formValidation.tasks !== "INVALID"){
        //   this.libProjectService.validateTasksData()
        // }
      }

  getDynamicFormData(data:any){
    this.programWithRolloutService.setProgramData(data)
    this.programWithRolloutService.upDateProgramTitle(data.title)
  }

  getFormControlChange(event:any){}


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
            data: null,
          });
  
          dialogRef.afterClosed().subscribe((res: any) => {
            this.dynamicFormData.forEach((element:any) => {
              if(element.name == "targeting_criteria" && res) {
                element.value.push(res);
                // this.formLib.myForm.patchValue({ // adding target criteria to form
                //   targeting_criteria: element.value,
                // });
                // this.programWithRolloutService.rollOutDetails.targeting_criteria
              }
            })
            // this.updateTargetCriteria()
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
        default:
          break;
      }
  
    }


     startAutoSaving() {
        this.intervalId = setInterval(() => {
          console.log(this.programId)
          if(!this.programId) {
            this.createProgram({title:'Untitled project'})
          } else {
            // if((this.mode === modes.EDIT || this.mode === modes.REQUEST_FOR_EDIT) && this.isFormDirty) {
            //   this.subscription.add(this.libProjectService.createOrUpdateProject(this.libProjectService.projectData, this.projectId).subscribe((res:any)=>{
            //     this.isFormDirty = false;
            //   }))
            // }
          }
        }, 30000);
      }


      createProgram(payload?:any,showToast?:boolean) { // title should be send from calling methods only, due to title can be filled before project creation
        this.programWithRolloutService
        .createOrUpdateProgram(payload)
        .subscribe((res: any) => {
          (this.programId = res.result.id),
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {
                programId: this.programId,
                mode: modes.EDIT,
              },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            });
            this.programWithRolloutService.programData.id = res.result.id;
            console.log(res)
            if(showToast) {
              this.toastService.openSnackBar({
                message: res.message,
                class: 'success',
              })
            }
        })
    }

     saveForm() {
        if (this.programWithRolloutService.programData.title) {
          // this.programWithRolloutService.formMeta.formValidation.projectDetail = (this.formLib?.myForm.status === "INVALID" || this.formLib?.subform?.myForm.status === "INVALID") ? "INVALID" : "VALID";
          if (this.programId) {
            this.programWithRolloutService.updateProgramDraft(this.programId).subscribe();
          }
          else {
            return this.createProgram({title:this.programWithRolloutService.programData.title},true)
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
            },
          });
          return dialogRef
            .afterClosed()
            .toPromise()
            .then((result) => {
               if (result.data === 'CONTINUE') {
                if(result.title){
                  this.programWithRolloutService.upDateProgramTitle(result.title);
                  this.programWithRolloutService.setProgramData({title:result.title});
                  if (this.programId) {
                    this.programWithRolloutService.upDateProgramTitle(this.programId);
                  }
                  else {
                    return this.createProgram(this.programWithRolloutService.programData,true)
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

   ngOnDestroy() {
      if(this.mode === modes.EDIT){
          if(this.programWithRolloutService.programData.id) {
            this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData,this.programId).subscribe((res:any)=> console.log(res))
          }
        }
      this.subscription.unsubscribe();
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    }
}
