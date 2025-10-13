import { Component } from '@angular/core';
import { LibProjectService } from '../../../lib-project.service';
import { ConfigService, DialogPopupComponent, FormService, PROJECT_DETAILS_PAGE, SOLUTION_LIST, TASK_DETAILS, ToastService, UtilService,rejectform, LibSharedModulesService , PreviewComponent, PROJECT_DETAILS, solutionModes} from 'lib-shared-modules';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs/internal/Subscription';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'lib-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  backButton : boolean = true;
  subHeader : any;
  selctedCardItem : any;
  headerData:any
  sidenavData:any;
  mode:any
  parent:any
  programId:string|number = ''
  private subscription: Subscription = new Subscription();
  constructor(public libProjectService:LibProjectService,private formService:FormService,private route:ActivatedRoute,private router:Router,private dialog:MatDialog, private utilService:UtilService,private toastService:ToastService,private configuration: ConfigService,private sharedService: LibSharedModulesService) {
    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.mode = params.mode ? params.mode : "edit",
        this.parent = params.parent ? params.parent : "draft"
        this.programId = params.programId;
     })
    )
  }
  lastReviewed = ""
  ngOnInit(){
    this.setConfig()
    this.getProjectdata()
    this.subscription.add(
      this.libProjectService.currentProjectMetaData.subscribe(data => {
        this.sidenavData= data?.sidenavData.sidenav
        // data?.sidenavData.headerData.buttons.forEach((element:any) => {
        //   if(element.title == "SEND_FOR_REVIEW"){
        //     element.disable = false;
        //   }
        // });
        this.lastReviewed = (this.mode === 'review' || this.mode === 'reviewerView' ) ? this.libProjectService.projectData.last_reviewed_on: "";
        this.headerData = data?.sidenavData.headerData
        if(this.programId && (this.mode === 'metaReview' || this.mode === 'reviewerView' )) {
          this.libProjectService.readProgram(this.programId).subscribe((res:any) => {
            this.lastReviewed = res.result.last_reviewed_on;
          })
          this.headerData.buttons.reviewerView.splice(1);
        }
        if(this.programId && this.mode === 'creatorView' ) {
          this.headerData.buttons.creatorView.splice(1);
        }
      })
    )
    this.utilService.saveComment = true;
  }
  setConfig(){
    this.subscription.add(
    this.libProjectService.setConfig().subscribe((res:any) => {
      this.libProjectService.instanceConfig = res?.result.instance;
      this.libProjectService.targetingConfig = res?.result.config?.targeting_criteria ? res?.result.config?.targeting_criteria : {};
      this.libProjectService.projectConfig = res.result.resource.find((res:any) => res.resource_type === this.configuration.permissionCoFig.PROJECTS);
    })
    )
  }

  getProjectdata() {
    let projectData:any;
    this.subscription.add(
    this.formService.getForm(SOLUTION_LIST).subscribe((form) =>{
      projectData = form?.result?.data?.fields?.controls.find((item:any)=> item.title ===  "PROJECT")
    })
  )
    this.formService.getFormWithEntities(PROJECT_DETAILS)
    .then((result) => {
      this.subscription.add(
      this.formService.getForm(TASK_DETAILS).subscribe((tasksData) => {
      this.libProjectService.setData( {
        "tasksData":tasksData.result.data.fields.controls,
        "sidenavData": projectData,
        "projectDetails":result.controls,
      });
      this.libProjectService.upDateProjectTitle()
    })
   )
    })
    .catch((error) => {
      console.error(error);
    });
  }

  onButtonClick(buttonTitle: string) {
    switch (buttonTitle) {
      case 'PREVIEW': {
        this.utilService.removeEmptyKey(this.libProjectService.projectData).subscribe(
          (cleanedData) => {
            const dialogRef = this.dialog.open(PreviewComponent, {
              width: '23rem',
              autoFocus: false,
              disableClose: false,
              data: {
                projectData: cleanedData,
                cssClass: 'max-h-[31.25rem] min-h-[31.25rem]',
              },
            });
          }
        );
        break;
      }
      case "SAVE_CHANGES":
      case "SAVE_AS_DRAFT": {
        if (this.mode === solutionModes.META_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT) {
          this.libProjectService.saveProgramResourceFunc(true)
          break;
        } else {
          this.subscription.add(
            this.sharedService.triggerSaveComment()  // Triggers the save comment action from the comment module
          )
          this.libProjectService.saveProjectFunc(true);
          break;
        }
      }
      case "SEND_FOR_REVIEW": {
        this.utilService.saveComment = false
        this.libProjectService.checkSendForReviewValidation(true);
        this.libProjectService.tabValidation = this.libProjectService.formMeta.formValidation;
        break;
      }
      case "START_REVIEW": {
        this.libProjectService.startOrResumeReview()
        break;
      }
      case "EDIT": {
        this.libProjectService.editProject()
        break;
      }
      case "ACCEPT": {
        const dialogRef = this.dialog.open(DialogPopupComponent, {
          width: '39.375rem',
          autoFocus: false,
          disableClose: true,
          data: {
            header: "ACCEPT_RESOURCE",
            content: "ACCEPT_RESOURCE_CONTENT",
            cancelButton: "CANCEL",
            exitButton: "ACCEPT"
          }
        });
        dialogRef.afterClosed().toPromise().then(result => {
          if (result.data === "CANCEL") {
            return true;
          } else if (result.data === "ACCEPT") {
            this.utilService.saveComment = false
            this.libProjectService.approveProject()
            return true;
          } else {
            return false;
          }
        });
        break;
      }
      case "REJECT": {
        const dialogRef = this.dialog.open(DialogPopupComponent, {
          width: '39.375rem',
          autoFocus: false,
          disableClose: true,
          data: {
            header: "REJECT_RESOURCES",
            content: "REJECT_RESOURCES_CONTENT",
            cancelButton: "CANCEL",
            reportContent: true,
            form: [rejectform],
            exitButton: "REJECT"
          }
        });

        dialogRef.afterClosed().toPromise().then(result => {
          if (result.data === "CANCEL") {
            return true;
          } else if (result.data === "REJECT") {
            this.utilService.saveComment = false
            this.libProjectService.rejectProject(result?.title, result?.isReported)
            return true;
          } else {
            return false;
          }
        });
        break;
      }
      case "REQUEST_CHANGES": {
        this.utilService.saveComment = false
        this.subscription.add(
          this.sharedService.triggerSaveComment() //// Triggers the save comment action from the comment module
        )
        /**
        * Once the save comment operation is completed, the `sendForRequestChange()` method from
        * `libProjectService` is called to send the request for change. This ensures that further actions
        * are triggered only after the save comment operation is fully done.
        */
        this.subscription.add(
          this.sharedService.getSaveCommentCompletedObservable().subscribe(() => {
            this.libProjectService.sendForRequestChange() // Sends request change after comment save is completed
          })
        )
        break;
      }
      case "COPY_AND_EDIT": {
        this.subscription.add(
          this.libProjectService.copyAndCreateProject().subscribe((res: any) => {
            this.router.navigate([PROJECT_DETAILS_PAGE], {
              queryParams: {
                projectId: res.result.id,
                mode: solutionModes.EDIT,
                parent: "draft"
              },
            });
          })
        )
        break;
      }
      case "LOGOUT": {
        const dialogRef = this.dialog.open(DialogPopupComponent, {
          width: '39.375rem',
          disableClose: true,
          autoFocus: false,
          data: {
            header: 'LOGOUT',
            content: 'LOGOUT_CONFIRMATION_TEXT',
            cancelButton: "CANCEL",
            exitButton: "LOGOUT"
          },
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result.data === 'LOGOUT') {
            this.utilService.saveComment = false;
            this.utilService.saveResources = false;
            if(this.mode === solutionModes.EDIT ||this.mode === solutionModes.REQUEST_FOR_EDIT ){
              this.libProjectService.createOrUpdateProject(this.libProjectService.projectData, this.libProjectService.projectData.id).subscribe((res) => {
                this.sharedService.logout();
              })
            }else{
              this.sharedService.logout();
            }
          }
        });
        break;
      }
      default:
        break;
    }
  }

  navChangeEvent(data:any) {
  }

  ngOnDestroy() {
    this.libProjectService.programData = {}
    this.libProjectService.projectData = {}
    this.libProjectService.resetProjectMetaData();
    this.subscription.unsubscribe();
    this.libProjectService.tabValidation = {
      projectDetails: "VALID",
      tasks:"VALID",
      subTasks:"VALID",
      certificates:'VALID'
    }
    this.libProjectService.reviewErrors = [];
    this.libProjectService.setFormMetaData();
  }

  backToParent() {
    if (this.utilService.saveResources && this.mode != solutionModes.META_REVIEW) {
      if (this.mode === solutionModes.META_EDIT || this.mode === solutionModes.META_REQUEST_FOR_EDIT) {
        this.libProjectService.programData.resources = this.libProjectService.programData.resources.map((resource: any) =>
          resource.id === this.libProjectService.projectData.id ? { ...this.libProjectService.projectData } : resource
        );
        this.libProjectService.updateProgramData(this.libProjectService.programData).subscribe((res: any) => {
          this.sharedService.goBack()
        })
      }
      else if (this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT) {
        if (this.libProjectService.projectData.id) {
          this.libProjectService.createOrUpdateProject(this.libProjectService.projectData, this.libProjectService.projectData.id).subscribe((res) => {
            this.sharedService.goBack()
          })
        }else{
          this.sharedService.goBack()
        }
      }else{
        this.sharedService.goBack()
      }
    } else {
      this.sharedService.goBack()
    }
  }

}