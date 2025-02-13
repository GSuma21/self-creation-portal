import { Component } from '@angular/core';
import { ArrayContainsAllDirective, CardComponent, DialogPopupComponent, FormService, modes, PROJECT_DETAILS_PAGE, RESOURCE_LIST, ToastService } from 'lib-shared-modules';
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
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-program-resources',
  standalone: true,
  imports: [CommonModule,MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, MatCardModule,TranslateModule,ArrayContainsAllDirective, CardComponent],
  templateUrl: './program-resources.component.html',
  styleUrl: './program-resources.component.scss',
})
export class ProgramResourcesComponent {
  resourceList:any
  resourceCount:any = 0;
  resources:any;
  permissions:any;
  parent:any;
  resourceIds:any=[]
  programId:any;
  isResourceIsNotPresent:boolean = false;
  private subscription: Subscription = new Subscription();

constructor(private formService: FormService, private router:Router,private route: ActivatedRoute,public programWithRolloutService:ProgramWithRolloutService, private dialog:MatDialog, private toastService:ToastService){
  this.parent = this.route.snapshot.queryParamMap.get('parent');
  this.subscription.add(
    this.route.queryParamMap.subscribe((params) => {
      this.resourceIds = params.getAll('resourceIds').map(id => Number(id));
      this.programId =  this.route.snapshot.queryParamMap.get('programId');
    })
  )
}

ngOnInit(){
  const navigation = history.state;
  if (navigation.programErrors) {
      if( Object.values(navigation.programErrors.tabValidationForProgram).some(value => "INVALID")){
        this.programWithRolloutService.tabValidationForProgram = navigation.programErrors.tabValidationForProgram
        this.programWithRolloutService.formMeta.formValidation.programResources = navigation.programErrors.tabValidationForProgram.formErrors
        this.isResourceIsNotPresent = (navigation.programErrors.tabValidationForProgram == 'INVALID')  ? true : false;
      }
  }
  this.getsolutionList()
  if(this.resourceIds?.length){
    this.subscription.add(
      this.programWithRolloutService.addResourceToProgram({"resource_ids": this.resourceIds},this.programId).subscribe((res:any) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { parent: 'draft', programId: this.programId, mode: modes.EDIT }
        });
        let data = {
          message: 'ADDED_RESOURCE_SUCCESSFULLY_MESSAGE',
          class: 'success',
        };
        this.toastService.openSnackBar(data);
        // Optionally, clear resourceIds in your component
        this.readProgram();
      })
    )
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
  if(this.programId && Object.keys(this.programWithRolloutService.programData)?.length > 1){
    this.resourceCount  = this.programWithRolloutService.programData.resources.length;
    this.resources = this.programWithRolloutService.programData.resources
    this.addActionButtons()
  }else if(!this.resourceIds?.length  && this.programId && Object.keys(this.programWithRolloutService.programData)?.length < 1){
    this.readProgram()
  }

  this.subscription.add( // Check validation before sending for review.
    this.programWithRolloutService.isProgramSendForReviewValidation.subscribe(
      (reviewValidation: boolean) => {
        if(reviewValidation) {
          this.programWithRolloutService.formMeta.formValidation.programResources =  this.programWithRolloutService.programData.resources?.length ? 'VALID' : 'INVALID'
          this.isResourceIsNotPresent =  this.programWithRolloutService.programData.resources?.length ? false : true
          this.programWithRolloutService.triggerProgramSendForReview();
        }
      }
    )
  );


  this.subscription.add(
    this.programWithRolloutService.programApiErrors.subscribe(
      (errors: any) => {
        if(errors){
           this.programWithRolloutService.formMeta.formValidation.programResources =  this.programWithRolloutService.programData.resources?.length ? 'VALID' : 'INVALID'
           this.isResourceIsNotPresent = true
        }
      }
    )
  );

  this.isResourceIsNotPresent = (this.programWithRolloutService.tabValidationForProgram.programResources == 'INVALID')  ? true : false;
}

ngAfterViewChecked() {
  if(this.programId) {
    if( this.programWithRolloutService.tabValidationForProgram.programResources == 'INVALID' && this.programWithRolloutService.formMeta.formValidation.programResources == "INVALID" && (this.programWithRolloutService.programData.resources?.length <= 0) ) {
        this.subscription.add(
          this.programWithRolloutService.programApiErrors.subscribe(
            (errors: any) => {
              if(errors){
                  this.isResourceIsNotPresent = (this.programWithRolloutService.tabValidationForProgram.programResources == 'INVALID')  ? true : false;
                  this.programWithRolloutService.formMeta.formValidation.programResources =  this.programWithRolloutService.programData.resources?.length ? 'VALID' : 'INVALID'
              }

            }
          )
        );
    }
  }
}

readProgram(){
  this.resourceIds = [];
  this.subscription.add(
    this.programWithRolloutService
      .readProgram(this.programId)
      .subscribe((res: any) => {
        this.programWithRolloutService.setProgramData(res.result)
        this.updateResourceTargetCriteria()
        this.resourceCount  = this.programWithRolloutService.programData.resources.length;
        this.resources = this.programWithRolloutService.programData.resources
        this.addActionButtons()
        this.programWithRolloutService.upDateProgramTitle()
        if((this.programWithRolloutService.tabValidationForProgram.programDetails == 'INVALID' || this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting == 'INVALID') && ( res.result.resources?.length <= 0)){
            this.isResourceIsNotPresent = true;
            this.programWithRolloutService.tabValidationForProgram.programResources = 'INVALID'
        }
    }))
}

createProgram() {
  if(!this.programId){
    this.subscription.add(
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
    )
  }
}

saveForm(){
  if (!this.programId) {
    this.subscription.add(
      this.programWithRolloutService
      .createOrUpdateProgram()
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
    )
  } else {
    this.subscription.add(
      this.programWithRolloutService
      .createOrUpdateProgram(this.programWithRolloutService.programData,this.programId)
      .subscribe()
    )
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
  this.subscription.add(
    this.formService.getPermissions().subscribe((res:any) => {
      this.formService.getForm(RESOURCE_LIST).subscribe((form) =>{
        this.permissions = res.result;
          this.resourceList = form?.result?.data?.fields?.controls.filter((item:any) => {
            if(item.title != "PROGRAM") {
              return item
            }
        })
      })
    })
  )
}


  onCardClick(cardItem: any) {
    const newData = { formErrors: this.programWithRolloutService.formMeta.formValidation , tabValidationForProgram:  this.programWithRolloutService.tabValidationForProgram };
    this.router.navigate(['roll-out/choose-resource'],{queryParams:{parent: 'program-resources', selectFor:'programs', programId: this.programId}, state : { programErrors: newData } })
  }

  statusButtonClick(event: { label: string, item: any }) {
    const { label, item } = event;

    switch (label) {
            case 'EDIT':
              if(item.type === 'project'){
                this.router.navigate([PROJECT_DETAILS_PAGE], {
                              queryParams: {
                                parent:'program-resources',
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
                  this.subscription.add(
                    this.programWithRolloutService.removeResourcesFromPrograms(item.id).subscribe((res:any)=>{
                      this.toastService.openSnackBar({
                        "message": 'RESOURCE_DELETED_SUCCESSFULLY',
                        "class": "success"
                      })
                      this.readProgram()
                     })
                  )
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

    updateResourceTargetCriteria() {
      if(this.programWithRolloutService.programData.targeting_criteria?.length > 0) {
        this.programWithRolloutService.programData.resources.forEach((resource:any)=>{
          if(!resource.targeting_criteria || resource.targeting_criteria.length != this.programWithRolloutService.programData.targeting_criteria.length) {
            resource.targeting_criteria  = this.programWithRolloutService.programData.targeting_criteria
          }
        })
      }
      this.saveForm()
    }
}
