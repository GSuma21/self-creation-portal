import { CommonModule } from '@angular/common';
import { AfterContentInit, AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import 'quill/dist/quill.snow.css';
import { FormService } from '../../services/form/form.service';
import { LibSharedModulesService, ToastService, UtilService } from '../../../public-api';
import { interval, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';




@Component({
  selector: 'lib-comments-box',
  standalone: true,
  imports: [CommonModule,MatIconModule,MatButtonModule,FormsModule,
    QuillEditorComponent,TranslateModule],
  templateUrl: './comments-box.component.html',
  styleUrl: './comments-box.component.scss'
})
export class CommentsBoxComponent implements OnInit, OnDestroy {
  userId:any = 0;
  @Input() mode:string='';
  @Input() commentPayload:any;
  @Input() resourceId:string|number = '';
  @Input() messages:any;
  programId:string = '';
  @Output() comment = new EventEmitter<String>();
  private subscription: Subscription = new Subscription();
  value: any;
  resolveDisable:boolean = false;
  chatFlag: boolean = true;

  @ViewChild('editor') editor:any;
  @ViewChild('chatWindow') private chatWindow!: ElementRef;

  name = 'Angular';
  currentUserId:number = 25;
  quillInput =""
  hasFocus = false;
  subject: any;
  draft:any = '';


  quillConfig={
    //toolbar: '.toolbar',
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],    // Bold, Italic, Underline
        [{ 'list': 'bullet' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'font': [] }],
      ],

    }
  }

  constructor(private utilService:UtilService,private toastService:ToastService, private sharedService:LibSharedModulesService, private route: ActivatedRoute,private sanitizer: DomSanitizer) {
    this.autoSave()
   }

  ngOnInit() {
    this.userId = localStorage.getItem('id');
    this.checkCommentIsDraftAndResolvable();
    this.subscription.add(
      this.sharedService. getSaveCommentObservable().subscribe(() => { // When the `getSaveCommentObservable()` observable emits, it will call `triggerSaveComment()`to handle the save operation.
        this.triggerSaveComment() // Triggers the comment save process
      })
    )
    this.subscription.add(
      this.route.queryParams.subscribe((res:any) => {
        this.programId = res.programId;
    }))
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  test=(event:any)=>{
    // console.log(event.keyCode);
  }

  triggerSaveComment(){
    if(this.quillInput){
      // Call saveComment() and handle the promise
      this.saveComment().then((res) => {
          this.subscription.add(
            this.sharedService.notifySaveCommentCompleted()
          )
      }).catch((error) => {
        console.error('Error saving comment:', error);
      });
    }else{
       // If there's no input, directly notify that saving is complete
      this.subscription.add(
        this.sharedService.notifySaveCommentCompleted()
      )
    }
  }

  autoSave(){
    this.subscription.add(
      interval(30000).subscribe(() => {
        this.saveComment();
      })
    );
  }

  onSelectionChanged = (event:any) =>{
    if(event.oldRange == null){
      this.onFocus();
    }
    if(event.range == null){
      this.onBlur();
    }
  }


  onFocus = () =>{}
  onBlur = () =>{}

  checkCommentIsDraftAndResolvable() {
    if(this.messages?.length) {
      this.quillInput = this.messages[this.messages.length-1]?.status == "DRAFT" ? this.messages[this.messages.length-1].text : '';
      this.draft = this.quillInput.length > 0 ? this.messages.pop() : '';
      if(this.messages[this.messages.length-1]?.resolver && Object.keys(this.messages[this.messages.length-1].resolver).length > 0) {
        this.resolveDisable = true;
      }
    }
  }

  resolveComment() {
    this.utilService.updateComment(this.resourceId,{...this.messages[this.messages.length-1],...{status:"RESOLVED"}},this.messages[this.messages.length-1].id).subscribe((res:any) =>{
      this.toastService.openSnackBar({
        message : res.message,
        class : 'success'
      })
      this.resolveDisable = true;
    });
  }

  scrollToBottom(): void {
    if(this.chatFlag && this.messages.length > 0){
      this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
    }
  }

  openChatBot() {
    this.chatFlag=!this.chatFlag;
  }

  /**
 * Method to save a comment. It handles the following:
 * - Toggles the chat box visibility (based on the `closeChatBox` flag).
 * - Cleans up the `quillInput` by removing unwanted whitespace around HTML tags.
 * - Emits the cleaned comment input via the `comment` event emitter.
 * - Determines if the comment is a new comment or an update to a draft, and calls the appropriate service method.
 * - Handles draft deletion if the input is empty.
 */
  saveComment(closeChatBox: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
      if (closeChatBox) {
        this.chatFlag = !this.chatFlag;
      }
      // Clean up the quillInput content by removing unnecessary whitespace inside HTML tags
      this.quillInput = (this.quillInput !== null) ? this.quillInput
        .replace(/>\s+([^\s])/, '>$1')  // Trim leading whitespace after the opening tag content
        .replace(/\s+(<\/\w+>)$/, '$1')// Trim trailing whitespace before the closing tag content
        .trim() : this.quillInput;  // Just in case there are spaces outside the tags
      this.commentPayload.parent_id = this.messages.length > 0 ? this.messages[this.messages.length - 1].id : 0;
        if (this.quillInput !== null) {
        if (Object.keys(this.draft).length !== 0 && this.quillInput.replace(/<\/?[^>]+>/gi, '').trim().length > 0) {
          if (this.draft.id) {
            this.draft.text = this.quillInput;
            this.utilService.updateComment(this.resourceId, this.draft, this.draft.id).toPromise().then((res) => {
              this.comment.emit(this.quillInput);
              resolve(true);
            }).catch((error) => {
              reject(error);
            });
          }
        } else if (this.quillInput.replace(/<\/?[^>]+>/gi, '').trim().length > 0) {
          this.commentPayload.text = this.quillInput;
          this.utilService.updateComment(this.resourceId, this.commentPayload).toPromise().then((res: any) => {
            this.utilService.getCommentList(this.resourceId).toPromise().then((commentListRes: any) => {
              commentListRes.result?.comments.slice().reverse().forEach((comment: any) => {
                if (comment.status === "DRAFT" && comment.page == this.commentPayload.page) {
                  this.draft = comment;
                }
              });
              this.comment.emit(this.quillInput);
              resolve(true);
            }).catch((error) => {
              reject(error);
            });
          }).catch((error) => {
            reject(error);
          });
        }
      } else if (this.quillInput === null) {
        if (this.draft.id) {
          this.utilService.deleteComment(this.draft.id, this.resourceId).toPromise().then((res: any) => {
            this.draft = {}
            this.comment.emit(this.quillInput);
            resolve(true);
          }).catch((error) => {
            reject(error);
          });
        } else {
          this.draft = {}
          this.comment.emit(this.quillInput);
          resolve(true);
        }
      }
      this.commentPayload.comment = this.quillInput;
    });
  }

  sanitiseInput(message:any){
    return  this.sanitizer.bypassSecurityTrustHtml(message)

  }

  ngOnDestroy(): void {
    if(this.mode == "metaReview" && this.programId) {
      this.sharedService.notifySaveCommentCompleted();
    }
    this.subscription.unsubscribe();
    if(this.utilService.saveComment){
      this.saveComment();
    }
  }

}
