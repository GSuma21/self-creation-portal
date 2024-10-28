import { Component } from '@angular/core';
import { HeaderComponent, SideNavbarComponent, DialogModelComponent, IndexDbService } from 'lib-shared-modules';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule,TranslateService } from '@ngx-translate/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, SideNavbarComponent, DialogModelComponent, MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, MatCardModule,TranslateModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  backButton : boolean = true;
  subHeader : any;
  headerData : any = {};
  selctedCardItem : any;
  titleObj = {
    "title" : "Creation Portal"
  }

  constructor(private translate: TranslateService, private router: Router, private viewportScroller: ViewportScroller,private dbService: IndexDbService) {
    this.initializeTranslation();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.scrollToTop();
      }
    });
  }

  private initializeTranslation(): void {
    const storedLanguage = localStorage.getItem('language') || 'en';
    this.translate.setDefaultLang(storedLanguage);
    this.translate.use(storedLanguage);
  }

  onButtonClick(buttonTitle: string) {
  }

  scrollToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
  }


}
