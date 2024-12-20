import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { environment } from 'environments';
import { ConfigService, FilterComponent, FormService, HeaderComponent, HttpProviderService, NoResultFoundComponent, PreviewComponent, SearchComponent, SIDE_NAV_DATA, UtilService } from 'lib-shared-modules';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { RESOURCE_URLS} from '../../services/configs/url.config.json';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../services/resource-service/resource.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-choose-resource',
  standalone: true,
  imports: [HeaderComponent, MatListModule, MatRadioModule, MatButtonModule, PreviewComponent, TranslateModule,SearchComponent, FilterComponent, MatIconModule, NoResultFoundComponent],
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
  data:any;
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
  noResultMessage:any;
  showNoResultComponent:boolean = false;
  

constructor(private httpService: HttpProviderService, private Configuration: ConfigService,  private utilService:UtilService, private router:Router, private resourceService:ResourceService, private route: ActivatedRoute,   private formService: FormService,) {}
  ngOnInit(){
    this.formService.getForm(SIDE_NAV_DATA).subscribe(form => {
      const selectedSideNavData = form?.result?.data.fields.controls.find((item: any) => item.url === "roll-out");
      this.noResultMessage = selectedSideNavData?.noResultMessage || '' ;
    });
   this.getResourceList().subscribe((resourceList:any) => {
    this.contentList = resourceList.result.data
    this.showNoResultComponent = this.contentList.length === 0 ? true : false;
    if(this.contentList.length !== 0){
      this.onSelectionChange(resourceList.result.data[0])
    }
   })
  }


  getResourceList(sort_by:any="",sort_order:any=""){
    const config = {
      url : RESOURCE_URLS.BASE + RESOURCE_URLS.ENDPOINTS.BROWSE_EXISTING_LIST,
      params : new URLSearchParams({ page: this.page.toString(), limit: this.limit.toString(), search:this.searchText ,sort_by:sort_by,sort_order:sort_order })
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
      this.router.navigate(['roll-out/details/project-details'],{queryParams:{parent:"roll-out", resourceId:this.selectedResource.id}})
      // this.resourceService.createRollOut(this.selectedResource.id).subscribe((res)=>{
      //   console.log(res);
      //   // this.router.navigate(['roll-out/details/project-details'],{queryParams:{parent:"roll-out", resourceId:this.selectedResource.id}})
      // })
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
