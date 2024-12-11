import { Component } from '@angular/core';

@Component({
  selector: 'lib-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {

  sidenavData = [{
    action: "",
    icon: "description",
    label: "TARGETTING_DETAILS",
    page: "projectDetails",
    url: "project-details"
  }]
}
