import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LibSharedModulesService } from '../../lib-shared-modules.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {MatTooltipModule} from '@angular/material/tooltip';
import { Subscription } from 'rxjs/internal/Subscription';
import {MatSelectModule} from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, TranslateModule,CommonModule,MatTooltipModule, MatSelectModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() backButton : boolean = true ;
  @Input() title!: string;
  @Input() headerData : any;
  @Input() toParent:boolean = false;
  @Output() backToParent = new EventEmitter<boolean>();

  selectedLanguage: any = 'en'; 
  supportLanguages : any = [
    {label: "ENGLISH", value: "en"},
    {label: "HINDI", value: "hi"}
  ]

  mode:any = "edit";
  private subscription: Subscription = new Subscription();
  @Output() buttonClick: EventEmitter<string> =  new EventEmitter<string>();

  constructor( private libsharedservice: LibSharedModulesService, private router: Router, private route: ActivatedRoute,
    private translateService: TranslateService) {

    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage) {
        this.selectedLanguage = storedLanguage;
        this.translateService.use(this.selectedLanguage);
    }

    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.mode = params.mode ? params.mode : "edit"
     })
    )

  }

  backArrowButton() {
    if(this.toParent) {
      this.backToParent.emit(true)
      return;
    }
    this.libsharedservice.goBack()
  }

  onButtonClick(button : any) {
    this.buttonClick.emit(button.title)
  }

  logout() {
    this.libsharedservice.logout();
    this.selectedLanguage = 'en';
    this.translateService.use(this.selectedLanguage);
    localStorage.setItem('language', this.selectedLanguage);
  }

  languageChange(event:any) {
    this.selectedLanguage = event.value;
    this.translateService.use(this.selectedLanguage);
    localStorage.setItem('language', this.selectedLanguage);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
