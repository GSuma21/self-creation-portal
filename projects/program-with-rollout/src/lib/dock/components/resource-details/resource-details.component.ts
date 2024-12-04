import { Component, OnInit } from '@angular/core';
import { TargetCriteriaComponent } from '../target-criteria/target-criteria.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'lib-resource-details',
  standalone: true,
  imports: [],
  templateUrl: './resource-details.component.html',
  styleUrl: './resource-details.component.scss'
})
export class ResourceDetailsComponent implements OnInit {

  constructor(private dialog:MatDialog) {

  }

  ngOnInit(): void {

  }

  openCriteria() {
    const dialogRef = this.dialog.open(TargetCriteriaComponent, {
      width: '80%',
      height:'80%',
      disableClose: true,
      autoFocus : false,
      data: {
        sideNavData:[{
          action: "",
          icon: "description",
          label: "State",
          page: "projectDetails",
          url: "project-details"
        },{
          action: "",
          icon: "description",
          label: "Gender",
          page: "projectDetails",
          url: "project-details"
        }],
        header: 'SAVE_CHANGES',
        content: 'ADD_TITLE_TO_CONTINUE_SAVING',
        exitButton: 'CONTINUE',
      },
    });
    return dialogRef
      .afterClosed().subscribe((res:any) => console.log(res))
  }

}
