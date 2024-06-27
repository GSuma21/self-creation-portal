import { Component } from '@angular/core';
import { LibProjectService } from '../../../lib-project.service';
import { FormService, SOLUTION_LIST, TASK_DETAILS } from 'lib-shared-modules';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  backButton : boolean = true;
  subHeader : any;
  selctedCardItem : any;
  headerData:any
  sidenavData:any
  private projectDataSubscription: Subscription | undefined;
  constructor(private libProjectService:LibProjectService,private formService:FormService,private route:ActivatedRoute) {
  }
  ngOnInit(){
    this.getProjectdata()
    this.libProjectService.currentProjectData.subscribe(data => {
      this.sidenavData= data?.sidenavData.sidenav
      this.headerData = data?.sidenavData.headerData
    });
  }

  getProjectdata() {
    let projectData:any;
    this.formService.getForm(SOLUTION_LIST).subscribe((form) =>{
      projectData = form?.result?.data?.fields?.controls.find((item:any)=> item.title ===  "PROJECT")
    })
    this.formService.getFormWithEntities("PROJECT_DETAILS")
    .then((result) => {
      this.formService.getForm(TASK_DETAILS).subscribe((tasksData) => {
      this.libProjectService.setData( {
        "tasksData":tasksData.result.data.fields.controls,
        "sidenavData": projectData,
        "projectDetails":result.controls,
      });
      // this.libProjectService.upDateProjectTitle()
      this.projectDataSubscription =  this.route.queryParams.subscribe((params: any) => {
        if (params.projectId) {
            this.libProjectService.readProject(params.projectId).subscribe((res: any) => {
                this.libProjectService.projectData = res.result;
                this.libProjectService.upDateProjectTitle()
              });
            }
      })
    })
    })
    .catch((error) => {
      console.error(error);
    });
  }

  onButtonClick(buttonTitle: string) {
    console.log(buttonTitle);
    if(buttonTitle === "SAVE_AS_DRAFT") {
      this.libProjectService.saveProjectFunc(true);
    }
  }

  ngOnDestroy(){
    if (this.projectDataSubscription) {
      this.projectDataSubscription.unsubscribe();
    }
  }
}
