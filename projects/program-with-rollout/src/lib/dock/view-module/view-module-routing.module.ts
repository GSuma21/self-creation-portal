import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { ResourceDetailsComponent } from '../components/resource-details/resource-details.component'
import { ProgramDetailsComponent } from '../components/program-details/program-details.component';


const routes: Routes = [
  {
    path:'',
    redirectTo:'roll-out',
    pathMatch:'full',
  },
  {
    path:'details',
    component:LayoutComponent,
    children:[
      {
        path:'project-details',
        component:ResourceDetailsComponent
      },
      {
        path:'program-details',
        component:ProgramDetailsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViewModuleRoutingModule { }
