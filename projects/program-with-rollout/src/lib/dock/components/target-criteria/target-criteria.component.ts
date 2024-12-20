import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { FilterComponent, FormService, SideNavbarComponent, TARGET_CRITERIA_DETAILS } from 'lib-shared-modules';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatSort, MatSortModule} from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatTabsModule} from '@angular/material/tabs';

@Component({
  selector: 'lib-target-criteria',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, SideNavbarComponent, MatIconModule,MatDialogModule, MatTableModule, MatSortModule, MatPaginatorModule, MatCheckboxModule,MatTabsModule, FilterComponent, TranslateModule ],
  templateUrl: './target-criteria.component.html',
  styleUrl: './target-criteria.component.scss'
})

export class TargetCriteriaComponent implements OnInit{

    criteria:any;
    //  [
    //     {
    //         label:"Location",
    //         form:[
    //             {
    //                 placeHolder:"Choose State",
    //                 isMultiple:false,
    //                 label:"State",
    //                 meta:{
    //                     url:"GET_ENTITIES_LIST",
    //                     type:"state",
    //                     dependantIndex:[1,2]
    //                 },
    //                 options:[]
    //             },
    //             {
    //                 placeHolder:"Role",
    //                 isMultiple:false,
    //                 label:"Select Target",
    //                 meta:{
    //                     url:"GET_ENTITY_ROLES",
    //                     type:"role"
    //                 },
    //                 options:[]
    //             },
    //             {
    //                 placeHolder:"Choose Entity targetting",
    //                 isMultiple:false,
    //                 meta:{
    //                     url:"GET_ENTITY_HIERARCHY",
    //                     type:"hierarchy"
    //                 },
    //                 label:"Entity Targeting",
    //                 options:[]
    //             }
    //         ]
    //     },
    //     {
    //         label:"Gender",
    //         form:[
    //             {
    //                 placeHolder:"Select Gender",
    //                 isMultiple:true,
    //                 label:"Gender",
    //                 meta:{
    //                     type:"gender"
    //                 },
    //                 options:[
    //                     {
    //                         "_id": "male",
    //                         "name": "Male",
    //                         "externalId": "enf3"
    //                     },
    //                     {
    //                         "_id": "female",
    //                         "name": "Female",
    //                         "externalId": "enkhfjg"
    //                     }
    //                 ]
    //             }
    //         ]
    //     }
    // ]
    criteriaFilters:any = [];
    formData:any = {};
    displayedColumns: string[] = ['select','block'];
    dataSource: MatTableDataSource<any>;
    selection = new SelectionModel<any>(true, []);
    targetEntityArray = [];
    targetedEntity:string = ''
    @ViewChild(MatPaginator)
    paginator!: MatPaginator;
    @ViewChild(MatSort)
    sort!: MatSort;

    constructor(public dialogRef: MatDialogRef<TargetCriteriaComponent>, @Inject(MAT_DIALOG_DATA) public dialogData: any, private formService:FormService) {
        // Assign the data to the data source for the table to render
        this.dataSource = new MatTableDataSource();
    }

    ngOnInit(): void {
        this.getTargetCriteriaDetails()
    }

    getTargetCriteriaDetails(){
        this.formService.getForm(TARGET_CRITERIA_DETAILS).subscribe((data:any) => {
            this.criteria = data.result.data.fields?.controls
            this.formService.getEntitiesList("GET_ENTITIES_LIST","state").subscribe((res:any)=> {
                this.criteria[0].form[0].options = res.result;
            })
          });
    }

    setFormData(event:any,key:any,formElementIndex:number) {
        this.selection.clear();
        if(key) {
            this.formData[key] = event.value;
        }
        // if(key.meta.dependantIndex) {
        //     key.meta.dependantIndex.forEach((index:string|number)=>{
        //         this.formService.getEntitiesList(this.criteria[0].form[index].meta.url,this.criteria[0].form[index].meta.type, key.meta.type == 'hierarchy'? '': this.formData.state).subscribe((res:any)=>{
        //             this.criteria[0].form[index].options = res.result;
        //         })
        //     })
        // }
        if(key == 'state') {
            this.formService.getEntitiesList(this.criteria[0].form[1].meta.url,'',this.formData.state).subscribe((res:any)=>{
                this.criteria[0].form[1].options = res.result;
            })
            this.formService.getEntitiesList(this.criteria[0].form[2].meta.url,'','').subscribe((res:any)=>{
                this.targetEntityArray = res.result[0].childHierarchyPath;
                this.criteria[0].form[2].options = res.result[0].childHierarchyPath.map((element:string) => {
                    return {
                        _id:element,
                        value:element,
                        name:element
                    }
                });
            })
        }
        if(key == 'hierarchy') {
            if(event.value == 'state') {
                this.dataSource = new MatTableDataSource(this.criteria[0].form[0].options);
                return;
            }
            this.targetedEntity = event.value;
            this.criteriaFilters = [];
            for(let index=1;this.targetEntityArray[index]!= event.value;index++) { // index starts 1 to skip state fetching
                this.criteriaFilters.push({
                    placeHolder:`select ${this.targetEntityArray[index]}`,
                    isMultiple:false,
                    meta:{
                        url:"GET_SUB_ENTITIES_LIST",
                        type:this.targetEntityArray[index]
                    },
                    label:this.targetEntityArray[index],
                    option:[],
                    value:this.targetEntityArray[index]
                })
            }
            // this.formService.getEntitiesListAsType('GET_SUB_ENTITIES_LIST',this.targetEntityArray[1],this.formData.state).subscribe((res:any)=>{
            //     this.criteriaFilters[formElementIndex].options = res.result.data;
            // })
            for(let index=0;index < this.criteriaFilters.length;index++) { // index starts 1 to skip state fetching
                this.formService.getEntitiesListAsType('GET_SUB_ENTITIES_LIST',this.criteriaFilters[index].value,this.formData.state).subscribe((res:any)=>{
                    this.criteriaFilters[index].option = res.result.data;
                })
            }
            this.formService.getEntitiesListAsType("GET_SUB_ENTITIES_LIST",event.value,this.formData.state).subscribe((res:any) => {
                this.dataSource = new MatTableDataSource(res.result.data);
            })
        }
        if(key != 'role' && key != 'hierarchy' && key != 'state') {
            this.formService.getEntitiesListAsType("GET_SUB_ENTITIES_LIST",this.targetEntityArray[formElementIndex-1],event.value).subscribe((res:any) => {
                this.dataSource = new MatTableDataSource(res.result.data);
            })
        }
        console.log(this.formData);
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    onFilterChange(event:any) {
        console.log(event,this.selection);
        this.formService.getEntitiesListAsType("GET_SUB_ENTITIES_LIST",event.filterName,event.values[0]).subscribe((res:any) => {
            this.dataSource = new MatTableDataSource(res.result.data);
        })
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    toggleAllRows() {
    if (this.isAllSelected()) {
        this.selection.clear();
        return;
    }

    this.selection.select(...this.dataSource.data);
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: any): string {
    if (!row) {
        return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
    }

    closeDialog() {
        this.formData[this.targetedEntity] = this.selection.selected;
        this.dialogRef.close();
    }


    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
        }
    }
}
