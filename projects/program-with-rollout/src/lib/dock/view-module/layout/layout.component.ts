import { Component } from '@angular/core';
import { FormService, PreviewComponent, SOLUTION_LIST, ToastService, UtilService } from 'lib-shared-modules';
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
  headerData:any;
  sidenavData:any;
  constructor(private formService:FormService,  private programWithRolloutService:ProgramWithRolloutService, private utilService:UtilService,private dialog:MatDialog, private router:Router, private route:ActivatedRoute,private toastService:ToastService,){}
  ngOnInit(){
    this.getData()
    this.subscription.add(
      this.programWithRolloutService.currentRolloutData.subscribe(data => {
        this.headerData = data?.sidenavData.headerData
        this.sidenavData= data?.sidenavData.sidenav
      })
    )
    this.setConfig();
  }


  getData(){
    this.subscription.add(
    this.formService.getForm(SOLUTION_LIST).subscribe((form) =>{
      this.programWithRolloutService.setRolloutData( {
        "sidenavData": form?.result?.data?.fields?.controls.find((item:any)=> item.title ===  "ROLL_OUT")
      });
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
              },
            });
          }
        );
        break;
      }
      case 'SAVE': {
        this.programWithRolloutService.saveRollOut().subscribe((res:any)=> {
          this.programWithRolloutService.rolloutId = res.result.id;
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              rolloutId: res.result.id ? res.result.id : res.result
            },
            queryParamsHandling: 'merge',
            replaceUrl:true
          });
          let data = {
            message: 'SAVED_SUCCESSFULLY',
            class: 'success',
          };
          this.toastService.openSnackBar(data);
        })
        break;
      }
      default:
        break;
    }
  }
}
