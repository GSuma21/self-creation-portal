import { Component } from '@angular/core';
import { FormService, PreviewComponent, ROLL_OUT, SOLUTION_LIST, ToastService, UtilService } from 'lib-shared-modules';
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
  constructor(private formService:FormService,  private programWithRolloutService:ProgramWithRolloutService, private utilService:UtilService,private dialog:MatDialog, private router:Router, private route:ActivatedRoute,private toastService:ToastService,){}
  ngOnInit(){
    this.getData()
    this.subscription.add(
      this.programWithRolloutService.currentRolloutData.subscribe(data => {
        this.headerData = data?.sidenavData.headerData
        this.sidenavData= data?.sidenavData.sidenav
        this.headerData.title =  this.headerData.title ?  this.headerData.title : "PROGRAM_NAME"
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
      this.programWithRolloutService.resourceStatus.subscribe(data => {
         this.mode = data.status ? data.status : "PENDING"
      })
    }))
  }

  setConfig(){
    this.subscription.add(
    this.programWithRolloutService.setConfig().subscribe((res:any) => {
      this.programWithRolloutService.instanceConfig = res?.result.instance;
    })
    )
  }

  onButtonClick(buttonTitle: string) {
    switch (buttonTitle) {
      case 'PREVIEW': {
        this.utilService.removeEmptyKey(this.programWithRolloutService.resourceDetails).subscribe(
          (cleanedData) => {
            const dialogRef = this.dialog.open(PreviewComponent, {
              width: '23rem',
              autoFocus: false,
              disableClose: false,
              data: {
                projectData: cleanedData,
                cssClass:'max-h-[31.25rem] min-h-[31.25rem]',
              },
            });
          }
        );
        break;
      }
      case 'SAVE': {
        if (this.saveRolloutData) {
          this.saveRolloutData = false;
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
          );
        }
        break;
      }
      case 'ROLL_OUT_CHANGES':
      case 'ROLL_OUT': {
        this.utilService.confirmAndActionResources( "ROLL_OUT_RESOURCE","CONFIRM_MESSAGE_ROLLOUT","CANCEL","ROLL_OUT").subscribe((result) => {
          if(result){
            this.programWithRolloutService.checkIsRolledOutValid(true);
            this.programWithRolloutService.saveRollOut().subscribe((res:any)=> {
              if(res){
                if(!this.programWithRolloutService.rolloutId){
                  this.programWithRolloutService.rolloutId = res.result.id;
                  this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: {
                      rolloutId: res.result.id ? res.result.id : res.result
                    },
                    queryParamsHandling: 'merge',
                    replaceUrl:true
                  });
                }
                if( this.programWithRolloutService.rolloutId && this.programWithRolloutService.tabValidation.rolloutDetails === 'VALID'){
                   this.programWithRolloutService.publishRollout().subscribe((res:any)=>{
                  if(res.responseCode === "OK"){
                    this.router.navigate([ROLL_OUT]);
                    this.toastService.openSnackBar({ message: 'YOUR_CHANGES_HAVE_BEEN_PUBLISHED',  class: 'success',});
                    this.programWithRolloutService.rolloutId = ""
                  }else{
                    this.toastService.openSnackBar({ message: 'Fill all the mandatory fields.', class: 'error', });
                  }
                },
                (err) => {
                  this.programWithRolloutService.validateAndHighlightErrors(err)
                })
                }else{
                  this.toastService.openSnackBar({ message: 'Fill all the mandatory fields.', class: 'error', });
                }
              }
            })
          }
        })
        break;
      }
      case "SAVE_AS_DRAFT":{
        // this.subscription.add(
        //   this.sharedService.triggerSaveComment()  // Triggers the save comment action from the comment module
        // )
        this.programWithRolloutService.saveProgramFunc(true);
        break;
      }
      default:
        break;
    }
  }

  ngOnDestroy() {
    this.programWithRolloutService.programData = {}
    this.programWithRolloutService.resetProgramMetaData();
    this.subscription.unsubscribe();
  }
}