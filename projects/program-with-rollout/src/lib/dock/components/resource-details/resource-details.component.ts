import { Component, OnInit, ViewChild } from '@angular/core';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';
import { MatDialog } from '@angular/material/dialog';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-suma';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent, FormService, ROLL_OUT_DETAILS } from 'lib-shared-modules';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'lib-resource-details',
  standalone: true,
  imports: [DynamicFormModule, TranslateModule,CardComponent],
  templateUrl: './resource-details.component.html',
  styleUrl: './resource-details.component.scss'
})
export class ResourceDetailsComponent implements OnInit {
  @ViewChild('formLib') formLib: MainFormComponent | undefined;
  dynamicFormData:any ;
  viewOnly:any = false;
  resourceId:string = '';
  resourceItem:any;
  resourceButtons:any = [
    {action :"PREVIEW",background_color:"#0a4f9d",label: "PREVIEW"},
    {action :"CHANGE_SELECTION",background_color:"#0a4f9d",label: "CHANGE_SELECTION",}]
  private subscription: Subscription = new Subscription();
  constructor(private dialog:MatDialog, private formService: FormService, private programWithRolloutService:ProgramWithRolloutService, private route: ActivatedRoute) {
    this.subscription.add(
      this.route.queryParams.subscribe((params:any) => {
        this.resourceId = params.resourceId;
      })
    )
  }

  ngOnInit(): void {
     this.getRollOutDetails();
     this.getResourceDetails()
  }

  getResourceDetails() {
   this.subscription.add(
    this.programWithRolloutService.readProject(this.resourceId).subscribe((res:any)=> {
      this.resourceItem = res.result;
      this.resourceItem.actionButton = this.resourceButtons
    })
   )
  }

  infoIconClickEvent(data:any) {
    console.log(data);
  }

  getRollOutDetails(){
    this.formService.getForm(ROLL_OUT_DETAILS).subscribe((rolloutDetails:any) => {
      rolloutDetails.result.data.fields?.controls.forEach((control:any) => {
        if (control.name === "data_manager") {
          this.programWithRolloutService.getDataManagerList().subscribe((dataManagerList:any)=> {

            const items = dataManagerList.result?.data || []; // Access the array safely
            const formattedOptions = items.map((item: any) => ({
                label: item.name,
                value: item.id
            }));
            control.options = [...formattedOptions];
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
