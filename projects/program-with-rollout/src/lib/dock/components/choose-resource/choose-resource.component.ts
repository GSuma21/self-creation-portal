import { Component } from '@angular/core';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ConfigService, FilterComponent, FormService, HeaderComponent, HttpProviderService, NoResultFoundComponent, PreviewComponent, SearchComponent, SIDE_NAV_DATA, UtilService } from 'lib-shared-modules';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-choose-resource',
  standalone: true,
  imports: [CommonModule, HeaderComponent, MatListModule, MatRadioModule, MatButtonModule, PreviewComponent, TranslateModule,SearchComponent, FilterComponent, MatIconModule, NoResultFoundComponent, MatCheckboxModule],
  templateUrl: './choose-resource.component.html',
  styleUrl: './choose-resource.component.scss'
})
export class ChooseResourceComponent {
  redirectData:any={}
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
  selectFor:any = this.route.snapshot.queryParamMap.get('selectFor')
  selectedValuesForPrograms: number[] = [];

constructor(private httpService: HttpProviderService, private Configuration: ConfigService,  private utilService:UtilService, private router:Router, private route: ActivatedRoute,   private formService: FormService,) {}
  ngOnInit(){
    this.redirectData={
      selectDesourceTitle: (this.selectFor =='roll-out') ? "SELECT" : "ADD_TO_PROGRAM",
      subTitle:(this.selectFor =='roll-out') ? "" : "ADD_TO_PROGRAM_SUBTEXT",
      redirectUrl: (this.selectFor =='roll-out') ? 'roll-out/details/project-details' : 'roll-out/details/program-resources'
   }
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
    this.router.navigate([this.redirectData.redirectUrl],{queryParams:{parent:this.route.snapshot.queryParamMap.get('selectFor'), resourceId:this.selectedResource.id, rolloutId:this.rolloutId, programId:this.route.snapshot.queryParamMap.get('programId') ,resourceIds:this.selectedValuesForPrograms}})
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

  onSelectionChangeForPrograms(item: any) {
    this.onSelectionChange(item)
    if (!item || !item.id) {
      return;
    }
    const index = this.selectedValuesForPrograms.indexOf(item.id);
    if (index === -1) {
      this.selectedValuesForPrograms.push(item.id);
    } else {
      this.selectedValuesForPrograms.splice(index, 1);
    }
  }
}
