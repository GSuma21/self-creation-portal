import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CardComponent, FilterComponent, HeaderComponent, PaginationComponent, SearchComponent, SideNavbarComponent, NoResultFoundComponent, DialogPopupComponent, FormService, SIDE_NAV_DATA, PROJECT_DETAILS_PAGE, ToastService, UtilService ,resourceStatus, reviewStatus ,projectMode} from 'lib-shared-modules';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../services/resource-service/resource.service';
import { CommonService } from '../../services/common-service/common.service';
import { LibProjectService } from 'lib-project';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { RESOURCE_URLS } from '../../services/configs/url.config.json';


@Component({
  selector: 'app-resource-holder',
  standalone: true,
  imports: [HeaderComponent,SideNavbarComponent, CardComponent, SearchComponent, PaginationComponent, FilterComponent, MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, MatCardModule,TranslateModule, NoResultFoundComponent],
  templateUrl: './resource-holder.component.html',
  styleUrl: './resource-holder.component.scss',
  providers: [DatePipe]
})
export class ResourceHolderComponent implements OnInit{

  @ViewChild(PaginationComponent) paginationComponent!: PaginationComponent;

  pagination = {
    totalCount: 0,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 100],
    currentPage: 0
  };

  filters = {
    search: '',
    current: { type: [] as string[] },
    status: '' as string,
    filteredLists: [] as any[],
    filterData: [] as any, //to store filterarray data json coming from formapi
    showActionButton: false, //property to show the buttons resourcelist ui
    changeReqCount : 0,
    inprogressCount  : 0,
    activeFilterButton: '' as string, //button selected from filter ui
    showInfoIcon: false
  };

  sortOptions = {
    sort_by: '',
    sort_order: ''
  };

  lists:any = [];
  noResultMessage!: string ;
  noResultFound !: string;
  pageStatus !: string;
  buttonsData: any = {};
  infoFieldsData: any = {};
  buttonsCSS : any;
  activeRole:any;
  areQueryParamsEmpty:boolean = false;

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private resourceService: ResourceService,
    private commonService: CommonService,
    private libProjectService:LibProjectService,
    private router:Router,
    private dialog : MatDialog,
    private toastService:ToastService,
    private datePipe: DatePipe,
    private utilService:UtilService) {
  }

  ngOnInit() {
    this.loadSidenavData();
  }

  /**
  *  Loads and initializes the sidenav data based on the current route.
  * - Retrieves sidenav data from the form service and updates the component state.
  * - Sets pagination, active role, button styles, filters, and status messages.
  * - merges button actions and info fields, including status-specific data.
  * - Calls `getQueryParams()` to retrieve route parameters and updates the no-result message.
  */
  loadSidenavData(){
    const currentUrl = this.route.snapshot.routeConfig?.path;
    this.formService.getForm(SIDE_NAV_DATA).subscribe(form => {
      this.pagination.pageSize =form.result.data.fields?.configuration?.itemsPerPage;
      const selectedSideNavData = form?.result?.data.fields.controls.find((item: any) => item.url === currentUrl);
      this.activeRole = selectedSideNavData.activeRole;
      this.buttonsCSS = form?.result?.data.fields.buttons;
      this.filters.filterData = selectedSideNavData?.filterData || [];
      this.noResultMessage = selectedSideNavData?.noResultMessage || '' ;
      this.pageStatus = selectedSideNavData?.value || '';
      this.buttonsData = [
        ...(selectedSideNavData.buttonsData ? [].concat(...selectedSideNavData.buttonsData.map((item: any) => item.buttons || [])) : []),
        ...(selectedSideNavData.statusButtons || [])
      ];
      this.infoFieldsData = [
        ...(selectedSideNavData.buttonsData ? [].concat(...selectedSideNavData.buttonsData.map((item: any) => item.infoFields || [])) : []),
        ...(selectedSideNavData.statusButtons ? [].concat(...selectedSideNavData.statusButtons.map((statusButton: any) =>
          (statusButton.infoFields || []).map((infoField: any) => ({ ...infoField, status: statusButton.status }))
        )) : [])
      ];
      this.getQueryParams();
      this.noResultFound = this.noResultMessage;
      this.filters.showActionButton = this.buttonsData;
      this.filters.showInfoIcon = true;
    });
  }

  /**
   * This function is used for pagechanges
   * @param event -The page changes event which contains the pageSize and page
   */
  onPageChange(event: any) {
    this.pagination.pageSize = event.pageSize;
    this.pagination.currentPage = event.page - 1;
    // this.getList();
    this.updateQueryParams();
  }

  /**
   * This function is used for the search functionality
   * @param event - The search event which contains the searchtext
   */
  receiveSearchResults(event: string) {
    this.filters.search = event.trim().toLowerCase();
    this.pagination.currentPage = 0;
    if(this.paginationComponent) {
      this.paginationComponent.resetToFirstPage();
    }
    this.updateQueryParams();
  }

  /**
   * This function is used for the filter functionality
   * @param event -The filter change event, which contains the filter name and selected values.
   */
  onFilterChange(event: any) {
    const filterName = event.filterName;
    if (filterName === 'type') {
      this.filters.current.type = event.values;
      // Clear filter button action when type filter is applied
      this.filters.activeFilterButton = '';
      this.filters.status = ''
    } else if (filterName === 'status') {
      this.filters.status = event.values;
      // Clear filter button action when status filter is applied
      this.filters.activeFilterButton = '';
    }
    this.pagination.currentPage = 0;
    if(this.paginationComponent) {
      this.paginationComponent.resetToFirstPage();
    }
    this.updateQueryParams();
  }

  /**
   * This function is used for the sorting functionality
   * @param event - An object containing the `sort_by` field to be sorted and the `sort_order`
   * (either 'asc' for ascending or 'desc' for descending) as emitted by the child component.
   */
  onSortOptionsChanged(event: { sort_by: string, sort_order: string }) {
    this.sortOptions = event;
    this.pagination.currentPage = 0;
    this.paginationComponent.resetToFirstPage();
    this.updateQueryParams();
  }

  /**
   * This function is used to call the resourcelist api using the pageStatus along with the listType
   */
  getList() {
    let listType: keyof typeof RESOURCE_URLS.ENDPOINTS = 'RESOURCE_LIST';
    switch (this.pageStatus) {
      case 'drafts':
      case 'submitted_for_review':
        listType = 'RESOURCE_LIST';
        break;
      case 'up_for_review':
        listType = 'UP_FOR_REVIEW_LIST';
        break;
      case 'browse_existing':
        listType = 'BROWSE_EXISTING_LIST';
        break;
    }
    this.resourceService.getResourceList(this.pagination, this.filters, this.sortOptions, this.pageStatus,listType).subscribe(response => {
      this.handleResponse(response);
    });
  }

  /**
   * This functions used to call the resourcelist api response
   * @param response -resourcelist api response
   */
  handleResponse(response: any) {
    const result = response.result || { data: [], count: 0, changes_requested_count: 0 };
    this.lists = this.addActionButtons(result.data);
    this.filters.filteredLists = this.lists;
    this.pagination.totalCount = result.count;
    if (this.lists.length === 0) {
      this.noResultMessage = this.filters.search ? "NO_RESULT_FOUND" : this.noResultFound;
      if (this.pagination.currentPage > 0) {
        this.pagination.currentPage -= 1;
      }
    }
    this.filters.changeReqCount = result.changes_requested_count;
    this.filters.inprogressCount = result.in_progress_count;
  }

  /**
   * This functions is used to add buttons from json to resourcelist api response
   * @param cardItems - this is resourcelist item
   * @returns cardItems with the buttons for each item
   */
  addActionButtons(cardItems: any): any {
    if (!this.buttonsData) {
      return cardItems;
    }
    cardItems.forEach((cardItem: any) => {
      cardItem.actionButton = [];
      if (this.buttonsData) {
        this.buttonsData.some((button: any) => {
          if (this.buttonsCSS[button]) {
            cardItem.actionButton.push(this.buttonsCSS[button]);
          }
          if (button.buttons) {
            if(button.status === cardItem.status){
              if(cardItem.is_under_edit){
                this.applyButtons({
                  "buttons": [
                      "RESUME_EDITING",
                  ]
              }, cardItem);
              }else{
                this.applyButtons(button, cardItem);
              }
              return true;
            }else if(button.status === cardItem.review_status){
              this.applyButtons(button, cardItem);
              return true;
            }
          }
          return false;
        });
      }
    });
    return cardItems;
  }

applyButtons(button: any, cardItem: any, clearExisting: boolean = false): void {
  if (clearExisting) {
    cardItem.actionButton = [];
  }
  button.buttons.forEach((btn: string) => {
    if (btn) {
      cardItem.actionButton.push(this.buttonsCSS[btn]);
    }
  });
}

  /**
   * This function is used to updates the queryparams to route as per params passing through the api call
   * the resourcelist api with updatedqueryparams from routes
   */
  updateQueryParams() {
    const queryParams = this.commonService.generateParams(this.pagination, this.filters, this.sortOptions);
    this.commonService.updateQueryParams(queryParams);
  }

  /**
   * This function is used to call the api response with queryparams present in the router
   * the resourcelist api using applied queryparams
   */
  getQueryParams() {
    this.route.queryParams.subscribe(params => {
      this.commonService.applyQueryParams(params, this.pagination, this.filters, this.sortOptions);
      this.getList();
      this.areQueryParamsEmpty = Object.keys(params).length === 0;
    });
  }

  /**
   * This functions is used to add the buttons click event as per its label it will call the actions
   * @param event -listresource api response.
   * event click action for each label
   */
  statusButtonClick(event: { label: string, item: any }) {
     const { label, item } = event;
     switch (label) {
       case 'EDIT':
       case 'RESUME_EDITING':
        if(item.review_status == reviewStatus.REQUEST_FOR_CHANGES && this.activeRole == "creator"){
          this.router.navigate([PROJECT_DETAILS_PAGE], {
            queryParams: {
              projectId: item.id,
              mode: projectMode.REQUEST_FOR_EDIT,
              parent:"review"
            }
          });
          break;
        }else{
          this.router.navigate([PROJECT_DETAILS_PAGE], {
            queryParams: {
              projectId: item.id,
              mode: projectMode.EDIT,
              parent:"draft"
            }
          });
          break;
        }

       case 'DELETE':
         this.confirmAndDeleteProject(item)
         break;
       case 'VIEW':
         if(item.status == resourceStatus.SUBMITTED && this.activeRole == "creator"){
           this.router.navigate([PROJECT_DETAILS_PAGE], {
             queryParams: {
               projectId: item.id,
               mode: projectMode.VIEWONLY,
               parent:"review"
             }
           });
           break;
         }else if(item.status == resourceStatus.SUBMITTED && this.activeRole == "reviewer"){
           this.router.navigate([PROJECT_DETAILS_PAGE], {
             queryParams: {
               projectId: item.id,
               mode: projectMode.REVIEWER_VIEW,
               parent:"up-for-review"
             }
           });
           break;
         }else if(item.review_status  == reviewStatus.CHANGES_UPDATED && this.activeRole == "reviewer"){
          this.router.navigate([PROJECT_DETAILS_PAGE], {
            queryParams: {
              projectId: item.id,
              mode: projectMode.REVIEWER_VIEW,
              parent:"up-for-review"
            }
          });
          break;
        }else if(item.review_status == reviewStatus.REQUEST_FOR_CHANGES && this.activeRole == "creator"){
          this.router.navigate([PROJECT_DETAILS_PAGE], {
            queryParams: {
              projectId: item.id,
              mode: projectMode.CREATOR_VIEW,
              parent:"review"
            }
          });
          break;
         }
         else if(item.review_status == reviewStatus.CHANGES_UPDATED && this.activeRole == "creator" ){
          this.router.navigate([PROJECT_DETAILS_PAGE], {
            queryParams: {
              projectId: item.id,
              mode: projectMode.VIEWONLY,
              parent:"review"
            }
          });
          break;
        }else if(item.status && this.activeRole == "creator"){
           this.router.navigate([PROJECT_DETAILS_PAGE], {
             queryParams: {
               projectId: item.id,
               mode: projectMode.VIEWONLY,
               parent:"review"
             }
           });
           break;
         }else if(item.status){  
          this.router.navigate([PROJECT_DETAILS_PAGE], {
            queryParams: {
              projectId: item.id,
              mode: projectMode.VIEWONLY,
            }
          });
          break;  
         }else{
          this.router.navigate([PROJECT_DETAILS_PAGE], {
            queryParams: {
              projectId: item.id,
              mode: projectMode.COPY_EDIT,
              parent:"browse-existing"
            }
          });
          break;
         }

       case 'START_REVIEW':
        this.utilService.startOrResumeReview(item.id).subscribe((data)=>{})
         this.router.navigate([PROJECT_DETAILS_PAGE], {
           queryParams: {
             projectId: item.id,
             mode: projectMode.REVIEW,
             parent:"up-for-review"
           }
         });
         break;
       case 'RESUME_REVIEW':
         this.router.navigate([PROJECT_DETAILS_PAGE], {
           queryParams: {
             projectId: item.id,
             mode: projectMode.REVIEW,
             parent:"up-for-review"
           }
         })
         break;
       default:
         break;
     }
   }

  /**
   * This functions is used to call the buttons in the filter ui and as per the button-label it will call the actions
   * @param event - this is filter button click event
   */
  filterButtonClickEvent(event : { label: string }) {
    if(this.filters.activeFilterButton === event.label) {
      this.filters.activeFilterButton = '';
      this.filters.status = '';
    } else {
      this.filters.activeFilterButton = event.label;
      this.filters.status = event.label;
    }
    this.pagination.currentPage = 0;
    if(this.paginationComponent) {
    this.paginationComponent.resetToFirstPage();
     }
    this.updateQueryParams();
  }

  /**
   * This functions is used for the infoicon click
   * @param event - onclicking the event is calling data in the card
   * @return resourcelist api response on infoiconclick for each item
   */
  infoIconClickEvent(event: any) {
    const cardItem = event.item;

    //to get field data from listapi to map in json
    const getFieldData = (field: any) => {
      let value = cardItem[field.name] || '';
      if (field.name.includes('organization')) {
        value = cardItem.organization ? cardItem.organization.name : '';
      } else if (this.commonService.isISODate(value)) {
        value = this.datePipe.transform(value, 'dd/MM/yyyy');
      }
      return {
        label: field.label,
        value: value
      };
    };

    // Function to filter and map fields based on conditions
    const filterAndMapFields = (status: string | null) => {
      return this.infoFieldsData
        .filter((field: any) => field.status === status || !field.status)
        .map(getFieldData);
    };

    //info fields to display as per the review_status
    let infoFields = [];
    if (!cardItem.review_status && (cardItem.status === resourceStatus.SUBMITTED || cardItem.status === 'IN_REVIEW')) {
      infoFields = filterAndMapFields('NOT_STARTED');
    } else if(cardItem.review_status === 'INPROGRESS' && cardItem.status === 'IN_REVIEW') {
      infoFields = filterAndMapFields('IN_REVIEW');
    } else {
      infoFields = filterAndMapFields(cardItem.review_status);
    } 
    
    // If no fields match the conditions, default to 'NOT_STARTED' fields
    if (infoFields.length === 0) {
      infoFields = filterAndMapFields('NOT_STARTED');
    }
    if(!cardItem.review_status) {
      infoFields = filterAndMapFields(cardItem.status);
    } 

    const dialogRef = this.dialog.open(DialogPopupComponent, {
      width: '39.375rem',
      data: {
        header: "DETAILS",
        fields: infoFields
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      return result ? true : false;
    });
  }

  /**
   * This functions delete the resource using delete resource api.
   * @param item - listresource api response.
 */
  deleteProject(item: any) {
    this.libProjectService.deleteProject(item.id).subscribe((response : any) => {
      if (this.lists.length === 1 && this.pagination.currentPage > 0) {
        this.pagination.currentPage -= 1;
      }
      this.toastService.openSnackBar({
        "message": 'RESOURCE_DELETED_SUCCESSFULLY',
        "class": "success"
      })
      if(this.paginationComponent) {
      this.paginationComponent.setToPage(this.pagination.currentPage);
    }
    this.getList();
    this.updateQueryParams();
    })
  }

  /**
   * This functions is used to open dialog popup on clicking delete button on carditem
   * @param item -this is resourcelist item
   * @return open the dialogpopup to delete the resource
   */
  confirmAndDeleteProject(item: any) {
    const dialogRef = this.dialog.open(DialogPopupComponent, {
      width: '39.375rem',
      disableClose: true,
      data : {
        header: "DELETE_RESOURCE",
        content:"CONFIRM_DELETE_MESSAGE",
        cancelButton:"CANCEL",
        exitButton:"DELETE"
      }
      });

      dialogRef.afterClosed().subscribe(result => {
        if(result.data === "CANCEL"){
          return true
        } else if(result.data === "DELETE"){
          this.deleteProject(item);
          return true
        } else {
          return false
        }
      });
  }


  navigateToCreateNew() {
    this.router.navigate(['home/create-new'], {})
  }

}
