import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DialogPopupComponent, FormService, HeaderComponent, LibSharedModulesService, SIDE_NAV_DATA, SideNavbarComponent } from 'lib-shared-modules';
import { CommonModule } from '@angular/common';
import { environment } from 'environments';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [CommonModule,HeaderComponent,SideNavbarComponent, MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, MatCardModule, RouterModule],
  templateUrl: './app-main-view.component.html',
  styleUrl: './app-main-view.component.scss'
})
export class AppMainViewComponent {

  backButton : boolean = false;
  headerData : any = {
    title:"WORKSPACE"
  };
  titleObj = {
    "title" : "CREATION_PORTAL"
  }

  sidenavData: any = [];
  clearQueryParamsOnNavigate: boolean = true;
  constructor(private formService:FormService, private router: Router, private route: ActivatedRoute, private dialog : MatDialog, private sharedService:LibSharedModulesService) {
  }

  ngOnInit(){
    this.getnavData();
    if(environment.parentURL.length > 0) {
      this.backButton = true;
    }
  }

  onButtonClick(buttonTitle: string) {
    switch(buttonTitle){
      case 'LOGOUT': {
        const dialogRef = this.dialog.open(DialogPopupComponent, {
          width: '39.375rem',
          disableClose: true,
          autoFocus : false,
          data: {
            header: 'LOGOUT',
            content: 'LOGOUT_CONFIRMATION_TEXT',
            cancelButton: "CANCEL",
            exitButton: "LOGOUT"
          },
        });
     
         dialogRef.afterClosed().subscribe((result) => {
            if(result.data === 'LOGOUT'){
              this.sharedService.logout();
            }
         });
      }  
    }  
  }

  backToParent(event:boolean) {
    window.open(environment.parentURL,"_self")
  }

  getnavData(){
     this.formService.getForm(SIDE_NAV_DATA).subscribe((form) =>{
      // let userRoles:any = localStorage.getItem('user_roles')
      // userRoles = JSON.parse(userRoles);
      this.getPermissions(form?.result?.data?.fields?.controls);
    })
  }

  getPermissions(navData:any) {
    this.formService.getPermissions().subscribe((res:any) => {
      navData.forEach((element:any) => {
        element.permission_modules.forEach((permission:any) => {
          res.result.forEach((permissionMenuItem:any) => {
            if(JSON.stringify(permissionMenuItem) == JSON.stringify(permission)) {
              this.sidenavData.push(element)
            }
          })
        })
      })
      this.sidenavData = this.sidenavData.filter((o:any, index:number, arr:any) =>
          arr.findIndex((item:any) => JSON.stringify(item) === JSON.stringify(o)) === index
      );
      // this.sidenavData = navData.filter((element:any) =>{
      //   if(res.result.find((item:any) => JSON.stringify(item) == JSON.stringify(element.permission_modules[0]) || JSON.stringify(item) == JSON.stringify(element.permission_modules[1]))) {
      //     return element;
      //   }
      // })
    })
  }

  onSideNavNavigate(item: any): void {
    if (this.clearQueryParamsOnNavigate) {
      this.clearQueryParams();
    }
    this.router.navigate([item.url], { relativeTo: this.route });
  }

  clearQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }
}
