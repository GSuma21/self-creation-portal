import { CommonModule } from '@angular/common';
import { AfterContentInit, AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import 'quill/dist/quill.snow.css';
import { FormService } from '../../services/form/form.service';
import { ToastService, UtilService } from '../../../public-api';
import { interval, Subscription } from 'rxjs';




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
  @Output() comment = new EventEmitter<String>();
  private subscription: Subscription = new Subscription();
  value: any;
  resolveDisable:boolean = false;
  chatFlag: boolean = true;

  @ViewChild('editor') editor:any;
  @ViewChild('chatWindow') private chatWindow!: ElementRef;

  name = 'Angular';
  currentUserId:number = 25;
  modules = {
    formula: true,
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      ['formula'],
      [{ 'font': [] }],
      ['image', 'code-block']
    ]
  };
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
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ 'font': [] }],
      ],

    }
  }

  constructor(private utilService:UtilService,private toastService:ToastService) {
    this.autoSave()
   }

  ngOnInit() {
    this.userId = localStorage.getItem('id');
    this.checkCommentIsDraftAndResolvable();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  test=(event:any)=>{
    // console.log(event.keyCode);
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
    if(this.chatFlag && this.messages){
      this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
    }
  }

  openChatBot() {
    this.chatFlag=!this.chatFlag;
  }


  saveComment(closeChatBox:boolean = false) {
    if (closeChatBox) {
      this.chatFlag = !this.chatFlag;
    }
    this.quillInput = this.quillInput
      .replace(/>\s+([^\s])/, '>$1')  // Trim leading whitespace after the opening tag content
      .replace(/\s+(<\/\w+>)$/, '$1')// Trim trailing whitespace before the closing tag content
      .trim();  // Just in case there are spaces outside the tags
    this.comment.emit(this.quillInput)
    this.commentPayload.parent_id = this.messages.length > 0 ? this.messages[this.messages.length - 1].id : 0;
    if (this.draft && this.quillInput.replace(/<\/?[^>]+>/gi, '').trim().length > 0) {
      this.draft.text = this.quillInput;
      if (this.draft.id) {
        this.utilService.updateComment(this.resourceId, this.draft, this.draft.id).subscribe((res) => console.log(res));
      }
    }
    else if (this.quillInput.replace(/<\/?[^>]+>/gi, '').trim().length > 0) {
      this.commentPayload.text = this.quillInput;
      this.utilService.updateComment(this.resourceId, this.commentPayload).subscribe((res: any) => {
        this.draft = res.result;
      });
    }
    this.commentPayload.comment = this.quillInput;
  }

  ngOnDestroy(): void {
  this.subscription.unsubscribe();
    if(this.quillInput.replace(/<\/?[^>]+>/gi, '').trim().length > 0 && this.utilService.saveComment) {
      this.saveComment();
    }
  }

}
