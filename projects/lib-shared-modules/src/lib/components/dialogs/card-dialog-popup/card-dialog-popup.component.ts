import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-card-dialog-popup',
  standalone: true,
  imports: [MatDialogModule,MatButtonModule, MatIconModule, MatCardModule, TranslateModule],
  templateUrl: './card-dialog-popup.component.html',
  styleUrl: './card-dialog-popup.component.scss'
})
export class CardDialogPopupComponent {
  constructor(public dialogRef: MatDialogRef<CardDialogPopupComponent>, @Inject(MAT_DIALOG_DATA) public dialogueData: any) {}
}
