import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router, ActivatedRoute } from '@angular/router';
import { CardComponent, FormService, modes, SOLUTION_LIST } from 'lib-shared-modules';

import { Subscription } from 'rxjs';
import { ProgramWithRolloutService } from '../../../program-with-rollout.service';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';

@Component({
  selector: 'lib-resource-level-targeting',
  standalone: true,
  imports: [CommonModule,MatCardModule, FormsModule,ReactiveFormsModule,CardComponent, MatIconModule, MatLabel,MatFormFieldModule,MatInputModule, MatDatepickerModule,MatNativeDateModule ],
  templateUrl: './resource-level-targeting.component.html',
  styleUrl: './resource-level-targeting.component.scss',
})
export class ResourceLevelTargetingComponent {
  resourceCount: any = 0;
  resources: any;
  parent: any;
  resourceIds: any = [];
  programId: any;
  resourceForm:any;
  private subscription: Subscription = new Subscription();

  constructor(
    private formService: FormService,
    private router: Router,
    private route: ActivatedRoute,
    private programWithRolloutService: ProgramWithRolloutService,
    private fb: FormBuilder,
    private dialog:MatDialog
  ) {
    this.parent = this.route.snapshot.queryParamMap.get('parent');
    this.route.queryParamMap.subscribe((params) => {
      this.resourceIds = params.getAll('resourceIds').map((id) => Number(id));
      this.programId = this.route.snapshot.queryParamMap.get('programId');
    });
  }

  ngOnInit() {
    this.initForm()
    if (this.resourceIds.length) {
      this.programWithRolloutService
        .addResourceToProgram(
          { resource_ids: this.resourceIds },
          this.programId
        )
        .subscribe((res: any) => {
          const updatedParams = {
            parent: this.parent,
            programId: this.programId,
          };
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { parent: this.parent, programId: this.programId },
          });
          // Optionally, clear resourceIds in your component
          this.resourceIds = [];

          this.subscription.add(
            this.programWithRolloutService
              .readProgram(this.programId)
              .subscribe((res: any) => {
                this.programWithRolloutService.setProgramData(res.result);
                this.resourceCount =
                  this.programWithRolloutService.programData.resources.length;
                this.resources =
                  this.programWithRolloutService.programData.resources;
              })
          );
        });
    }
    this.resourceCount =
      this.programWithRolloutService.programData.resources.length;
    this.resources = this.programWithRolloutService.programData.resources;
    // Add initial form fields
    this.addResourceFields();
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

  initForm(): void {
    this.resourceForm = this.fb.group({
      resources: this.fb.array([])
    });
  }

  get resourceFields(): FormArray {
    return this.resourceForm.get('resources') as FormArray;
  }

  addResourceFields(): void {
    this.resources.forEach((element:any) => {
      const resourceGroup = this.fb.group({
        start_date: [element.start_date ? element.start_date : '', Validators.required],
        end_date: [element.end_date ? element.end_date : '', Validators.required]
      });

      this.resourceFields.push(resourceGroup);
    });
  }

  submit() {
    if (!this.programId) {
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
          this.programWithRolloutService.programData.id = res.result.id;
        });
    } else {
      this.programWithRolloutService
        .updateProgramDraft(this.programId)
        .subscribe();
    }

    // this.programWithRolloutService.updateProgramDraft(this.programId).subscribe();
  }

  openTargetCriteria(item:any) {
    const dialogRef = this.dialog.open(TargetCriteriaComponent, {
      width: '80%',
      height: '80%',
      disableClose: true,
      autoFocus: false,
      data: null,
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      // this.dynamicFormData.forEach((element:any) => {
      //   if(element.name == "targeting_criteria" && res) {
      //     element.value.push(res);
      //     this.formLib.myForm.patchValue({ // adding target criteria to form
      //       targeting_criteria: element.value,
      //     });
      //     // this.programWithRolloutService.rollOutDetails.targeting_criteria
      //   }
      // })
      // this.updateTargetCriteria()
    });
  }

  onCardClick(cardItem: any) {
    this.router.navigate(['roll-out/choose-resource'], {
      queryParams: {
        parent: this.parent,
        selectFor: 'programs',
        programId: this.programId,
      },
    });
  }

  statusButtonClick(event: { label: string; item: any }) {}

  infoIconClickEvent(data: any) {}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
