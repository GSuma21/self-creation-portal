import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ConfigService, DialogPopupComponent, FilterComponent, FormService, HeaderComponent, HttpProviderService, LibSharedModulesService, NoResultFoundComponent, PreviewComponent, SearchComponent, SIDE_NAV_DATA, UtilService } from 'lib-shared-modules';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-choose-resource',
  standalone: true,
  imports: [CommonModule, HeaderComponent, MatListModule, MatRadioModule, MatButtonModule, PreviewComponent, TranslateModule,SearchComponent, FilterComponent, MatIconModule, NoResultFoundComponent, MatCheckboxModule],
  templateUrl: './choose-resource.component.html',
  styleUrl: './choose-resource.component.scss'
})
export class ChooseResourceComponent {
  private subscription: Subscription = new Subscription();
  @ViewChildren('listContainer') listContainers!: QueryList<ElementRef>;
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
      "label": {
          "en": "Sort by",
          "hi": "क्रमबद्ध करें"
      },
      "value": "sort_by",
      "option": [
          {
              "label": {
                  "en": "A to Z",
                  "hi": "ए से जेड तक"
              },
              "value": "A_TO_Z"
          },
          {
              "label": {
                  "en": "Z to A",
                  "hi": "जेड से ए तक"
              },
              "value": "Z_TO_A"
          },
          {
              "label": {
                  "en": "Latest first",
                  "hi": "नवीनतम पहले"
              },
              "value": "LATEST_FIRST"
          },
          {
              "label": {
                  "en": "Oldest first",
                  "hi": "सबसे पुराना पहले"
              },
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
  sortBy:any = ''
  sortOrder:any = ''
  type:any=this.route.snapshot.queryParamMap.get('type')
  language:any = JSON.parse(localStorage.getItem('preferred_language') ?? '{}')?.value ?? 'en';

constructor(private httpService: HttpProviderService, private Configuration: ConfigService,  private utilService:UtilService, private router:Router, private route: ActivatedRoute,   private formService: FormService, private dialog:MatDialog, private sharedService : LibSharedModulesService) {}
  ngOnInit(){
    this.redirectData={
      selectDesourceTitle: (this.selectFor =='roll-out') ? "SELECT" : "ADD_TO_PROGRAM",
      subTitle:(this.selectFor =='roll-out') ? "" : "ADD_TO_PROGRAM_SUBTEXT",
      redirectUrl: (this.selectFor =='roll-out') ? 'roll-out/details/project-details' : 'roll-out/details/program-resources'
   }
   this.subscription.add(
    this.formService.getForm(SIDE_NAV_DATA).subscribe(form => {
      const selectedSideNavData = form?.result?.data.fields.controls.find((item: any) => item.url === "roll-out");
      this.noSearchResultMessage = selectedSideNavData?.noSearchResultMessage || '' ;
      this.noPublishedResourceMessage =  selectedSideNavData?.noPublishedResourceMessage || ""
    })
   )
   this.subscription.add(
    this.getResourceList().subscribe((resourceList:any) => {
      this.contentList = resourceList.result.data
      this.showNoResultComponent = this.contentList.length === 0 ? true : false;
      if(this.contentList.length !== 0){
        this.onSelectionChange(resourceList.result.data[0])
      }else{
        this.showNoPulishedMessage = true
      }
     })
   )

   this.subscription.add(  // set a language
    this.utilService.isLanguageChanges.subscribe(
      (language: boolean) => {
        if (language) {
          this.language = language
        }
      }
    )
  );
  }


  getResourceList(sort_by:any="",sort_order:any=""){
    const config = {
      url : this.Configuration.urlConFig.RESOURCE_LISTS_URLS.BASE + this.Configuration.urlConFig.RESOURCE_LISTS_URLS.ENDPOINTS.BROWSE_EXISTING_LIST,
      params : new URLSearchParams({ page: this.page.toString(), limit: this.limit.toString(), search:this.searchText ,sort_by:sort_by ? sort_by : this.sortBy,sort_order:sort_order ? sort_order : this.sortOrder , type:this.type ?this.type:'' })
    }
    return this.httpService.get(`${config.url}?${config.params.toString()}`);
  }

  onSelectionChange(item:any) {
    this.showPreview = false;
    this.subscription.add(
      this.getDetailsOfResource(item)?.subscribe((details:any) => {
        this.utilService.removeEmptyKey(details.result).subscribe((res:any) =>{
          this.data.resourceData = res
          this.showPreview = true
        })
      })
    )
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
    clearTimeout((this as any).scrollTimeout); // clears any previously set timeout.
    (this as any).scrollTimeout = setTimeout(() => {
      const target = event.target as HTMLElement;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
        this.loadMoreData(); // Fetch more data
      }
    }, 200);  // Adds a debounce delay of 200 milliseconds to limit frequent API calls.
  }

  loadMoreData(): void {
    this.page++; // Increment page number
    this.subscription.add(
      this.getResourceList().subscribe((resourceList: any) => {
        // Append new data to the existing list
        this.contentList = [...this.contentList, ...resourceList.result.data];
      })
    )
  }

  /**
   * This function is used for the search functionality
   * @param event - The search event which contains the searchtext
   */
  receiveSearchResults(event: string) {
    this.searchText = event.trim().toLowerCase();
    this.page=1
    this.subscription.add(
      this.getResourceList().subscribe((resourceList:any) => {
        this.contentList = resourceList.result.data
        this.showNoResultComponent = this.contentList.length === 0 ? true : false;
        if(this.contentList.length !== 0){
          this.onSelectionChange(resourceList.result.data[0])
        }
        this.scrollToTop()
       })
    )
  }

  onSelect(){
    const navigation = history.state;
    let programErrors:any
    if(navigation.programErrors){
     programErrors = navigation.programErrors
     programErrors.tabValidationForProgram.programResources = 'VALID'
    }
    this.router.navigate([this.redirectData.redirectUrl],{queryParams:{parent:this.route.snapshot.queryParamMap.get('topLevelParent') ? this.route.snapshot.queryParamMap.get('topLevelParent'):this.route.snapshot.queryParamMap.get('parent'), resourceId:this.selectedResource.id, rolloutId:this.rolloutId, programId:this.route.snapshot.queryParamMap.get('programId') ,resourceIds:this.selectedValuesForPrograms, mode:this.route.snapshot.queryParamMap.get('parentMode'),checkValidations:true}, state:{programErrors : programErrors ?programErrors :""}})
  }

  navigateToCreateNew() {
    this.router.navigate(['home/create-new'], {})
  }

  onFilterChange(event:any){}

  onSortOptionsChanged(event:any){
    this.sortBy = event.sort_by
    this.sortOrder = event.sort_order
    this.page = 1
    this.subscription.add(
      this.getResourceList(event.sort_by,event.sort_order).subscribe((resourceList: any) => {
        this.contentList = resourceList.result.data
        this.showNoResultComponent = this.contentList.length === 0 ? true : false;
        if(this.contentList.length !== 0){
          this.onSelectionChange(resourceList.result.data[0])
        }
        this.scrollToTop()
      })
    )
  }

  isLastItem(item: any): boolean {
    return this.contentList.length > 0 && this.contentList[this.contentList.length - 1].id === item.id;
  }

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

  scrollToTop() {
    setTimeout(() => {
      if (this.listContainers && this.listContainers.first) {
        this.listContainers.first.nativeElement.scrollTop = 0;
      }
    }, 100); // Adding a small delay to ensure elements are rendered
  }

  onButtonClick(buttonTitle: string) {
    switch (buttonTitle) {
      case 'LOGOUT': {
        const dialogRef = this.dialog.open(DialogPopupComponent, {
          width: '39.375rem',
          disableClose: true,
          autoFocus: false,
          data: {
            header: 'SAVE_CHANGES',
            content: 'Are you sure you want to logout?',
            cancelButton: 'CANCEL',
            exitButton: 'LOGOUT',
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result.data === 'LOGOUT') {
            this.utilService.saveComment = false
            this.utilService.saveResources = false;
            this.sharedService.logout();
          }
        });
        break;
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  backToParent() {
    this.sharedService.goBack()
  }
}
