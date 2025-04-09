import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { HttpProviderService } from './services/http-provider.service';
import { LOGOUT_URLS } from './configs/url.config.json';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from './services/toast/toast.service';
import { SUBMITTED_FOR_REVIEW, UP_FOR_REVIEW, DRAFTS, BROWSE_EXISTING, ROLL_OUT, PROGRAM_RESOURCES, solutionModes } from './constants/urlConstants';
import { Subject } from 'rxjs';
import { IndexDbService } from './services/index-db/index-db.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogPopupComponent } from './components/dialogs/dialog-popup/dialog-popup.component';
import { UtilService } from './services/util/util.service';




@Injectable({
  providedIn: 'root'
})
export class LibSharedModulesService {

  private previousUrl !: string;
  // Subjects to manage saving comment events
  private saveCommentSubject = new Subject<void>();
  private saveCommentCompletedSubject = new Subject<void>();

  constructor( private router : Router, private location : Location, private httpService: HttpProviderService,private _snackBar:MatSnackBar,private translateService: TranslateService,private toastService:ToastService, private route:ActivatedRoute,private indexDb:IndexDbService,   private dialog: MatDialog,private utilService: UtilService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.previousUrl = event.url;
      }
    });
  }

  goBack(): void {
    const navigation = history.state;
    const state = this.route.snapshot.queryParamMap.get('parent')
    const solutionId = this.route.snapshot.queryParamMap.get('projectId')
                ?? this.route.snapshot.queryParamMap.get('programId');

    switch (state) {
      case 'create':
        if(solutionId){
          this.router.navigate([DRAFTS]);
        }else{
          this.router.navigate(['../'], { relativeTo: this.route });
        }
        if (this.route.snapshot.queryParamMap.get('projectId')) {
          this.toastService.openSnackBar({
            message: 'YOUR_RESOURCE_HAS_BEEN_SAVED_AS_DRAFT',
            class: 'success',
          });
        }else if(this.route.snapshot.queryParamMap.get('programId')){
          this.toastService.openSnackBar({
            message: 'YOUR_PROGRAM_HAS_BEEN_SAVED_AS_DRAFT',
            class: 'success',
          });
        }
        break;
      case 'draft':
        this.router.navigate([DRAFTS]);
        if (this.route.snapshot.queryParamMap.get('projectId')) {
          this.toastService.openSnackBar({
            message: 'YOUR_RESOURCE_HAS_BEEN_SAVED_AS_DRAFT',
            class: 'success',
          });
        }else if(this.route.snapshot.queryParamMap.get('programId')){
          this.toastService.openSnackBar({
            message: 'YOUR_PROGRAM_HAS_BEEN_SAVED_AS_DRAFT',
            class: 'success',
          });
        }
        break;
      case 'review':
        this.router.navigate([SUBMITTED_FOR_REVIEW]);
        break;
      case 'up-for-review':
        this.router.navigate([UP_FOR_REVIEW]);
        break;
      case 'browse-existing':
        this.router.navigate([BROWSE_EXISTING]);
        break;
      case 'roll-out':
        this.router.navigate([ROLL_OUT]);
        break;
      case 'program-resources':
        if (this.route.snapshot.queryParamMap.get('programResourceId') && (this.route.snapshot.queryParamMap.get('mode') == solutionModes.META_REQUEST_FOR_EDIT || this.route.snapshot.queryParamMap.get('mode') == solutionModes.META_EDIT)) {
          this.toastService.openSnackBar({
            message: 'CHANGES_SAVED_SUCCESSFULLY',
            class: 'success',
          });
        }
        if(this.route.snapshot.queryParamMap.get('mode') == solutionModes.META_REVIEW) {
          this.router.navigate([PROGRAM_RESOURCES],{ queryParams: { parent: this.route.snapshot.queryParamMap.get('topLevelParent'), programId: this.route.snapshot.queryParamMap.get('programId'), mode: this.route.snapshot.queryParamMap.get('parentMode')}, state:{programErrors : navigation.programErrors ? navigation.programErrors :""}});
        }
        else if(this.route.snapshot.queryParamMap.get('mode') == solutionModes.VIEWONLY || this.route.snapshot.queryParamMap.get('mode') == solutionModes.REVIEWER_VIEW || this.route.snapshot.queryParamMap.get('mode') == solutionModes.CREATOR_VIEW){
          this.router.navigate([PROGRAM_RESOURCES],{ queryParams: { parent: this.route.snapshot.queryParamMap.get('topLevelParent'), programId: this.route.snapshot.queryParamMap.get('programId'), mode: this.route.snapshot.queryParamMap.get('parentMode')}, state:{programErrors : navigation.programErrors ? navigation.programErrors :""}});
        }
        else if (this.route.snapshot.queryParamMap.get('mode') == solutionModes.META_REQUEST_FOR_EDIT) {
          this.router.navigate([PROGRAM_RESOURCES],{ queryParams: { parent: this.route.snapshot.queryParamMap.get('topLevelParent') ? this.route.snapshot.queryParamMap.get('topLevelParent') : 'draft', programId: this.route.snapshot.queryParamMap.get('programId'), mode: solutionModes.REQUEST_FOR_EDIT }, state:{programErrors : navigation.programErrors ? navigation.programErrors :""}});
        }
        else {
          this.router.navigate([PROGRAM_RESOURCES],{ queryParams: { parent:this.route.snapshot.queryParamMap.get('topLevelParent') ? this.route.snapshot.queryParamMap.get('topLevelParent') : 'draft', programId: this.route.snapshot.queryParamMap.get('programId'), mode: this.route.snapshot.queryParamMap.get('parentMode') ? this.route.snapshot.queryParamMap.get('parentMode') :solutionModes.EDIT }, state:{programErrors : navigation.programErrors ? navigation.programErrors :""}});
        }
        break;
      default:
        this.router.navigate(['../'], { relativeTo: this.route });
        break;
    }
  }


  logout(): void {
    const body = {
      refresh_token: localStorage.getItem('refToken')
    };
    const config = {
      url:  LOGOUT_URLS.LOGOUT_API,
      payload: body
    };

    this.httpService.post(config.url, config.payload).subscribe(
      response => {
        this.utilService.clearLanguage();
        this.indexDb.clearObjectStore();
        this.toastService.openSnackBar({
          message: 'LOGOUT_SUCCESSFULL_MESSAGE',
          class: 'success',
        });
        this.navigateToLogin();
      },
      error => {
        console.error('Logout failed', error);
      }
    );
  }



  navigateToLogin(): void {
    localStorage.clear();
    this.indexDb.initDB();
    this.router.navigate(['login']);
  }

  openErrorToast(message:any) {
      let data = {
        "message":message,
        "class":"error",
      }
     this.toastService.openSnackBar(data)
  }

  triggerSaveComment() { //Method to trigger the save comment event.
    this.saveCommentSubject.next();
  }

   /**
   * Returns an observable that subscribers can use to listen for the save comment event.
   *
   * This allows external components to subscribe and know when the `triggerSaveComment` method is called.
   */
  getSaveCommentObservable() {
    return this.saveCommentSubject.asObservable();
  }

  notifySaveCommentCompleted() { //Method to notify that the save comment process has been completed.
    this.saveCommentCompletedSubject.next();
  }

   /**
   * Returns an observable that subscribers can use to listen for the comment save completion event.
   * This allows external components to subscribe and know when `notifySaveCommentCompleted` is called,
   * indicating the comment has been saved.
   */
  getSaveCommentCompletedObservable() {
    return this.saveCommentCompletedSubject.asObservable();
  }


}
