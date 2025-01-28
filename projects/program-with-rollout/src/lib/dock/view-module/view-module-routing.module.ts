import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { ResourceDetailsComponent } from '../components/resource-details/resource-details.component'
import { ProgramDetailsComponent } from '../components/program-details/program-details.component';
import { ProgramResourcesComponent } from '../components/program-resources/program-resources.component';
import { ResourceLevelTargetingComponent } from '../components/resource-level-targeting/resource-level-targeting.component';
import { ChoosingResourceComponent } from '../components/choosing-resource/choosing-resource.component';


const routes: Routes = [
  {
    path:'',
    redirectTo:'roll-out',
    pathMatch:'full',
  },
  {
    path:'choose-resource',
    component:ChoosingResourceComponent,
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
      },
      {
        path:'program-resources',
        component:ProgramResourcesComponent
      },
      {
        path:'resource-level-targeting',
        component:ResourceLevelTargetingComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViewModuleRoutingModule { }
