import { Component, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LibSharedModulesService } from '../../lib-shared-modules.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {MatTooltip, MatTooltipModule} from '@angular/material/tooltip';
import { Subscription } from 'rxjs/internal/Subscription';
import {MatSelectModule} from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { UtilService } from '../../services/util/util.service';
import { solutionModes } from '../../constants/urlConstants';

@Component({
  selector: 'lib-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, TranslateModule,CommonModule,MatTooltipModule, MatSelectModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @ViewChild('tooltip') tooltip: MatTooltip | undefined;
  @Input() backButton : boolean = true ;
  @Input() title!: string;
  @Input() headerData : any;
  @Input() modeFromParent?: string;
  @Input() toParent:boolean = false;
  @Input() config:any;
  @Output() backToParent = new EventEmitter<boolean>();

  selectedLanguage: any = 'en'; 
  supportLanguages : any = [
    {label: "ENGLISH", value: "en"},
    {label: "HINDI", value: "hi"}
  ]
  showToolTip: boolean = false;

  mode:any = "edit";
  private subscription: Subscription = new Subscription();
  @Output() buttonClick: EventEmitter<string> =  new EventEmitter<string>();

  constructor( private libsharedservice: LibSharedModulesService, private router: Router, private route: ActivatedRoute,
    private translateService: TranslateService, private utilService: UtilService) {

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
    }else{
      this.backToParent.emit()
    }
  
  }

  onButtonClick(button : any) {
    this.buttonClick.emit(button.title)
  }

  logout() {
    this.buttonClick.emit('LOGOUT')
  }

  languageChange(event:any) {
    this.selectedLanguage = event.value;
    this.translateService.use(this.selectedLanguage);
    localStorage.setItem('language', this.selectedLanguage);
    this.utilService.setNewLanguage(this.selectedLanguage)
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showTooltip(button:any) {
    if (button.tooltip && this.tooltip) {
      this.tooltip.disabled = false;
      this.tooltip.show();
    }
  }
  
  hideTooltip(button:any) {
    if(this.tooltip){
      this.tooltip.hide();
      this.tooltip.disabled = true;
    }
  }

  isButtonsNotDependOnModes(): any {
    if(!this.config){
      return false;
    }else{
      return (
        (this.router.url.includes('program-details') ||
         this.router.url.includes('program-resources') ||
         this.router.url.includes('resource-level-targeting')) &&
        (
          (!this.mode && !this.config?.review_required) ||
          (this.mode === solutionModes.EDIT && !this.config?.review_required) ||
          (this.mode === solutionModes.RESOURCE_EDIT && !this.config?.review_required_after_publish)
        )
      );
    }
  }

  getButtons() {
    return this.headerData?.buttons[
      this.mode === solutionModes.RESOURCE_EDIT ? 'review_not_required_after_publish' : 'review_not_required'
    ] || [];
  }

  getButtonsList() {
    if (this.isButtonsNotDependOnModes()) {
      return this.getButtons();
    } else {
      const buttons = this.headerData?.buttons[this.modeFromParent ?? this.mode];
      return buttons ? buttons : [];
    }
  }
}
