import { Component } from '@angular/core';
import { ArrayContainsAllDirective, FormService, modes, SOLUTION_LIST } from 'lib-shared-modules';
import { TranslateModule } from '@ngx-translate/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-program-resources',
  standalone: true,
  imports: [ MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, MatCardModule,TranslateModule,ArrayContainsAllDirective],
  templateUrl: './program-resources.component.html',
  styleUrl: './program-resources.component.scss'
})
export class ProgramResourcesComponent {
  resourceList:any
  resource_count:any = 1;
  permissions:any;
  parent:any;
  resourceIds:any=[]
  programId:any;
  private subscription: Subscription = new Subscription();

constructor(private formService: FormService, private router:Router,private route: ActivatedRoute,private programWithRolloutService:ProgramWithRolloutService){
  this.parent = this.route.snapshot.queryParamMap.get('parent');
  this.route.queryParamMap.subscribe((params) => {
    this.resourceIds = params.getAll('resourceIds'); // Get multiple values
    this.programId =  this.route.snapshot.queryParamMap.get('programId');
    console.log(this.resourceIds); // Output: ['1023', '1022', '1021']
  });
}

ngOnInit(){
  this.getsolutionList()
  if(this.resourceIds.length){
    this.programWithRolloutService.addResourceToProgram({"resource_ids": this.resourceIds},1028).subscribe((res:any) => {
      
    })
  }

  this.subscription.add(
    this.programWithRolloutService.isProgramSave.subscribe(
      (isProjectSave: boolean) => {
        if (isProjectSave) {
          this.submit();
        }
      }
    )
  );
}

submit() {
  if(!this.programId){
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
                this.programWithRolloutService.programData.id = res.result.id;})

  }else{
  
  }
 
  // this.programWithRolloutService.updateProgramDraft(this.programId).subscribe();
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
      // this.resourceList = this.formService.checkPermissions(this.resourceList,res.result)
      // let userRoles:any = localStorage.getItem('user_roles')
      // userRoles = JSON.parse(userRoles)
      // if(!userRoles.find((item:any)=> item.title == 'content_creator')) {
      //   this.router.navigate(['/home/up-for-review'])
      // }
    })
  })
}


  onCardClick(cardItem: any) {
    this.router.navigate(['roll-out/choose-resource'],{queryParams:{parent: this.parent, selectFor:'programs'}})
  }
}
