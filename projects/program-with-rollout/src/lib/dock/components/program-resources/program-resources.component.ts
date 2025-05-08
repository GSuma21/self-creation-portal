import { Component, OnDestroy } from '@angular/core';
import { ArrayContainsAllDirective, CardComponent, CommentsBoxComponent, DialogPopupComponent, FormService, solutionModes, PROJECT_DETAILS_PAGE, RESOURCE_LIST, resourceStatus, ToastService, UtilService, CHOOSE_RESOURCES } from 'lib-shared-modules';
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
  imports: [CommonModule,MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, MatCardModule,TranslateModule,ArrayContainsAllDirective, CardComponent,CommentsBoxComponent],
  templateUrl: './program-resources.component.html',
  styleUrl: './program-resources.component.scss',
})
export class ProgramResourcesComponent implements OnDestroy {
  resourceList:any
  resourceCount:any = 0;
  resources:any;
  permissions:any;
  parent:any;
  checkValidationOnInit:any = false;
  resourceIds:any=[]
  programId:any;
  isResourceIsNotPresent:boolean = false;
  commentPayload: any;
  commentsList: any = [];
  ResourceInReview: boolean = false;
  mode:any;
  viewOnly:boolean = false;
  isResourceNotgrayedOut =  true;
  isResourceTileShow= true;
  private subscription: Subscription = new Subscription();

constructor(private formService: FormService, private router:Router,private route: ActivatedRoute,public programWithRolloutService:ProgramWithRolloutService, private dialog:MatDialog, private toastService:ToastService, private utilService: UtilService,private toast:ToastService){
  this.parent = this.route.snapshot.queryParamMap.get('parent');
  this.subscription.add(
    this.route.queryParamMap.subscribe((params) => {
      this.resourceIds = params.getAll('resourceIds').map(id => Number(id));
      this.programId =  this.route.snapshot.queryParamMap.get('programId');
      this.checkValidationOnInit =  this.route.snapshot.queryParamMap.get('checkValidations');
    })
  )
  this.subscription.add(
    this.route.queryParams.subscribe((params: any) => {
      this.mode = params.mode ? params.mode : ""
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
          queryParams: { parent: this.parent, programId: this.programId, mode: this.mode, checkValidations:this.checkValidationOnInit }
        });
        let data = {
          message: 'ADDED_RESOURCE_SUCCESSFULLY_MESSAGE',
          class: 'success',
        };
        this.toastService.openSnackBar(data);
        // Optionally, clear resourceIds in your component
        this.readProgram();
        if(this.mode === solutionModes.RESOURCE_EDIT){
          this.changeResourceLevelTargetingToast()
        }
      })
    )
  }
  if (this.mode === solutionModes.VIEWONLY || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW || this.mode === solutionModes.COPY_EDIT || this.mode === solutionModes.META_EDIT || this.mode === solutionModes.PUBLISHED_VIEW) {
    this.viewOnly = true
    // this.getProjectDetailsForViewOnly();
  }
  if(this.mode === solutionModes.META_EDIT || this.mode === solutionModes.REVIEW || this.mode === solutionModes.REVIEWER_VIEW){
    this.isResourceNotgrayedOut = this.mode === solutionModes.META_EDIT ? false : true;
    this.isResourceTileShow = false
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
    this.resourceCount  =this.programWithRolloutService.programData.resources ?  this.programWithRolloutService.programData.resources?.length : 0;
    this.resources = (this.programWithRolloutService.programData.published_on && (this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT)) ? this.programWithRolloutService.programData.resources.slice().reverse():  this.programWithRolloutService.programData.resources
    this.addActionButtons()
    if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.CREATOR_VIEW) && (this.mode !== solutionModes.VIEWONLY)) {
      this.getCommentConfigs()
    }
    if(this.checkValidationOnInit) {
      this.programWithRolloutService.triggerProgramSendForReview();
    }
  }else if(!this.resourceIds?.length  && this.programId && Object.keys(this.programWithRolloutService.programData)?.length < 1){
    this.readProgram()
    if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW || this.mode === solutionModes.CREATOR_VIEW) && (this.mode !== solutionModes.VIEWONLY)) {
      this.getCommentConfigs()
    }
    if(this.checkValidationOnInit) {
      this.programWithRolloutService.triggerProgramSendForReview();
    }
  }

  this.subscription.add( // Check validation before sending for review.
    this.programWithRolloutService.isProgramSendForReviewValidation.subscribe(
      (reviewValidation: boolean) => {
        if(reviewValidation) {
          this.programWithRolloutService.formMeta.formValidation.programResources =  this.programWithRolloutService.programData.resources?.length > 0 ? 'VALID' : 'INVALID'
          this.isResourceIsNotPresent =  this.programWithRolloutService.formMeta.formValidation.programResources !== 'INVALID' ? false : true
          this.programWithRolloutService.triggerProgramSendForReview();
        }
      }
    )
  );


  this.subscription.add(
    this.programWithRolloutService.programApiErrors.subscribe(
      (errors: any) => {
        if(errors){
           this.programWithRolloutService.formMeta.formValidation.programResources =  this.programWithRolloutService.programData.resources?.length > 0 ? 'VALID' : 'INVALID'
           this.isResourceIsNotPresent = true
        }
      }
    )
  );

  this.subscription.add( // Check validation before publishing published program.
    this.programWithRolloutService.isProgramPublishalidation.subscribe(
      (programValidation: boolean) => {
        if (programValidation) {
          this.programWithRolloutService.formMeta.formValidation.programResources =  this.programWithRolloutService.programData.resources?.length > 0 ? 'VALID' : 'INVALID'
          this.isResourceIsNotPresent =  this.programWithRolloutService.formMeta.formValidation.programResources !== 'INVALID' ? false : true
          this.programWithRolloutService.triggerPublishProgram();
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
                  this.programWithRolloutService.formMeta.formValidation.programResources =  this.programWithRolloutService.programData.resources?.length > 0 ? 'VALID' : 'INVALID'
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
        // this.programWithRolloutService.tabValidationForProgram = res.result.metaData
        this.programWithRolloutService.formMeta.formValidation = res.result.metaData
        this.programWithRolloutService.setProgramData(res.result)
        this.programWithRolloutService.updateResourceTargetCriteria(this.programId)
        this.resourceCount  = this.programWithRolloutService.programData.resources ? this.programWithRolloutService.programData.resources.length : 0;
        this.resources = (this.programWithRolloutService.programData.published_on && (this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW  || this.mode === solutionModes.REQUEST_FOR_EDIT)) ? this.programWithRolloutService.programData.resources.slice().reverse():  this.programWithRolloutService.programData.resources
        this.programWithRolloutService.tabValidationForProgram.programResources = res.result.resources?.length > 0 ? 'VALID' : 'INVALID'
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
              mode: solutionModes.EDIT,
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
              mode: solutionModes.EDIT,
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
      .updateProgramDraft(this.programId)
      .subscribe()
    )
  }
}

addActionButtons(){
  let buttonData: { action: string; label: string; background_color: string; }[] = []
  if(this.mode == solutionModes.EDIT || this.mode == solutionModes.REQUEST_FOR_EDIT  || this.mode == solutionModes.RESOURCE_EDIT) {
    buttonData = [
      {
        action: 'EDIT',
        label: 'EDIT',
        background_color: '#0a4f9d',
      },
      {
        action: 'DELETE',
        label: 'DELETE',
        background_color: '#EC555D',
      },
    ];
  }
  else if(this.mode == solutionModes.REVIEW){
    buttonData = [
      {
        action: 'START_REVIEW',
        label: 'VIEW',
        background_color: '#0a4f9d',
      }
    ];
  }
  else if(this.mode == solutionModes.META_EDIT){
    buttonData = [];
  }
  else{
    buttonData = [
      {
        action: 'VIEW',
        label: 'VIEW',
        background_color: '#0a4f9d',
      }
    ];
  }

  this.resources = this.resources?.map((resource: any) => ({
    ...resource,
    actionButton: this.isResourceGrayedOut(resource) ? [
      {
        action: 'VIEW',
        label: 'VIEW',
        background_color: '#0a4f9d',
      },
      {
      action: 'COPY_TO_CLIPBOARD',
      label: 'COPY_RESOURCE',
      background_color: '#0a4f9d',
      }] :buttonData, // Use spread operator to add 'EDIT' and 'DELETE' to each object
  }));
}

getsolutionList() {
  this.subscription.add(
    this.formService.getPermissions().subscribe((res:any) => {
      this.formService.getForm(RESOURCE_LIST).subscribe((form) =>{
        this.permissions = res.result;
        localStorage.setItem("permission",JSON.stringify(this.permissions));
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
    this.router.navigate([CHOOSE_RESOURCES],{queryParams:{parent: 'program-resources', selectFor:'programs', programId: this.programId, type: cardItem.type, parentMode:this.mode, topLevelParent:this.parent}, state : { programErrors: newData }})
  }

  statusButtonClick(event: { button:any, item: any }) {
    const { button, item } = event;

    switch (button.label) {
      case 'EDIT':
        if (item.type === 'project') {
          if(this.mode === solutionModes.REQUEST_FOR_EDIT) {
            this.router.navigate([PROJECT_DETAILS_PAGE], {
              queryParams: {
                parent: 'program-resources',
                programId: this.programId,
                programResourceId: item.id,
                mode: solutionModes.META_REQUEST_FOR_EDIT,
                parentMode : this.mode,
                topLevelParent : this.parent
              }
            });
          }
          else {
            this.router.navigate([PROJECT_DETAILS_PAGE], {
              queryParams: {
                parent: 'program-resources',
                programId: this.programId,
                programResourceId: item.id,
                mode: solutionModes.META_EDIT,
                parentMode : this.mode,
                topLevelParent : this.parent
              }
            });
          }
          break;
        } else {
          break;
        }
      case 'DELETE':
        this.confirmAndDeleteProject("DELETE_ADDED_RESOURCE_MESSAGE").subscribe((isdelete: any) => {
          if (isdelete) {
            this.subscription.add(
              this.programWithRolloutService.removeResourcesFromPrograms(item.id).subscribe((res: any) => {
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
      case 'REVIEW':
        if (item.type === 'project') {
          this.goToProjectReview(item);
          break;
        } else {
          break;
        }
      case 'COPY_RESOURCE':
        if (item.type === 'project') {
          if(item.link !== null) {
            const dialogRef = this.dialog.open(DialogPopupComponent, {
              width: '39.375rem',
              height:'auto',
              data: {
                header: "COPY_RESOURCE",
                link: item.link,
                copyButton:"COPY_LINK"
              }
            });

            dialogRef.afterClosed().subscribe(result => {
              return result ? true : false;
            });
          }
          else {
            let data = {
              "message":'NO_LINK_AVAILABLE_TO_COPY',
              "class":"error",
            }
            this.toast.openSnackBar(data)
          }
          break;
        } else {
          break;
        }
      case 'VIEW':
        if(button.action == "START_REVIEW") {
          this.goToProjectReview(item);
          return;
        }
        if (item.type === 'project') {
          this.router.navigate([PROJECT_DETAILS_PAGE], {
            queryParams: {
              parent: 'program-resources',
              programId: this.programId,
              programResourceId: item.id,
              mode: (this.mode === solutionModes.CREATOR_VIEW ||  this.mode === solutionModes.REVIEWER_VIEW ) ? this.mode:solutionModes.VIEWONLY,
              parentMode : this.mode,
              topLevelParent : this.parent

            },
          });
          break;
        } else {
          break;
        }
      default:
        break;
    }
  }

  goToProjectReview(item:any) {
    if (item.type === 'project') {
      this.router.navigate([PROJECT_DETAILS_PAGE], {
        queryParams: {
          parent: 'program-resources',
          programId: this.programId,
          programResourceId: item.id,
          mode: solutionModes.META_REVIEW,
          parentMode : this.mode,
          topLevelParent : this.parent
        },
      });
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

  saveComment(quillInput:any){ //  This method is checking validation when a comment is updated or deleted.
    this.programWithRolloutService.checkValidationForRequestChanges(quillInput)
  }

  getCommentConfigs() {
    this.subscription.add(
      this.route.data.subscribe((data: any) => {
        this.utilService.getCommentList(this.programId).subscribe((commentListRes: any) => {
          const comments = commentListRes.result?.comments || [];
          const filteredComments = this.utilService.filterCommentByContext(comments, data.page);

          this.commentsList = this.commentsList.concat(filteredComments);
          this.commentPayload = data;
          this.ResourceInReview = this.mode === solutionModes.REVIEW || this.mode === solutionModes.REQUEST_FOR_EDIT ||  this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.CREATOR_VIEW ;
          this.programWithRolloutService.checkValidationForRequestChanges(comments,commentListRes.result?.childResources);
        });
      })
    );
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

  isResourceGrayedOut(resource:any){
    return (
      ((this.mode === solutionModes.RESOURCE_EDIT || this.mode === solutionModes.REVIEW ||  this.mode === solutionModes.REVIEWER_VIEW) ||
        (this.mode === solutionModes.REQUEST_FOR_EDIT &&
          this.programWithRolloutService.programData.status ===
            resourceStatus.REQUEST_FOR_CHANGES &&
          this.programWithRolloutService.programData.published_on)) &&
      new Date(this.programWithRolloutService.programData.published_on) >
        new Date(resource.created_at)
    );
  }

  changeResourceLevelTargetingToast(){
    this.toastService.openSnackBar({
      message: 'CHANGE_RESOURCE_LEVEL_TARGETING_TO_PUBLISH_PROGRAM',
      class: 'error',
    });
    this.programWithRolloutService.formMeta.formValidation.resourceLevelTargeting = "INVALID"
    this.programWithRolloutService.tabValidationForProgram.resourceLevelTargeting = "INVALID"
  }


  ngOnDestroy() {
    if((this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.RESOURCE_EDIT) && this.utilService.saveResources && this.programWithRolloutService.programData.length > 1){
      this.programWithRolloutService.formMeta.formValidation.programResources =  (this.programWithRolloutService.programData.resources?.length > 0) ? 'VALID' : 'INVALID'
      this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData, this.programId).subscribe((res:any)=>{})
    }
    this.subscription.add( // Check validation before sending for review.
    this.programWithRolloutService.isProgramSendForReviewValidation.subscribe(
      (reviewValidation: boolean) => {
        if(reviewValidation) {
          this.programWithRolloutService.tabValidationForProgram.programResources =  (this.programWithRolloutService.programData.resources?.length > 0) ? 'VALID' : 'INVALID'
        }
      }
    )
  );
  if ((this.programWithRolloutService?.programData?.stage == resourceStatus.REVIEW || this.mode === solutionModes.REVIEWER_VIEW || this.mode === solutionModes.REVIEW ) && (this.mode !== solutionModes.VIEWONLY)) {
    this.programWithRolloutService.checkValidationForRequestChanges()
  }
    if(this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) {
      this.programWithRolloutService.formMeta.formValidation.programResources =  (this.programWithRolloutService.programData.resources?.length > 0) ? 'VALID' : 'INVALID'
    }
    this.subscription.unsubscribe();
    this.resources=[]
  }
}
