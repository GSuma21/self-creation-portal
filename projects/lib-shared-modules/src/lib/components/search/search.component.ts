import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-search',
  standalone: true,
  imports: [MatButtonModule,MatFormFieldModule,MatIconModule,MatInputModule,FormsModule,ReactiveFormsModule, TranslateModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  @Input()  minLength:any = 3
  @Input() maxLength: number = 250;
  @Output() searchEvent = new EventEmitter<any>();
  @Input() placeHolder:string = 'SEARCH_LIBRARY'
  searchControl = new FormControl('');
  constructor() {
    // debounce timer for search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
      .subscribe(newValue => {
        this.onSearch(newValue)
      });
  }
   onSearch(searchText:any){
    if (searchText?.length >= this.minLength || !searchText) {
      this.searchEvent.emit(searchText);
    }
  }
}
