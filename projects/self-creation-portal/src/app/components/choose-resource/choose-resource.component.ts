import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { environment } from 'environments';
import { ConfigService, HeaderComponent, HttpProviderService, PreviewComponent, UtilService } from 'lib-shared-modules';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { RESOURCE_URLS} from '../../services/configs/url.config.json';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-choose-resource',
  standalone: true,
  imports: [HeaderComponent, MatListModule, MatRadioModule, MatButtonModule, PreviewComponent, TranslateModule],
  templateUrl: './choose-resource.component.html',
  styleUrl: './choose-resource.component.scss'
})
export class ChooseResourceComponent {
  backButton : boolean = true;
  headerData = {
    title : "RESOURCE_LIBRARY"
  }
  contentList:any;
  config = {
    maxFileSize: 50,
    baseUrl: "",
    accessToken: "",
    profileInfo: {},
    isPreview: true
  }
  page:any = 1;
  limit:number=20;
  selectedResource:any;
  selectedValue: string | null = null;

  data:any;
  showPreview:boolean = false

constructor(private httpService: HttpProviderService, private Configuration: ConfigService,  private utilService:UtilService, private router:Router) {}
  ngOnInit(){
   this.getResourceList().subscribe((resourceList:any) => {
    this.contentList = resourceList.result.data
    this.onSelectionChange(resourceList.result.data[0])
   })
  }


  getResourceList(){
    const config = {
      url : RESOURCE_URLS.BASE + RESOURCE_URLS.ENDPOINTS.BROWSE_EXISTING_LIST,
      params : new URLSearchParams({ page: this.page.toString(), limit: this.limit.toString() })
    }
    return this.httpService.get(`${config.url}?${config.params.toString()}`);
  }

  onSelectionChange(item:any) {
    this.showPreview = false;
    this.getDetailsOfResource(item)?.subscribe((details:any) => {
      this.utilService.removeEmptyKey(details.result).subscribe((res:any) =>{
        this.data = res 
        this.showPreview = true
      })
    })
    this.selectedResource = item
    this.selectedValue = item.title;
  }

  getDetailsOfResource(item:any){
    switch (item.type) {
      case "project": 
          return this.httpService.get(
            this.Configuration.urlConFig.PROJECT_URLS.READ_PROJECT + item.id
          );
    
      default:
        return;
    }
  }


  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
  
    // Check if scrolled near the bottom
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      this.loadMoreData(); // Call function to fetch more data
    }
  }
  
  loadMoreData(): void {
    this.page++; // Increment page number
    this.getResourceList().subscribe((resourceList: any) => {
      // Append new data to the existing list
      this.contentList = [...this.contentList, ...resourceList.result.data];
    });
  }
  
onSelect(){
  this.router.navigate(['roll-out/details/project-details'],{queryParams:{parent:"roll-out", resourceId:this.selectedResource.id}})
}

}
