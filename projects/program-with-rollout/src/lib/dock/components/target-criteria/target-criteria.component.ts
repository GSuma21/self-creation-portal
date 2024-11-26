import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-target-criteria',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatInputModule, MatIconModule, TranslateModule, FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './target-criteria.component.html',
  styleUrl: './target-criteria.component.scss'
})
export class TargetCriteriaComponent {

  constructor(public dialogRef: MatDialogRef<TargetCriteriaComponent>, @Inject(MAT_DIALOG_DATA) public dialogData: any) {

  }
}
