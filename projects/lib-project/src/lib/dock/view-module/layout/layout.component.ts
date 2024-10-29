import { Component } from '@angular/core';
import { LibProjectService } from '../../../lib-project.service';
import { ConfigService, DialogPopupComponent, FormService, PROJECT_DETAILS_PAGE, ReviewModelComponent, SOLUTION_LIST, SUBMITTED_FOR_REVIEW, TASK_DETAILS, ToastService, UtilService,rejectform, LibSharedModulesService , projectMode, PreviewComponent} from 'lib-shared-modules';
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
  tabValidation:any;
  mode:any
  private subscription: Subscription = new Subscription();
  constructor(private libProjectService:LibProjectService,private formService:FormService,private route:ActivatedRoute,private router:Router,private dialog:MatDialog, private utilService:UtilService,private toastService:ToastService,private configuration: ConfigService,private sharedService: LibSharedModulesService) {
    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.mode = params.mode ? params.mode : "edit"
     })
    )
  }
  lastReviewed = ""
  ngOnInit(){
    this.tabValidation={
      projectDetails: "VALID",
      tasks:"VALID",
      subTasks:"VALID",
      certificates:'VALID'
    }
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
      })
    )
    this.utilService.saveComment = true;
  }
  setConfig(){
    this.subscription.add(
    this.libProjectService.setConfig().subscribe((res:any) => {
      this.libProjectService.instanceConfig = res?.result.instance;
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
    this.formService.getFormWithEntities("PROJECT_DETAILS")
    .then((result) => {
      this.subscription.add(
      this.formService.getForm(TASK_DETAILS).subscribe((tasksData) => {
      this.libProjectService.setData( {
        "tasksData":tasksData.result.data.fields.controls,
        "sidenavData": projectData,
        "projectDetails":result.controls,
      });
      this.libProjectService.upDateProjectTitle()
      // this.route.queryParams.subscribe((params: any) => {
      //   if (params.projectId) {
      //       this.libProjectService.readProject(params.projectId).subscribe((res: any) => {
      //           this.libProjectService.projectData = res.result;
      //           this.libProjectService.upDateProjectTitle()
      //         });
      //       }
      // })
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
              width: '20rem',
              autoFocus: false,
              disableClose: false,
              data: {
                projectData: cleanedData,
              },
            });
          }
        );
        break;
      }
      case "SAVE_CHANGES":
      case "SAVE_AS_DRAFT":{
        this.subscription.add(
          this.sharedService.triggerSaveComment()  // Triggers the save comment action from the comment module
        )
        this.libProjectService.saveProjectFunc(true);
        break;
      }
      case "SEND_FOR_REVIEW":{
        this.utilService.saveComment = false
        this.libProjectService.checkSendForReviewValidation(true);
        this.tabValidation = this.libProjectService.formMeta.formValidation;
        break;
      }
      case "START_REVIEW":{
        this.libProjectService.startOrResumeReview()
        break;
      }
      case "EDIT":{
        this.libProjectService.editProject()
        break;
      }
      case "ACCEPT":{
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
      case "REJECT":{
        const dialogRef = this.dialog.open(DialogPopupComponent, {
          width: '39.375rem',
          autoFocus: false,
          disableClose: true,
          data: {
            header: "REJECT_RESOURCES",
            content: "REJECT_RESOURCES_CONTENT",
            cancelButton: "CANCEL",
            reportContent:true,
            form:[rejectform],
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
      case "REQUEST_CHANGES":{
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
      case "COPY_AND_EDIT":{
        this.subscription.add(
          this.libProjectService.copyAndCreateProject().subscribe((res:any)=>{
            this.router.navigate([PROJECT_DETAILS_PAGE], {
              queryParams: {
                projectId: res.result.id,
                mode: projectMode.EDIT,
                parent:"draft"
              },
            });
          })
        )
        break;
      }
      default:
        break;
    }
  }

  navChangeEvent(data:any) {
    console.log(data)
  }

  ngOnDestroy() {
    this.libProjectService.projectData = {}
    this.libProjectService.setFormMetaData();
    this.libProjectService.resetProjectMetaData();
    this.subscription.unsubscribe();
  }

  
}