import { Component } from '@angular/core';
import { ArrayContainsAllDirective, CardComponent, DialogPopupComponent, FormService, modes, PROJECT_DETAILS_PAGE, SOLUTION_LIST, ToastService } from 'lib-shared-modules';
import { TranslateModule } from '@ngx-translate/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { map, Observable, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'lib-program-resources',
  standalone: true,
  imports: [ MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, MatCardModule,TranslateModule,ArrayContainsAllDirective, CardComponent],
  templateUrl: './program-resources.component.html',
  styleUrl: './program-resources.component.scss',
  providers: [DatePipe]
})
export class ProgramResourcesComponent {
  resourceList:any
  resourceCount:any = 0;
  resources:any;
  permissions:any;
  parent:any;
  resourceIds:any=[]
  programId:any;
  private subscription: Subscription = new Subscription();
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

constructor(private formService: FormService, private router:Router,private route: ActivatedRoute,private programWithRolloutService:ProgramWithRolloutService, private dialog:MatDialog,  private datePipe: DatePipe, private toastService:ToastService){
  this.parent = this.route.snapshot.queryParamMap.get('parent');
  this.route.queryParamMap.subscribe((params) => {
    this.resourceIds = params.getAll('resourceIds').map(id => Number(id));
    this.programId =  this.route.snapshot.queryParamMap.get('programId');
  });
}

ngOnInit(){
  this.getsolutionList()
  if(this.resourceIds?.length){
    this.programWithRolloutService.addResourceToProgram({"resource_ids": this.resourceIds},this.programId).subscribe((res:any) => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { parent: this.parent, programId: this.programId, mode: modes.EDIT }
      });
      let data = {
        message: 'ADDED_RESOURCE_SUCCESSFULLY_MESSAGE',
        class: 'success',
      };
      this.toastService.openSnackBar(data);
      // Optionally, clear resourceIds in your component
      this.readProgram();
    })
  }
  this.subscription.add(
    this.programWithRolloutService.isProgramSave.subscribe(
      (isProjectSave: boolean) => {
        if (isProjectSave) {
          this.saveForm();
        }
      }
    )
  );
  if(!this.resourceIds?.length  && !this.programId){
    this.createProgram();
  }
  if(this.programId && !this.resourceIds?.length){
    this.readProgram();
  }
}

readProgram(){
  this.resourceIds = [];
  this.subscription.add(
    this.programWithRolloutService
      .readProgram(this.programId)
      .subscribe((res: any) => {
        this.programWithRolloutService.setProgramData(res.result)
        this.resourceCount  = this.programWithRolloutService.programData.resources.length;
        const resourceIds = this.programWithRolloutService.programData.resources.map((resource:any) => resource.id);
        if(resourceIds.length){
          this.getResourceDetails(resourceIds)
        }
        this.programWithRolloutService.upDateProgramTitle()
    }))
}


getResourceDetails(resourceIds:any) {
  this.subscription.add(
    this.programWithRolloutService.readPublishedResources(resourceIds).subscribe((res:any)=> {
      this.resources = res.result.data
      this.addActionButtons()
    })
   )
 }

createProgram() {
  if(!this.programId){
    this.programWithRolloutService
            .createOrUpdateProgram({title:this.programWithRolloutService.programData.title ? this.programWithRolloutService.programData.title: 'Untitled program'})
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
              })
  }
}

saveForm(){
  if(this.programId){
    this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData,this.programId).subscribe();
  }
}

addActionButtons(){
  let buttonData = [
    {
      "action": "EDIT",
      "label": "EDIT",
      "background_color": "#0a4f9d"
  }, {
    "action": "DELETE",
    "label": "DELETE",
    "background_color": "#EC555D"
}
  ]

this.resources = this.resources.map((resource:any) => ({
  ...resource,
  actionButton: buttonData // Use spread operator to add 'EDIT' and 'DELETE' to each object
}));
}

getsolutionList() {
  this.formService.getPermissions().subscribe((res:any) => {
    this.formService.getForm(SOLUTION_LIST).subscribe((form) =>{
      this.permissions = res.result;
        this.resourceList = form?.result?.data?.fields?.controls.filter((item:any) => {
          if(item.title != "PROGRAM") {
            return item
          }
      })
    })
  })
}


  onCardClick(cardItem: any) {
    this.router.navigate(['roll-out/choose-resource'],{queryParams:{parent: this.parent, selectFor:'programs', programId: this.programId}})
  }

  statusButtonClick(event: { label: string, item: any }) {
    const { label, item } = event;

    switch (label) {
            case 'EDIT':
              if(item.type === 'project'){
                this.router.navigate([PROJECT_DETAILS_PAGE], {
                              queryParams: {
                                programId:this.programId,
                                programResourceId: item.id,
                                mode: modes.META_EDIT,
                              }
                            });
                break;
              }else{
                break;
              }
            case 'DELETE':
              this.confirmAndDeleteProject("DELETE_ADDED_RESOURCE_MESSAGE").subscribe((isdelete:any) => {
                if(isdelete){
                  this.programWithRolloutService.removeResourcesFromPrograms(item.id).subscribe((res:any)=>{
                    this.toastService.openSnackBar({
                      "message": 'RESOURCE_DELETED_SUCCESSFULLY',
                      "class": "success"
                    })
                    this.readProgram()
                   })
                }
              })
              break;
            default:
              break;
          }
  }

   //Check for ISO date format
   isISODate(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
    return isoDateRegex.test(value);
  }

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

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.resources=[]
  }

  confirmAndDeleteProject(message:string="CONFIRM_DELETE_MESSAGE" ): Observable<boolean> {
      const dialogRef = this.dialog.open(DialogPopupComponent, {
        width: '39.375rem',
        disableClose: true,
        data: {
          header: "DELETE_RESOURCE",
          content: message,
          cancelButton: "CANCEL",
          exitButton: "DELETE"
        }
      });
  
      return dialogRef.afterClosed().pipe(
        map((result) => {
          if (result?.data === "DELETE") {
            return true;
          }
          return false;
        })
      );
    }
}
