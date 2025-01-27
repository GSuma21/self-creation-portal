import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-suma';
import { FormService, PROGRAM_DETAILS } from 'lib-shared-modules';
import { Subscription } from 'rxjs/internal/Subscription';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';

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

  constructor( private formService: FormService,private dialog:MatDialog, private programWithRolloutService:ProgramWithRolloutService) {
      // this.startAutoSaving()
      // this.subscription.add(
      //   this.route.queryParams.subscribe((params: any) => {
      //     this.mode = params.mode ? params.mode : ""
      //   })
      // )
     }
  
   ngOnInit() {
    this.getFormWithEntitiesAndMap()
    }



    getFormWithEntitiesAndMap(){
        this.formService.getFormWithEntities(PROGRAM_DETAILS).then((data) => {
          this.readProjectDeatilsAndMap(data.controls,[]);
          // if (data) {
          //   this.formDataForTitle = data.controls.find((item:any) => item.name === 'title');
          //   this.subscription.add(
          //     this.route.queryParams.subscribe((params: any) => {
          //       this.projectId = params.projectId;
          //       this.libProjectService.projectData.id = params.projectId;
          //       if (params.projectId) {
          //         if (params.mode === projectMode.EDIT || this.mode === projectMode.REQUEST_FOR_EDIT) {
          //           if (Object.keys(this.libProjectService.projectData).length > 1) { // project ID will be there so length considered as more than 1
          //             this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
          //           } else {
          //             this.subscription.add(
          //               this.libProjectService
          //                 .readProject(this.projectId)
          //                 .subscribe((res: any) => {
          //                   this.libProjectService.setProjectData(res.result);
          //                  this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
          //                   this.readProjectDeatilsAndMap(data.controls,res.result);
          //                   this.libProjectService.upDateProjectTitle();
          //                   // comments list and configuration
          //                 })
          //             );
          //           }
          //           this.checkAndGetCommentConfigs()
          //         }else{
          //           if (Object.keys(this.libProjectService.projectData).length > 1) { // project ID will be there so length considered as more than 1
          //             this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
          //           } else {
          //             this.subscription.add(
          //               this.libProjectService
          //                 .readProject(this.projectId)
          //                 .subscribe((res: any) => {
          //                   this.libProjectService.setProjectData(res.result);
          //                  this.libProjectService.formMeta = res.result.formMeta ? res.result.formMeta : this.libProjectService.formMeta;
          //                   this.readProjectDeatilsAndMap(data.controls,res.result);
          //                   // comments list and configuration
          //                 })
          //             );
          //           }
          //           this.checkAndGetCommentConfigs()
          //         }
          //       } else {
          //         this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
          //       }
          //     })
          //   );
          // }
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

   ngOnDestroy() {
      this.subscription.unsubscribe();
    }
}
