import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { PreviewComponent } from '../preview/preview.component';
import { SearchComponent } from '../search/search.component';
import { FilterComponent } from '../filter/filter.component';
import { NoResultFoundComponent } from '../no-result-found/no-result-found.component';
import { HttpProviderService } from '../../services/http-provider.service';
import { ConfigService } from '../../configs/config.service';
import { UtilService } from '../../services/util/util.service';
import { FormService } from '../../services/form/form.service';
import { SIDE_NAV_DATA } from '../../constants/formConstant';

@Component({
  selector: 'app-choose-resource',
  standalone: true,
  imports: [CommonModule, HeaderComponent, MatListModule, MatRadioModule, MatButtonModule, PreviewComponent, TranslateModule,SearchComponent, FilterComponent, MatIconModule, NoResultFoundComponent],
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
  searchText:string = '';
  data:any ={
    "resourceData":[],
    "cssClass":"h-[80%]"
  }
  showPreview:boolean = false
  filters = {
    "activeFilterButton":"",
    "changeReqCount":1,
    "inprogressCount":1,
    "filterData": [{
      "label": "SORT_BY",
      "value": "sort_by",
      "option": [
          {
              "label": "A_TO_Z",
              "value": "A_TO_Z"
          },
          {
              "label": "Z_TO_A",
              "value": "Z_TO_A"
          },
          {
              "label": "LATEST_FIRST",
              "value": "LATEST_FIRST"
          },
          {
              "label": "OLDEST_FIRST",
              "value": "OLDEST_FIRST"
          }
      ],
      "isMultiple": false
  }]
  }
  noSearchResultMessage:any;
  noPublishedResourceMessage:any;
  showNoResultComponent:boolean = false;
  showNoPulishedMessage:boolean = false;
  rolloutId:any = this.route.snapshot.queryParamMap.get('rolloutId')

constructor(private httpService: HttpProviderService, private Configuration: ConfigService,  private utilService:UtilService, private router:Router, private route: ActivatedRoute,   private formService: FormService,) {}
  ngOnInit(){
    this.formService.getForm(SIDE_NAV_DATA).subscribe(form => {
      const selectedSideNavData = form?.result?.data.fields.controls.find((item: any) => item.url === "roll-out");
      this.noSearchResultMessage = selectedSideNavData?.noSearchResultMessage || '' ;
      this.noPublishedResourceMessage =  selectedSideNavData?.noPublishedResourceMessage || ""
    });
   this.getResourceList().subscribe((resourceList:any) => {
    this.contentList = resourceList.result.data
    this.showNoResultComponent = this.contentList.length === 0 ? true : false;
    if(this.contentList.length !== 0){
      this.onSelectionChange(resourceList.result.data[0])
    }else{
      this.showNoPulishedMessage = true
    }
   })
  }


  getResourceList(sort_by:any="",sort_order:any=""){
    const config = {
      url : this.Configuration.urlConFig.RESOURCE_LISTS_URLS.BASE + this.Configuration.urlConFig.RESOURCE_LISTS_URLS.ENDPOINTS.BROWSE_EXISTING_LIST,
      params : new URLSearchParams({ page: this.page.toString(), limit: this.limit.toString(), search:this.searchText ,sort_by:sort_by,sort_order:sort_order })
    }
    return this.httpService.get(`${config.url}?${config.params.toString()}`);
  }

  onSelectionChange(item:any) {
    this.showPreview = false;
    this.getDetailsOfResource(item)?.subscribe((details:any) => {
      this.utilService.removeEmptyKey(details.result).subscribe((res:any) =>{
        this.data.resourceData = res
        this.showPreview = true
      })
    })
    this.selectedResource = item
    this.selectedValue = item.id;
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

  /**
   * This function is used for the search functionality
   * @param event - The search event which contains the searchtext
   */
  receiveSearchResults(event: string) {
    this.searchText = event.trim().toLowerCase();
    this.page=1
    this.getResourceList().subscribe((resourceList:any) => {
      this.contentList = resourceList.result.data
      this.showNoResultComponent = this.contentList.length === 0 ? true : false;
      if(this.contentList.length !== 0){
        this.onSelectionChange(resourceList.result.data[0])
      }
     })

  }

  onSelect(){
      this.router.navigate(['roll-out/details/project-details'],{queryParams:{parent:"roll-out", resourceId:this.selectedResource.id, rolloutId:this.rolloutId}})
  }

  navigateToCreateNew() {
    this.router.navigate(['home/create-new'], {})
  }

  onFilterChange(event:any){}

  onSortOptionsChanged(event:any){
    this.getResourceList(event.sort_by,event.sort_order).subscribe((resourceList: any) => {
      this.contentList = resourceList.result.data
      this.showNoResultComponent = this.contentList.length === 0 ? true : false;
      if(this.contentList.length !== 0){
        this.onSelectionChange(resourceList.result.data[0])
      }
    });
  }

  filterButtonClickEvent(event:any){}
}
