import { Component } from '@angular/core';
import { FormService, SOLUTION_LIST } from 'lib-shared-modules';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  private subscription: Subscription = new Subscription();
  headerData:any;
  sidenavData:any;
  constructor(private formService:FormService,  private programWithRolloutService:ProgramWithRolloutService){}
  ngOnInit(){
    this.getData()
    this.subscription.add(
      this.programWithRolloutService.currentRolloutData.subscribe(data => {
        this.headerData = data?.sidenavData.headerData
        this.sidenavData= data?.sidenavData.sidenav
      })
    )
  }


  getData(){
    this.subscription.add(
    this.formService.getForm(SOLUTION_LIST).subscribe((form) =>{
      this.programWithRolloutService.setData( {
        "sidenavData": form?.result?.data?.fields?.controls.find((item:any)=> item.title ===  "ROLL_OUT")
      });  
    }))
  }
}
