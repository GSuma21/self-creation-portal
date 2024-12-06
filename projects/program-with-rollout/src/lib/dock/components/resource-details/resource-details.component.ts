import { Component, OnInit, ViewChild } from '@angular/core';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';
import { MatDialog } from '@angular/material/dialog';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-suma';
import { TranslateModule } from '@ngx-translate/core';
import { FormService, ROLL_OUT_DETAILS } from 'lib-shared-modules';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';

@Component({
  selector: 'lib-resource-details',
  standalone: true,
  imports: [DynamicFormModule, TranslateModule],
  templateUrl: './resource-details.component.html',
  styleUrl: './resource-details.component.scss'
})
export class ResourceDetailsComponent implements OnInit {
  @ViewChild('formLib') formLib: MainFormComponent | undefined;
  dynamicFormData:any ;
  viewOnly:any = false;
  constructor(private dialog:MatDialog, private formService: FormService, private programWithRolloutService:ProgramWithRolloutService) {

  }

  ngOnInit(): void {
     this.getDataManagerList()
     this.getRollOutDetails()
  }

  getDataManagerList(){
     
  }

  getRollOutDetails(){
    this.formService.getForm(ROLL_OUT_DETAILS).subscribe((rolloutDetails:any) => {
      rolloutDetails.result.data.fields?.controls.forEach((control:any) => {
        if (control.name === "data_manager") {
          this.programWithRolloutService.getDataManagerList().subscribe((dataManagerList:any)=> {
            control.options = [...dataManagerList?.result?.data]; // Add the new values
           })
        }
      });
      this.dynamicFormData = rolloutDetails.result.data.fields?.controls
    });
  }
  getDynamicFormData(event:any){

  }

  getFormControlChange(event:any){

  }

  onClickableButton(control: any) {
    switch (control.name) {
      case "target_criteria": 
        const dialogRef = this.dialog.open(TargetCriteriaComponent, {
          width: '80%',
          height: '80%',
          disableClose: true,
          autoFocus: false,
          data: {
            sideNavData: [
              {
                action: "",
                icon: "description",
                label: "State",
                page: "projectDetails",
                url: "project-details"
              },
              {
                action: "",
                icon: "description",
                label: "Gender",
                page: "projectDetails",
                url: "project-details"
              }
            ],
            header: 'SAVE_CHANGES',
            content: 'ADD_TITLE_TO_CONTINUE_SAVING',
            exitButton: 'CONTINUE',
          },
        });
  
        // Handle dialog closure
        dialogRef.afterClosed().subscribe((res: any) => {
          console.log('Dialog result:', res);
        });
        break; // Exit switch after handling this case
      default:
        break; // Default case for unmatched control names
    }
  }

}
