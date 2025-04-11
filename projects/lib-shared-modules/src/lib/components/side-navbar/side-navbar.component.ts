import { AfterViewChecked, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { FormService } from '../../../public-api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-side-navbar',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatIconModule, MatListModule, MatCardModule, TranslateModule,  RouterModule],
  templateUrl: './side-navbar.component.html',
  styleUrl: './side-navbar.component.scss'
})
export class SideNavbarComponent implements OnInit{
  @Input() sidenavData : any[] = [];
  @Output() navChange = new EventEmitter<String>();
  @Input() tabValidation:any;
  @Input() clearQueryParamsOnNavigate: boolean = false
  @Input() lastReviewed:any = ""


  constructor(private formService:FormService) {

  }

  ngOnInit() {
  }

  currentTab(data:any) {
    this.navChange.emit(data);
  }

}
