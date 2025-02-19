import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { ProgramDetailsComponent } from '../components/program-details/program-details.component';
import { ProgramResourcesComponent } from '../components/program-resources/program-resources.component';
import { ResourceLevelTargetingComponent } from '../components/resource-level-targeting/resource-level-targeting.component';
import { ChooseResourceComponent } from '../components/choose-resource/choose-resource.component';
import { ResourceDetailsComponent } from '../components/resource-details/resource-details.component';



const routes: Routes = [
  {
    path:'',
    redirectTo:'roll-out',
    pathMatch:'full',
  },
  {
    path:'choose-resource',
    component:ChooseResourceComponent,
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
        component:ProgramDetailsComponent,
        data:{
          "text": "",
          "page":"1",
          "context":"page",
          "status": "DRAFT",
          "parent_id":0
        }
      },
      {
        path:'program-resources',
        component:ProgramResourcesComponent,
        data:{
          "text": "",
          "page":"2",
          "context":"page",
          "status": "DRAFT",
          "parent_id":0
        }
      },
      {
        path:'resource-level-targeting',
        component:ResourceLevelTargetingComponent,
        data:{
          "text": "",
          "page":"3",
          "context":"page",
          "status": "DRAFT",
          "parent_id":0
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViewModuleRoutingModule { }
