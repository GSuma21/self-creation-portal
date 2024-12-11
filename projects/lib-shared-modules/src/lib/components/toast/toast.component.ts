import { Component, Inject, inject, Optional } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import {MatIconModule} from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-toast',
  standalone: true,
  imports: [MatIconModule,TranslateModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  snackBarRef = inject(MatSnackBarRef);
  constructor(@Optional() @Inject(MAT_SNACK_BAR_DATA) public data: any) { }
}
