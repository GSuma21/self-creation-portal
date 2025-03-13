import { CommonModule } from '@angular/common';
import { Component,Input,Output,EventEmitter, OnInit } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import { resourceStatus, reviewStatus } from '../../constants/urlConstants';
@Component({
  selector: 'lib-card',
  standalone: true,
  imports: [MatCardModule,CommonModule,MatButtonModule,MatIconModule,TranslateModule,MatTooltipModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent implements OnInit {
  @Input() list: any;
  @Input() showActionButton: boolean = false;
  @Input() project:any;
  @Input() activeRole:any;
  @Input() showDates:any = false;
  @Output() buttonClickEvent = new EventEmitter<{ label: string, item: any }>();
  @Output() infoClickEvent = new EventEmitter<{item: any}>
  @Input() showInfoIcon: boolean = false;

  resourceStatus = resourceStatus;
  reviewStatus = reviewStatus;

  constructor() {
  }

  ngOnInit(): void {
    console.log(this.list)
  }

  onButtonClick(label: string, item: any) {
    this.buttonClickEvent.emit({ label, item });
  }

  onInfoClick(item: any) {
    this.infoClickEvent.emit({item});
  }

  formatLabel(type: string): string {
    return type
      .replace(/_/g, ' ')         // Replace all underscores with spaces
      .replace(/^./, (str: string) => str.toUpperCase()); // Capitalize the first letter
  }

}
