import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicFormModule, MainFormComponent } from 'dynamic-form-suma';

@Component({
  selector: 'lib-program-details',
  standalone: true,
  imports: [DynamicFormModule, TranslateModule],
  templateUrl: './program-details.component.html',
  styleUrl: './program-details.component.scss'
})
export class ProgramDetailsComponent {
  allowOpenLinks = true;
  viewOnly = false;
  dynamicFormData = [
    {
      name: "title",
      label: "Program title",
      value: "",
      class: "",
      type: "text",
      cssStyle: "relative w-[100%]",
      placeHolder: "Enter program title",
      position: "floating",
      infoMessage:
        "Name your program as it should appear to the user on the consumption app.",
      errorMessage: {
        required: "Enter valid program title",
        maxlength: "Program title must not exceed 256 characters",
      },
      validators: {
        required: true,
        maxLength: 255,
      },
    },
    {
      name: "targeting_criteria",
      label: "Target criteria",
      value: [],
      class: "",
      icon: "add_circle",
      type: "triggerParent",
      cssStyle: "relative w-[100%]",
      textForLink: "Add target criteria",
      isMultiSelect: "false",
      placeHolder: "Select license",
      position: "floating",
      infoMessage:
        "Select the targeting details for your program. Details for multiple criteria can be added.",
      errorMessage: {},
      validators: {
        required: true,
      },
    },
    {
      name: "objective",
      label: "Objective",
      value: "",
      class: "",
      type: "textarea",
      cssStyle: "relative w-[100%]",
      placeHolder: "Summarize the goal of the program",
      position: "floating",
      infoMessage: "Describe the program's main goal in one or two lines.",
      errorMessage: {
        required: "Summarize the goal of the program",
        maxlength: "Objective must not exceed 2000 characters",
      },
      validators: {
        required: true,
        maxLength: 2000,
      },
    },
    {
      name: "start_date",
      label: "Start date",
      value: "",
      class: "",
      type: "date",
      cssStyle: "relative w-[47%]",
      placeHolder: "Enter start date",
      position: "floating",
      infoMessage:
        "Enter the start date of the program in DD-MM-YYYY format",
      maxDependentChild: "end_date",
      errorMessage: {
        required: "Enter start date ",
      },
      validators: {
        required: true,
      },
    },
    {
      name: "end_date",
      label: "End date",
      value: "",
      class: "",
      type: "date",
      cssStyle: "relative w-[47%]",
      placeHolder: "Enter end date",
      position: "floating",
      infoMessage:
        "Enter the end date of the program in DD-MM-YYYY format",
      minDependentChild: "start_date",
      errorMessage: {
        required: "Enter end date ",
      },
      validators: {
        required: true,
      },
    },
    {
      name: "keywords",
      label: "Add keywords",
      value: "",
      class: "",
      type: "text",
      cssStyle: "relative w-[100%]",
      placeHolder: "Add a tag",
      position: "floating",
      infoMessage:
        "Keywords improve searchability. Help users find your program easily with relevant keywords.",
      errorMessage: {
        required: "Add a tag",
        maxlength: "Keyword must not exceed 256 characters",
      },
      validators: {
        required: false,
        maxLength: 255,
      },
    },
    {
      name: "viewers",
      label: "Program manager",
      value: [],
      class: "",
      type: "select",
      cssStyle: "relative w-[100%]",
      isMultiSelect: "true",
      placeHolder: "Select program manager",
      position: "floating",
      infoMessage:
        "Select Program Manager of your program",
      errorMessage: {
        required: "Select program manager",
      },
      validators: {
        required: true,
      },
      options: [],
      meta: {
        entityType: "viewers",
      },
    },
    {
      name: "licenses",
      label: "License",
      value: "cc_by_4.0",
      class: "",
      type: "select",
      cssStyle: "relative w-[100%]",
      isMultiSelect: "false",
      placeHolder: "Select license",
      position: "floating",
      infoMessage: "Select license type of your program",
      errorMessage: {
        required: "Select license",
      },
      validators: {
        required: true,
      },
      options: [],
      meta: {
        entityType: "licenses",
      },
    },
  ]



  getDynamicFormData(event:any){

  }

  getFormControlChange(event:any){}
}
