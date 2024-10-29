import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Inject, Output, ViewEncapsulation } from '@angular/core';
import {MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'lib-preview',
  standalone: true,
  imports: [MatIconModule,MatDialogModule],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  encapsulation:ViewEncapsulation.None
})
export class PreviewComponent {
  config = {
    maxFileSize: 50,
    baseUrl: "",
    accessToken: "",
    profileInfo: {},
    isPreview: true
  }
constructor(public dialogRef: MatDialogRef<PreviewComponent>,
    @Inject(MAT_DIALOG_DATA)  public dialogData: any) {}
}
