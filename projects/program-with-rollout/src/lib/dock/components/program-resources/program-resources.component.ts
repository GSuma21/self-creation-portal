import { Component } from '@angular/core';
import { ArrayContainsAllDirective, FormService, SOLUTION_LIST } from 'lib-shared-modules';
import { TranslateModule } from '@ngx-translate/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

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

constructor(private formService: FormService, private router:Router,){}

ngOnInit(){
  this.getsolutionList()
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
    this.router.navigate(['roll-out/choose-resource'],{queryParams:{parent:"roll-out"}})
  }
}
