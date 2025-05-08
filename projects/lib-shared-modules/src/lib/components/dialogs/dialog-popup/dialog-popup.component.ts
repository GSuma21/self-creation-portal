import { Component, ElementRef, Inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule,  MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { DynamicFormModule } from 'dynamic-form-suma';
import { UtilService } from '../../../../public-api';

@Component({
  selector: 'lib-dialog-popup',
  standalone: true,
  imports: [MatDialogModule,MatButtonModule, MatIconModule, TranslateModule,MatFormFieldModule,FormsModule,MatInputModule,MatCheckboxModule,DynamicFormModule],
  templateUrl: './dialog-popup.component.html',
  styleUrl: './dialog-popup.component.scss'
})
export class DialogPopupComponent implements OnInit {
  reportContent: boolean = false;
  title: string = '';
  errorMessage: string = '';
  selectedFiles: File | undefined;
  language:any
  copied:any = false;
  @ViewChild('dialogueForm') dialogueForm!: NgForm;
  @ViewChild('certificateContainer', { static: true }) certificateContainer: ElementRef | any;

  constructor(
    public dialogRef: MatDialogRef<DialogPopupComponent>, private renderer: Renderer2,
    @Inject(MAT_DIALOG_DATA)  public dialogueData: any, private utilService:UtilService) {
      this.language = this.dialogueData?.language
  }

  ngOnInit(): void {
    if(this.dialogueData.certificate) {
      this.renderer.setProperty(
        this.certificateContainer?.nativeElement,
        'innerHTML',
        this.dialogueData.certificate.nativeElement.innerHTML
      );
    }
  }

  onDragOver(event: DragEvent){
    event.preventDefault();
  }

  onDragLeave(event: DragEvent){
    event.preventDefault();
  }

  onFileDropped(event: DragEvent){
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.validateAndUploadFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event|any) {
    let image: any = event.target.files[0];
    let fr:any = new FileReader();
    fr.onload = () => {
      // when file has loaded
      var img = new Image();

      img.onload = () => {
        console.log(img.height,img.width)
        if(this.dialogueData.imageSpecification.height != img.height || this.dialogueData.imageSpecification.width != img.width) {
          this.errorMessage = 'File size is not match with acceptable size.';
          return;
        }
        else {
          const input = event.target as HTMLInputElement;
          if (input.files && input.files.length > 0) {
            this.validateAndUploadFile(input.files[0]);
          }
        }
      };

      img.src = fr.result; // This is the data URL
    };

    fr.readAsDataURL(image);
  }

  validateAndUploadFile(file: File) {
    this.errorMessage = '';

    if (file.type !== 'image/png') {
      this.errorMessage = 'Only PNG files are allowed.';
      return;
    }

    if (file.size > 50000) {
      this.errorMessage = 'File size exceeds 50KB limit.';
      return;
    }
    if(this.errorMessage.length == 0) {
      this.selectedFiles = file;
    }
    this.uploadFile(file);
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
  }

  onAttach() {
    if(!this.selectedFiles) {
      this.errorMessage = 'Please attach file.';
      return;
    }
    else {
      this.dialogRef.close({ file: this.selectedFiles, additionalData: this.dialogueData});
    }
  }


  onExit(){
    if (this.reportContent) {
      if(this.dialogueForm && this.dialogueForm.valid){
        this.closeDialog();
      } else {
        this.dialogueForm.control.markAllAsTouched(); // Mark all fields as touched to display validation messages
      }
    }else{
      this.closeDialog();
    }
  }

  onCopy() {
    this.utilService.copyTextToClipboard(this.dialogueData.link)
    this.closeDialog();
  }


  closeDialog() {
    this.dialogRef.close({
      data: this.dialogueData.exitButton,
      title: this.title,
      isReported: this.reportContent || false,
    });
  }
}
