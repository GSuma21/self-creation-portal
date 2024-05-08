import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent, CardComponent , SearchComponent} from 'lib-shared-modules';
import {MatCardModule} from '@angular/material/card';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';


interface Food {
  value: string;
  viewValue: string;
}
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,RouterOutlet,HeaderComponent,MatCardModule,CardComponent,SearchComponent,MatSelectModule,FormsModule, ReactiveFormsModule,MatFormFieldModule,MatAutocompleteModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  foods: Food[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'},
  ];
  toppings = new FormControl('');
  toppingList = ['Extra cheese', 'Mushroom', 'Onion', 'Pepperoni', 'Sausage', 'Tomato'];
  selectedToppings:any;


  list:any = 
    {
        "id": 4,
        "title": "sample project",
        "type": "project",
        "organization": {
            "id": 24,
            "name": "Tunerlabs",
            "code": "tl"
        },
        "status": "DRAFT",
        "actionButton":[{action:'VIEW',label:'View'},{ action:'EDIT',label:'Edit'}]
    }

    receiveSearchResults(event:any){}


    filterData :any = [
      {
        key:'type',
        label:'Type',
        type:'multiSelect',
        option:['project','observation']
      },
      {
        key:'sortBy',
        label:'Sort by',
        type:'singleSelect',
        option:['project','observation']
      },
    ]

  
}
