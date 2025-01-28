import { Component } from '@angular/core';
import { FormService, SOLUTION_LIST } from 'lib-shared-modules';
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
  imports: [ MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, MatCardModule,TranslateModule,],
  templateUrl: './program-resources.component.html',
  styleUrl: './program-resources.component.scss'
})
export class ProgramResourcesComponent {
  resourceList:any
  resource_count:any = 1;

constructor(private formService: FormService, private router:Router,){}

ngOnInit(){
  this.getsolutionList()
}


getsolutionList() {
    this.formService.getPermissions().subscribe((res:any) => {
      this.formService.getForm(SOLUTION_LIST).subscribe((form:any) =>{
        this.resourceList = form?.result?.data?.fields?.controls
        this.resourceList = this.formService.checkPermissions(this.resourceList,res.result)
        let userRoles:any = localStorage.getItem('user_roles')
        userRoles = JSON.parse(userRoles)
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
