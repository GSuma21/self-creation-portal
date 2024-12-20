import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';
import { MatDialog } from '@angular/material/dialog';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-suma';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent, DialogPopupComponent, FormService, PreviewComponent, ROLL_OUT_DETAILS, UtilService } from 'lib-shared-modules';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'lib-resource-details',
  standalone: true,
  imports: [DynamicFormModule, TranslateModule,CardComponent],
  templateUrl: './resource-details.component.html',
  styleUrl: './resource-details.component.scss',
  providers: [DatePipe]
})
export class ResourceDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('formLib') formLib: MainFormComponent | undefined;
  dynamicFormData:any ;
  viewOnly:any = false;
  resourceId:string = '';
  resourceItem:any;
  infoFieldsData: any = [
    {
        "label": "TITLE",
        "value": "",
        "name": "title"
    },
    {
        "label": "CREATOR",
        "value": "",
        "name": "creator"
    },
    {
        "label": "ORGANIZATION",
        "value": "",
        "name": "organization.name"
    },
    {
        "label": "RESOURCE_TYPE",
        "value": "",
        "name": "type"
    },
    {
        "label": "REVIEWED_BY",
        "value": "",
        "name": "reviewed_by"
    },
    {
        "label": "PUBLISHED_ON",
        "value": "",
        "name": "published_on"
    }
  ];
  resourceButtons:any = [
    {action :"PREVIEW",background_color:"#0a4f9d",label: "PREVIEW"},
    {action :"CHANGE_SELECTION",label: "CHANGE_SELECTION", color:'#0a4f9d', class:'button-enable'}]
  private subscription: Subscription = new Subscription();
  constructor(private dialog:MatDialog, private formService: FormService, private programWithRolloutService:ProgramWithRolloutService, private route: ActivatedRoute, private datePipe: DatePipe, private utilService:UtilService, private router:Router) {
    this.subscription.add(
      this.route.queryParams.subscribe((params:any) => {
        this.resourceId = params.resourceId;
        this.programWithRolloutService.rolloutId = params.rolloutId;
        this.programWithRolloutService.rollOutDetails.resource_id = params.resourceId;
      })
    )
  }

  ngOnInit(): void {
    this.getResourceDetails()
  }

  getResourceDetails() {
   this.subscription.add(
    this.programWithRolloutService.readPublishedResources(this.resourceId).subscribe((res:any)=> {
      this.resourceItem = res.result.data[0];
      this.programWithRolloutService.resourceDetails = res.result.data[0];
      this.resourceItem.actionButton = this.resourceButtons
      this.getRollOutDetails(); // rollout details should be called after resource details fetched
    })
   )
  }

   /**
   * This functions is used to add the buttons click event as per its label it will call the actions
   * @param event -listresource api response.
   * event click action for each label
   */
   statusButtonClick(event: { label: string, item: any }) {
    const { label, item } = event;
   //  if(this.pageStatus === 'roll-out'){

   //  }else{
     switch (label) {
      case 'PREVIEW': {
        this.subscription.add(
          this.programWithRolloutService.readProject(this.resourceId).subscribe((res:any)=> {
            this.utilService.removeEmptyKey(res.result).subscribe(
              (cleanedData) => {
                const dialogRef = this.dialog.open(PreviewComponent, {
                  width: '23rem',
                  autoFocus: false,
                  disableClose: false,
                  data: {
                    projectData: cleanedData,
                  },
                });
              }
            );
          })
        )
        break;
      }
      case "CHANGE_SELECTION":{
        this.router.navigate(['choose-resource'],{queryParams:{parent:"roll-out"}})
        break;
      }
       default:
         break;
     }
   //  }
  }

  showPreview() {
    this.utilService.removeEmptyKey(this.programWithRolloutService.resourceDetails).subscribe(
      (cleanedData) => {
        const dialogRef = this.dialog.open(PreviewComponent, {
          width: '23rem',
          autoFocus: false,
          disableClose: false,
          data: {
            projectData: cleanedData,
          },
        });
      }
    );
  }

  /**
   * This functions is used for the infoicon click
   * @param event - onclicking the event is calling data in the card
   * @return resourcelist api response on infoiconclick for each item
   */
  infoIconClickEvent(event: any) {
    const cardItem = event.item;

    //to get field data from listapi to map in json
    const getFieldData = (field: any) => {
      let value = cardItem[field.name] || '';
      if (field.name.includes('organization')) {
        value = cardItem.organization ? cardItem.organization.name : '';
      } else if (this.isISODate(value)) {
        value = this.datePipe.transform(value, 'dd/MM/yyyy');
      }
      return {
        label: field.label,
        value: value
      };
    };

    // Function to filter and map fields based on conditions
    const filterAndMapFields = (status: string | null) => {
      return this.infoFieldsData
        .filter((field: any) => field.status === status || !field.status)
        .map(getFieldData);
    };

    //info fields to display as per the review_status
    let infoFields = [];
    infoFields = filterAndMapFields(cardItem.review_status);

    // If no fields match the conditions, default to 'NOT_STARTED' fields
    if (infoFields.length === 0) {
      infoFields = filterAndMapFields('NOT_STARTED');
    }
    if(!cardItem.review_status) {
      infoFields = filterAndMapFields(cardItem.status);
    }

    const dialogRef = this.dialog.open(DialogPopupComponent, {
      width: '39.375rem',
      data: {
        header: "DETAILS",
        fields: infoFields
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      return result ? true : false;
    });
  }

    //Check for ISO date format
    isISODate(value: string): boolean {
      if (typeof value !== 'string') {
        return false;
      }
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
      return isoDateRegex.test(value);
    }

  getRollOutDetails(){
    this.formService.getForm(ROLL_OUT_DETAILS).subscribe((rolloutDetails:any) => {
      rolloutDetails.result.data.fields?.controls.forEach((control:any) => {
        if (control.name === "viewers") {
          this.programWithRolloutService.getDataManagerList().subscribe((dataManagerList:any)=> {
            const items = dataManagerList.result?.data || []; // Access the array safely
            const formattedOptions = items.map((item: any) => ({
                label: item.name,
                value: item.id
            }));
            control.options = [...formattedOptions];
            })
            if(this.programWithRolloutService.rolloutId) {
              this.programWithRolloutService.getRolloutDetails().subscribe((res:any) => {
                this.programWithRolloutService.rollOutDetails = res.result;
                this.programWithRolloutService.rollOutDetails.resource_id = this.resourceId;
                this.readProjectDeatilsAndMap(rolloutDetails.result.data.fields?.controls,res.result);
              })
            }
            else {
              rolloutDetails.result.data.fields?.controls.forEach((item:any) => {
                if(item.name == 'title') {
                  item.value = this.resourceItem.title
                }
              });
              this.programWithRolloutService.rollOutDetails.resource_id = this.resourceId;
              this.dynamicFormData = rolloutDetails.result.data.fields?.controls;
            }
        }
      });
    });
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
      if (element.name === "viewers") {
        element.value = element.value.map((item: any) => item.id);
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

  getDynamicFormData(event:any){
    this.programWithRolloutService.rollOutDetails = {...this.programWithRolloutService.rollOutDetails,...event};
    this.programWithRolloutService.rollOutDetails.viewers = event?.viewers.map((item:any) => item.value);
  }

  getFormControlChange(event:any){

  }

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

        dialogRef.afterClosed().subscribe((res: any) => {
          console.log('Dialog result:', res,this.programWithRolloutService.rollOutDetails);
          this.dynamicFormData.forEach((element:any) => {
            if(element.name == "targeting_criteria") {
              element.value.push(res);
              // this.programWithRolloutService.rollOutDetails.targeting_criteria
            }
          })
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
      case "EDIT":
        break;
      case "DELETE":
        const dialogRef = this.dialog.open(DialogPopupComponent, {
          width: '39.375rem',
          disableClose: true,
          data: {
            header: "DELETE_TARGETING_DETAILS",
            content: "DELETE_TARGETING_DETAILS_MESSAGE",
            cancelButton: "CANCEL",
            exitButton: "DELETE"
          }
        });
        dialogRef.afterClosed().subscribe((res: any) => {
          if(res.data == "DELETE"){
            this.dynamicFormData.forEach((element:any) => {
              if(element.name == "targeting_criteria") {
                element.value.splice(control.index, 1);
              }
            })
          }
        });
        break;
      default:
        break;
    }

  }

  ngOnDestroy(): void {
    this.programWithRolloutService.resourceDetails = {};
    this.programWithRolloutService.rollOutDetails = {};
  }

}
