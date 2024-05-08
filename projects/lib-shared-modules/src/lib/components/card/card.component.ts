// import { CommonModule } from '@angular/common';
import { Component,Input } from '@angular/core';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'lib-card',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() list: any;
}
