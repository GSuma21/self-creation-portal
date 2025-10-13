import { Component } from '@angular/core';
import { ConfigService, DialogPopupComponent, FormService, LibSharedModulesService, PreviewComponent, PROGRAM_DETAILS_PAGE, ROLL_OUT, SIDE_NAV_DATA, SOLUTION_LIST, solutionModes, SUBMITTED_FOR_REVIEW, ToastService, UtilService } from 'lib-shared-modules';
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
  config:any
  constructor(private formService:FormService,  public programWithRolloutService:ProgramWithRolloutService, private utilService:UtilService,private dialog:MatDialog, private router:Router, private route:ActivatedRoute,private toastService:ToastService,private configuration: ConfigService, private sharedService: LibSharedModulesService){
    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.mode = params.mode ? params.mode : "edit"
     })
    )
  }
  ngOnInit(){
    this.getData()
    this.setConfig();
    this.subscription.add(
      this.programWithRolloutService.currentRolloutData.subscribe((data:any) => {
        this.sidenavData= data?.sidenavData.sidenav
        this.headerData = data?.sidenavData.headerData
        this.config = this.programWithRolloutService.programConfig
      })
    )
    this.utilService.saveComment = true;
  }

  getLastReviewedDate() {
    return (this.mode === 'review' || this.mode === 'reviewerView' ) ? this.programWithRolloutService.programData.last_reviewed_on: "";
  }


  getData(){
    this.subscription.add(
    this.formService.getForm(SOLUTION_LIST).subscribe((form) =>{
      this.programWithRolloutService.setRolloutData( {
        "sidenavData": this.router.url.includes('project-details') ? form?.result?.data?.fields?.controls.find((item:any)=> item.title ===  "ROLL_OUT") : form?.result?.data?.fields?.controls.find((item:any)=> item.title ===  "PROGRAM")
      });
      this.programWithRolloutService.upDateProgramTitle();
      if(this.router.url.includes('project-details')){
        this.programWithRolloutService.resourceStatus.subscribe((data:any) => {
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
      this.config = res.result.resource.find((res:any) => res.resource_type === this.configuration.permissionCoFig.PROGRAMS);
      this.programWithRolloutService.instanceConfig = res?.result.instance;
      this.programWithRolloutService.targetingConfig = res?.result.config?.targeting_criteria ? res?.result.config?.targeting_criteria : {};
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
                      (err:any) => {
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
      case "SAVE_CHANGES":
      case "SAVE_AS_DRAFT": {
        // this.subscription.add(
        //   this.sharedService.triggerSaveComment()  // Triggers the save comment action from the comment module
        // )
        this.programWithRolloutService.saveProgramFunc(true);
        break;
      }
      case "PUBLISH":
      case "SEND_FOR_REVIEW": {
        this.utilService.saveComment = false;
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
            this.utilService.saveComment = false;
            this.utilService.saveResources = false;
            if (this.router.url.includes('details/project-details')) {
              this.programWithRolloutService.saveRollOut().subscribe((res:any) => {
                this.sharedService.logout();
              })
            } else {
              if(this.mode === solutionModes.EDIT ||this.mode === solutionModes.REQUEST_FOR_EDIT ){
                this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData, this.programWithRolloutService.programData.id).subscribe((res: any) => {
                  this.sharedService.logout();
                })
              }else{
                this.sharedService.logout();
              }
            }
          }
        });
        break;
      }
      case "ACCEPT": {
        if(new Date(this.programWithRolloutService.programData.end_date) > new Date()){
          const dialogRef = this.dialog.open(DialogPopupComponent, {
            width: '39.375rem',
            autoFocus: false,
            disableClose: true,
            data: {
              header: "ACCEPT_PROGRAM",
              content: "ACCEPT_PROGRAM_CONTENT",
              cancelButton: "CANCEL",
              exitButton: "ACCEPT"
            }
          });
          dialogRef.afterClosed().toPromise().then(result => {
            if (result.data === "CANCEL") {
              return true;
            } else if (result.data === "ACCEPT") {
              delete this.programWithRolloutService.programData.metaData.publishedStartDate
              this.utilService.saveComment = false
              this.programWithRolloutService.approveProject()
              return true;
            } else {
              return false;
            }
          });
        }else{
          this.toastService.openSnackBar({ message: 'END_DATE_SHOULD_BE_GREATER_THAN_CURRENCT_DATE', class: 'error', });
        }
        break;
      }
      case "COPY_AND_EDIT": {
        this.subscription.add(
          this.programWithRolloutService.copyAndCreateProgram().subscribe((res: any) => {
            this.router.navigate([PROGRAM_DETAILS_PAGE], {
              queryParams: {
                programId: res.result.id,
                mode: solutionModes.EDIT,
                parent: "draft"
              },
            });
            this.subscription.add(
              this.programWithRolloutService
                .readProgram(res.result.id)
                .subscribe((res: any) => {
                  this.programWithRolloutService.setProgramData(res.result);
                  location.reload();
                })
            );
          })
        )
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
      case 'START_REVIEW':
        this.utilService.startOrResumeReview(this.programWithRolloutService.programData.id).subscribe((data) => {
          this.router.navigate([PROGRAM_DETAILS_PAGE], {
            queryParams: {
              programId: this.programWithRolloutService.programData.id,
              mode: solutionModes.REVIEW,
              parent: "up-for-review"
            }
          });
        })
        break;
      case 'EDIT':
        this.router.navigate(['roll-out/details/program-details'], {
          queryParams: {
            parent: 'review',
            programId: this.programWithRolloutService.programData.id,
            mode: solutionModes.REQUEST_FOR_EDIT,
          },
        });
        break;
      case "PUBLISH_CHANGES":
        this.programWithRolloutService.checkProgramPublishalidation(true);
        this.programWithRolloutService.tabValidationForProgram = this.programWithRolloutService.formMeta.formValidation;
        break;
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


  backToParent() {
    if (this.programWithRolloutService.programData.id && this.utilService.saveResources && (this.mode === solutionModes.EDIT || this.mode === solutionModes.REQUEST_FOR_EDIT || this.mode === solutionModes.RESOURCE_EDIT)) {
      this.programWithRolloutService.createOrUpdateProgram(this.programWithRolloutService.programData, this.programWithRolloutService.programData.id).subscribe((res: any) => {
        this.sharedService.goBack()
      })
    }else if(this.programWithRolloutService.rolloutId && this.utilService.saveResources){
      this.programWithRolloutService.rollOutDetails.title = this.programWithRolloutService.rollOutDetails.title ? this.programWithRolloutService.rollOutDetails.title : this.programWithRolloutService.resourceDetails.title;
      this.programWithRolloutService.saveRollOut().subscribe((res:any)=> {
        this.sharedService.goBack()
      })
    }
    else{
      this.sharedService.goBack()
    }
  }
}