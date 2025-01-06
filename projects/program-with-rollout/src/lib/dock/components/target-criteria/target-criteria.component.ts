import { CommonModule, TitleCasePipe } from '@angular/common';
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
import { FilterComponent, FormService, SearchComponent, SideNavbarComponent, TARGET_CRITERIA_DETAILS } from 'lib-shared-modules';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatSort, MatSortModule} from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatTabsModule} from '@angular/material/tabs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'lib-target-criteria',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, SideNavbarComponent, MatIconModule,MatDialogModule, MatTableModule, MatSortModule, MatPaginatorModule, MatCheckboxModule,MatTabsModule, FilterComponent, TranslateModule,TitleCasePipe,SearchComponent ],
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
    placeHolder:string = 'Search target element';
    criteriaFilters:any = [];
    formData:any = {};
    filterSelectedValue:string = '';
    displayedColumns: string[] = ['name'];
    dataSource: MatTableDataSource<any>;
    selection = new SelectionModel<any>(true, []);
    targetEntityArray = [];
    targetedEntity:string = ''
    @ViewChild(MatPaginator)
    paginator!: MatPaginator;
    @ViewChild(MatSort)
    sort!: MatSort;
    tableColumns:string[] = []
    tableData:any = []; // to show the data in HTML Loop
    searchText:boolean = false;

    constructor(public dialogRef: MatDialogRef<TargetCriteriaComponent>, @Inject(MAT_DIALOG_DATA) public dialogData: any, private formService:FormService, private cdr:ChangeDetectorRef) {
        // Assign the data to the data source for the table to render
        this.dataSource = new MatTableDataSource();
    }

    ngOnInit(): void {
        this.getTargetCriteriaDetails();
        this.tableColumns = ['select', ...this.displayedColumns];
        if(this.dialogData) {
            this.formData = this.dialogData;
        }
    }

    getTargetCriteriaDetails(){
        this.formService.getForm(TARGET_CRITERIA_DETAILS).subscribe((data:any) => {
            this.criteria = data.result.data.fields?.controls
            this.formService.getEntitiesList("GET_ENTITIES_LIST","state").subscribe((res:any)=> {
                this.criteria[0].form[0].options = res.result;
                if(this.dialogData) { // this condition will check and add data to the form and table
                    this.getEntityAndRoles();
                    this.formService.getEntitiesListAsType("GET_SUB_ENTITIES_LIST",this.formData.entity_targeting.value,this.formData.state._id,1,5).subscribe((res:any) => {
                        this.insertDataIntoTable(res.result.data,res.result.count)
                        this.selection.clear();
                        this.formData[this.formData.entity_targeting.value].forEach((element:any) => {
                            this.selection.select(element);
                        })
                    })
                }
            })
          });
    }

    // tableColumns() {
    //     return ['select', ...this.displayedColumns];
    // }

    insertDataIntoTable(data:any,count?:number) {
        let newArray = data.map((element:any) => {
            delete element.label;
            delete element.externalId
            delete element.entityType
            delete element.value
            return element
        })
        this.displayedColumns = Object.keys(newArray[0]);
        this.tableColumns = ['select', ...this.displayedColumns].filter((element) => element != '_id');
        this.dataSource = new MatTableDataSource(newArray);
        this.paginator.length = count ? count : data.length;
    }

    getValueOfOption(value:string) {
        return this.formData[value];
    }

    setFormData(event:any,key:any,formElementIndex:number) {
        if(key !== "roles"){
            this.selection.clear();
        }
        if(key) {
            this.formData[key] = event.value;
        }
        // if(key.meta.dependantIndex) {
        //     key.meta.dependantIndex.forEach((index:string|number)=>{
        //         this.formService.getEntitiesList(this.criteria[0].form[index].meta.url,this.criteria[0].form[index].meta.type, key.meta.type == 'hierarchy'? '': this.formData.state._id).subscribe((res:any)=>{
        //             this.criteria[0].form[index].options = res.result;
        //         })
        //     })
        // }
        if(key == 'state') {
            this.getEntityAndRoles();
        }
        if(key == 'entity_targeting') {
            this.targetedEntity = event.value._id;
            this.criteriaFilters = [];
            for(let index=0;this.targetEntityArray[index]!= event.value._id;index++) { // index starts 1 to skip state fetching
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
            // this.formService.getEntitiesListAsType('GET_SUB_ENTITIES_LIST',this.targetEntityArray[1],this.formData.state._id).subscribe((res:any)=>{
            //     this.criteriaFilters[formElementIndex].options = res.result.data;
            // })
            for(let index=0;index < this.criteriaFilters.length;index++) { // index starts 1 to skip state fetching
                this.formService.getEntitiesListAsType('GET_SUB_ENTITIES_LIST',this.criteriaFilters[index].value,this.formData.state._id).subscribe((res:any)=>{
                    this.criteriaFilters[index].option = res.result.data;
                })
            }
            this.formService.getEntitiesList(this.criteria[0].form[2].meta.url,this.targetedEntity,this.formData.state._id).subscribe((res:any)=>{
                this.criteria[0].form[2].options = res.result;
            })
            this.formService.getEntitiesListAsType("GET_SUB_ENTITIES_LIST",event.value._id,this.formData.state._id,1,5).subscribe((res:any) => {
                this.insertDataIntoTable(res.result.data,res.result.count)
            })
        }
        if(key != 'roles' && key != 'entity_targeting' && key != 'state' && key != 'gender') {
            this.formService.getEntitiesListAsType("GET_SUB_ENTITIES_LIST",this.targetEntityArray[formElementIndex-1],event.value._id).subscribe((res:any) => {
                this.insertDataIntoTable(res.result.data)
            })
        }
        this.criteria = this.criteria;
    }

    getEntityAndRoles() {
        this.formService.getEntitiesList(this.criteria[0].form[1].meta.url,'',this.formData.state.externalId).subscribe((res:any)=>{
            this.targetEntityArray = res.result[0].childHierarchyPath;
            this.criteria[0].form[1].options = res.result[0].childHierarchyPath.map((element:string) => {
                return {
                    _id:element,
                    value:element,
                    name:element
                }
            });
            if(this.dialogData) {
                this.targetedEntity = this.formData.entity_targeting.value;
                this.criteriaFilters = [];
                for(let index=0;this.targetEntityArray[index]!= this.formData.entity_targeting.value;index++) { // index starts 1 to skip state fetching
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
                // this.formService.getEntitiesListAsType('GET_SUB_ENTITIES_LIST',this.targetEntityArray[1],this.formData.state._id).subscribe((res:any)=>{
                //     this.criteriaFilters[formElementIndex].options = res.result.data;
                // })
                for(let index=0;index < this.criteriaFilters.length;index++) {
                    this.formService.getEntitiesListAsType('GET_SUB_ENTITIES_LIST',this.criteriaFilters[index].value,this.formData.state._id).subscribe((res:any)=>{
                        this.criteriaFilters[index].option = res.result.data;
                    })
                }
            }
        })
        this.formService.getEntitiesList(this.criteria[0].form[2].meta.url,'',this.formData.state._id).subscribe((res:any)=>{
            this.criteria[0].form[2].options = res.result;
        })
        this.selection.changed.subscribe(() => {
            // Trigger change detection or additional updates if needed
            this.cdr.detectChanges(); // Ensure to inject `ChangeDetectorRef` if used
        });
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    onFilterChange(event:any) {
        console.log(event,this.selection);
        this.filterSelectedValue = event.values[0]
        this.formService.getEntitiesListAsType("GET_SUB_ENTITIES_LIST",this.targetedEntity,event.values[0],1,5).subscribe((res:any) => {
            this.insertDataIntoTable(res.result.data,res.result.count)
        })
    }

    compareObjects(o1: any, o2: any): boolean {
        return o1 && o2 ? o1._id === o2._id : o1 === o2;
    }

    checkIsRowAvailable(row:any) {
        if(this.formData[this.formData.entity_targeting.value]) {
            return this.formData[this.formData.entity_targeting.value].some((obj:any) => JSON.stringify(obj) === JSON.stringify(row));
        }
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
            this.formData[this.formData.entity_targeting.value] = [];
            return;
        }
        this.formData[this.formData.entity_targeting.value] = this.dataSource.data;
        this.selection.select(...this.dataSource.data);
    }

    /**
     * This function is used for the search functionality
     * @param event - The search event which contains the searchtext
     */
    receiveSearchResults(event: string) {
        console.log(event);
        this.searchText = event ? true:false;
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: any): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
    }

    selectSingleRow(event:any,row:any) {
        this.selection.toggle(row)
        if(!this.formData[this.formData.entity_targeting.name]) {
            this.formData[this.formData.entity_targeting.name] = [];
        }
        if(event.checked && this.formData[this.formData.entity_targeting.name]) {
            this.formData[this.formData.entity_targeting.name].push(row)
        }
        else if (!event.checked && this.formData[this.formData.entity_targeting.name]) {
            const index = this.formData[this.formData.entity_targeting.name].findIndex((element:any) => JSON.stringify(element) === JSON.stringify(row))
            if(index >= 0) {
                this.formData[this.formData.entity_targeting.name].splice(index,1)
            }
        }
    }

    closeDialog() {
        if(this.formData.state && this.targetedEntity.length > 0) {
            // this.formData[this.targetedEntity] = this.selection.selected;
            this.formData[this.formData.entity_targeting.name] = this.formData[this.formData.entity_targeting.name].filter(
                (item:any, index:number, self:any) =>
                  index === self.findIndex(
                    (obj:any) => JSON.stringify(obj) === JSON.stringify(item)
                  )
              );
            this.dialogRef.close(
                {...this.formData,...{label:(this.formData.state.name+' - '+this.formData.entity_targeting.name+' ('+this.formData[this.formData.entity_targeting.name].length+')')}}
            );
        }
        else if (this.formData.state && this.targetedEntity.length == 0) {
            this.dialogRef.close(
                {...this.formData,...{label:this.formData.state.name}}
            );
        }
        else {
            this.dialogRef.close(this.formData);
        }
    }

    pageEvent(event:any) {
        console.log(event);
        this.formService.getEntitiesListAsType("GET_SUB_ENTITIES_LIST",this.targetedEntity,this.filterSelectedValue.length > 0 ? this.filterSelectedValue : this.formData.state._id,event.pageIndex+1,event.pageSize).subscribe((res:any) => {
            this.insertDataIntoTable(res.result.data,res.result.count)
        })
    }

    isDisable() {
        let disable = false;
        if(this.targetedEntity.length > 0 && this.selection.selected.length == 0) {
            disable = true;
        }
        this.criteria?.find((element:any) =>{
            element?.form.find((innerElement:any) => {
                if(innerElement?.validators?.required && !this.formData[innerElement?.meta?.type]) {
                    disable = true;
                }
            })
        })
        return disable;
    }


    applyFilter(event:any) {
        this.searchText = event ? true:false
        this.dataSource.filter = event.trim().toLowerCase();
        this.paginator.firstPage();
    }
}
