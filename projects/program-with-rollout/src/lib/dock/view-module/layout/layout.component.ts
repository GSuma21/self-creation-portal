import { Component } from '@angular/core';
import { ConfigService, DialogPopupComponent, FormService, LibSharedModulesService, PreviewComponent, ROLL_OUT, SIDE_NAV_DATA, SOLUTION_LIST, ToastService, UtilService } from 'lib-shared-modules';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'lib-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  private subscription: Subscription = new Subscription();
  headerData:any = {};
  mode:any;
  sidenavData:any;
  saveRolloutData:boolean = true;
  constructor(private formService:FormService,  public programWithRolloutService:ProgramWithRolloutService, private utilService:UtilService,private dialog:MatDialog, private router:Router, private route:ActivatedRoute,private toastService:ToastService,private configuration: ConfigService, private sharedService: LibSharedModulesService){}
  ngOnInit(){
    this.getData()
    this.subscription.add(
      this.programWithRolloutService.currentRolloutData.subscribe(data => {
        this.sidenavData= data?.sidenavData.sidenav
        this.headerData = data?.sidenavData.headerData
      })
    )
    this.setConfig();
  }


  getData(){
    this.subscription.add(
    this.formService.getForm(SOLUTION_LIST).subscribe((form) =>{
      this.programWithRolloutService.setRolloutData( {
        "sidenavData": this.router.url.includes('project-details') ? form?.result?.data?.fields?.controls.find((item:any)=> item.title ===  "ROLL_OUT") : form?.result?.data?.fields?.controls.find((item:any)=> item.title ===  "PROGRAM")
      });
      this.programWithRolloutService.upDateProgramTitle();
      if(this.router.url.includes('project-details')){
        this.programWithRolloutService.resourceStatus.subscribe(data => {
          this.mode = data?.status ? data.status : "PENDING"
       })
      }else{
        this.subscription.add(
          this.route.queryParams.subscribe((params: any) => {
            this.mode = params.mode ? params.mode : ""
          })
        )
      }
    })
  )
  }

  setConfig(){
    this.subscription.add(
    this.programWithRolloutService.setConfig().subscribe((res:any) => {
      this.programWithRolloutService.instanceConfig = res?.result.instance;
      this.programWithRolloutService.programConfig = res.result.resource.find((res:any) => res.resource_type === this.configuration.permissionCoFig.PROGRAMS);
    })
    )
  }

  onButtonClick(buttonTitle: string) {
    switch (buttonTitle) {
      case 'PREVIEW': {

        break;
      }
      case 'SAVE': {
        if (this.saveRolloutData) {
          this.saveRolloutData = false;
          this.subscription.add(
            this.programWithRolloutService.saveRollOut().subscribe(
              (res: any) => {
                if (!this.programWithRolloutService.rolloutId) {
                  this.programWithRolloutService.rolloutId = res.result.id;
                }
                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: {
                    rolloutId: res.result.id ? res.result.id : res.result,
                  },
                  queryParamsHandling: 'merge',
                  replaceUrl: true,
                });
                let data = {
                  message: 'SAVED_SUCCESSFULLY',
                  class: 'success',
                };
                this.saveRolloutData = true;
                this.toastService.openSnackBar(data);
              },
              (err: any) => {
                this.saveRolloutData = true;
              }
            )
          )
        }
        break;
      }
      case 'ROLL_OUT_CHANGES':
      case 'ROLL_OUT': {
        this.utilService.confirmAndActionResources("ROLL_OUT_RESOURCE", "CONFIRM_MESSAGE_ROLLOUT", "CANCEL", "ROLL_OUT").subscribe((result) => {
          if (result) {
            this.programWithRolloutService.checkIsRolledOutValid(true);
            this.subscription.add(
              this.programWithRolloutService.saveRollOut().subscribe((res: any) => {
                if (res) {
                  if (!this.programWithRolloutService.rolloutId) {
                    this.programWithRolloutService.rolloutId = res.result.id;
                    this.router.navigate([], {
                      relativeTo: this.route,
                      queryParams: {
                        rolloutId: res.result.id ? res.result.id : res.result
                      },
                      queryParamsHandling: 'merge',
                      replaceUrl: true
                    });
                  }
                  if (this.programWithRolloutService.rolloutId && this.programWithRolloutService.tabValidation.rolloutDetails === 'VALID') {
                    this.programWithRolloutService.publishRollout().subscribe((res: any) => {
                      if (res.responseCode === "OK") {
                        this.router.navigate([ROLL_OUT]);
                        this.toastService.openSnackBar({ message: 'YOUR_CHANGES_HAVE_BEEN_PUBLISHED', class: 'success', });
                        this.programWithRolloutService.rolloutId = ""
                      } else {
                        this.toastService.openSnackBar({ message: 'Fill all the mandatory fields.', class: 'error', });
                      }
                    },
                      (err) => {
                        this.programWithRolloutService.validateAndHighlightErrors(err)
                      })
                  } else {
                    this.toastService.openSnackBar({ message: 'Fill all the mandatory fields.', class: 'error', });
                  }
                }
              })
            )
          }
        })
        break;
      }
      case "SAVE_AS_DRAFT": {
        // this.subscription.add(
        //   this.sharedService.triggerSaveComment()  // Triggers the save comment action from the comment module
        // )
        this.programWithRolloutService.saveProgramFunc(true);
        break;
      }
      case "SEND_FOR_REVIEW": {
        this.programWithRolloutService.checkProgramSendForReviewValidation(true);
        this.programWithRolloutService.tabValidationForProgram = this.programWithRolloutService.formMeta.formValidation;
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
          }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result.data === 'LOGOUT') {
            this.utilService.saveResources = false;
            if (this.router.url.includes('details/project-details')) {
              this.programWithRolloutService.saveRollOut().subscribe((res) => {
                this.sharedService.logout();
              })
            } else {
              this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData, this.programWithRolloutService.programData.id).subscribe((res: any) => {
                this.sharedService.logout();
              })
            }
          }
        });
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
            this.programWithRolloutService.approveProject()
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
            this.programWithRolloutService.sendForRequestChange() // Sends request change after comment save is completed
          })
        )
        break;
      }
      default:
        break;
    }
  }

  ngOnDestroy() {
    this.programWithRolloutService.resetProgramMetaData();
    this.subscription.unsubscribe();
    this.programWithRolloutService.tabValidationForProgram = {
      programDetails: "VALID",
      resources:"VALID",
      resourceLevelTargeting:"VALID",
    }
    this.programWithRolloutService.setValidationForProgram()
    this.programWithRolloutService.programData = {}
  }
}
