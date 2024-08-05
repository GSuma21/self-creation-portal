import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { LibProjectService } from '../../../lib-project.service';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-ramkumar';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { MatDialog } from '@angular/material/dialog';
import { DialogPopupComponent, FormService } from 'lib-shared-modules';

@Component({
  selector: 'lib-project-details',
  standalone: true,
  imports: [DynamicFormModule, TranslateModule],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss',
})
export class ProjectDetailsComponent implements OnDestroy, OnInit {
  dynamicFormData: any;
  projectId: string | number = '';
  intervalId:any;
  formDataForTitle:any;
  @ViewChild('formLib') formLib: MainFormComponent | undefined;
  private subscription: Subscription = new Subscription();
  constructor(
    private libProjectService: LibProjectService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private formService: FormService
  ) { }
  ngOnInit() {
    this.startAutoSaving();
    this.libProjectService.projectData = {};
    this.getFormWithEntitiesAndMap();
    this.subscription.add(
      this.libProjectService.isProjectSave.subscribe(
        (isProjectSave: boolean) => {
          if (isProjectSave && this.router.url.includes('project-details')) {
            this.saveForm();
          }
        }
      )
    );
  }


  getFormWithEntitiesAndMap(){
    this.formService.getFormWithEntities('PROJECT_DETAILS').then((data) => {
      if (data) {
        this.formDataForTitle = data.controls.find((item:any) => item.name === 'title');
        this.subscription.add(
          this.route.queryParams.subscribe((params: any) => {
            this.projectId = params.projectId;
            this.libProjectService.projectData.id = params.projectId;
            if (params.projectId) {
              if (params.mode === 'edit') {
                if (Object.keys(this.libProjectService.projectData).length > 1) { // project ID will be there so length considered as more than 1
                  this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
                } else {
                  this.subscription.add(
                    this.libProjectService
                      .readProject(this.projectId)
                      .subscribe((res: any) => {
                        this.libProjectService.setProjectData(res.result);
                        this.readProjectDeatilsAndMap(data.controls,res.result);
                        this.libProjectService.upDateProjectTitle();
                      })
                  );
                }
              }
            } else {
              this.readProjectDeatilsAndMap(data.controls,this.libProjectService.projectData);
            }
          })
        );
      }
    });
  }

  readProjectDeatilsAndMap(formControls:any,res: any) {
    formControls.forEach((element: any) => {
      if (Array.isArray(res[element.name])) {
        console.log(Array.isArray(element.value));
        element.value = res[element.name].map((arrayItem: any) => {
          return arrayItem.value ? arrayItem.value : arrayItem;
        });
      } else {
          if(res[element.name]) {
            element.value = res[element.name].value ? res[element.name].value : res[element.name];
          }
      }
      if (element.subfields) {
        element.subfields.forEach((subElement: any) => {
          subElement.value = res[element.name]?.[subElement.name]?.value
            ? res[element.name]?.[subElement.name].value
            : res[element.name]?.[subElement.name];
        });
      }
    });
    this.dynamicFormData = formControls;
    if( this.formLib){
      this.libProjectService.validForm.projectDetails = ( this.formLib?.myForm.status === "INVALID" || this.formLib?.subform?.myForm.status === "INVALID") ? "INVALID" : "VALID";
    }
    if(this.libProjectService.projectData.tasks){
      const isValid = this.libProjectService.projectData.tasks.every((task: { description: any; }) => task.description);
      this.libProjectService.validForm.tasks = isValid ? "VALID" : "INVALID";
    }
    console.log(this.dynamicFormData);
  }

  startAutoSaving() {
    this.intervalId = setInterval(() => {
      if(!this.projectId) {
        this.createProject({title:'Untitled project'})
      } else {
        this.subscription.add(this.libProjectService.createOrUpdateProject(this.libProjectService.projectData, this.projectId).subscribe((res)=>console.log(res)))
      }
    }, 30000);
  }

  createProject(payload?:any) { // title should be send from calling methods only, due to title can be filled before project creation
      this.libProjectService
      .createOrUpdateProject(payload)
      .subscribe((res: any) => {
        (this.projectId = res.result.id),
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              projectId: this.projectId,
              mode: 'edit',
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          this.libProjectService.projectData.id = res.result.id;
      })
  }

  saveForm() {
    if (this.libProjectService.projectData.title) {
      if (this.projectId) {
        this.libProjectService.updateProjectDraft(this.projectId).subscribe();
      }
      else {
        return this.createProject({title:this.libProjectService.projectData.title})
      }
    } else {
      const dialogRef = this.dialog.open(DialogPopupComponent, {
        disableClose: true,
        autoFocus : false,
        data: {
          header: 'SAVE_CHANGES',
          content: 'ADD_TITLE_TO_CONTINUE_SAVING',
          form:[this.formDataForTitle],
          exitButton: 'CONTINUE',
        },
      });

      return dialogRef
        .afterClosed()
        .toPromise()
        .then((result) => {
           if (result.data === 'CONTINUE') {
            if(result.title){
              this.libProjectService.upDateProjectTitle(result.title);
              this.libProjectService.setProjectData({title:result.title});
              if (this.projectId) {
                this.libProjectService.updateProjectDraft(this.projectId).subscribe();
              }
              else {
                return this.createProject(this.libProjectService.projectData)
              }
              this.getFormWithEntitiesAndMap()
              this.saveForm()
            }
            return true;
          } else {
            return false;
          }
        });
    }

  }

  getDynamicFormData(data: any) {
    console.log(data);
    const obj: { [key: string]: any } = {};
    if (!this.isEvent(data)) {
    if(this.libProjectService.projectData.title != data.title) {
      console.log('triggered')
      this.libProjectService.upDateProjectTitle(data.title);
    }
    this.libProjectService.setProjectData(data);
    }
  }


  isEvent(data:any) {
    return typeof data === 'object' && data !== null &&
           'type' in data && 'target' in data &&
           typeof data.preventDefault === 'function' &&
           typeof data.stopPropagation === 'function';
  };

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if(this.projectId) {
      this.libProjectService.createOrUpdateProject(this.libProjectService.projectData,this.projectId).subscribe((res)=> console.log(res))
      this.libProjectService.saveProjectFunc(false);
    }
    else {
      this.libProjectService.saveProjectFunc(false);
    }
  }
}
