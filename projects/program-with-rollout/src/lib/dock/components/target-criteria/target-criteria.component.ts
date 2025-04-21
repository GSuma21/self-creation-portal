import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import {
  FilterComponent,
  FormService,
  ROLLOUT_TARGET_CRITERIA_DETAILS,
  SearchComponent,
  SideNavbarComponent,
  TARGET_CRITERIA_DETAILS,
} from 'lib-shared-modules';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { ChangeDetectorRef } from '@angular/core';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { DynamicFormModule } from 'dynamic-form-suma';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-target-criteria',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SideNavbarComponent,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatTabsModule,
    FilterComponent,
    TranslateModule,
    TitleCasePipe,
    SearchComponent,
    MatTooltip,
    MatTooltipModule,
    DynamicFormModule
  ],
  templateUrl: './target-criteria.component.html',
  styleUrl: './target-criteria.component.scss',
})
export class TargetCriteriaComponent implements OnInit {
  criteria: any;
  placeHolder: string = 'SEARCH_TARGET_ELEMENT';
  criteriaFilters: any = [];
  formData: any = {};
  filterSelectedValue: string = '';
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  targetEntityArray = [];
  targetedEntity: string = '';
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  tableColumns: string[] = [];
  tableData: any = []; // to show the data in HTML Loop
  searchText: boolean = false;
  pageCount: number = 5;
  language:any

  constructor(
    public dialogRef: MatDialogRef<TargetCriteriaComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private formService: FormService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource();
    this.language = this.dialogData?.language
  }

  ngOnInit(): void {
    this.getTargetCriteriaDetails();
    this.tableColumns = ['select', ...this.displayedColumns];
    if (this.dialogData.data) {
      this.formData = this.dialogData.data;
    }
  }

  getTargetCriteriaDetails() {
    this.formService.getForm( this.router.url.includes('project-details') ? ROLLOUT_TARGET_CRITERIA_DETAILS :TARGET_CRITERIA_DETAILS).subscribe((data: any) => {
      this.criteria = data.result.data.fields?.controls;
      this.formService
        .getEntitiesList('GET_ENTITIES_LIST', 'state')
        .subscribe((res: any) => {
          this.criteria[0].form[0].options = res.result;
          if (this.dialogData.data && res.result) {
            // this condition will check and add data to the form and table
            this.getEntityAndRoles();
            if (this.dialogData.data.entity_targeting.name !== 'state') {
              this.formService
                .getEntitiesListAsType(
                  'GET_SUB_ENTITIES_LIST',
                  this.formData.entity_targeting.value,
                  Array.isArray(this.formData.state)
                    ? this.formData.state[0]._id
                    : this.formData.state._id,
                  1,
                  this.pageCount
                )
                .subscribe((res: any) => {
                  this.insertDataIntoTable(res.result.data, res.result.count);
                  this.selection.clear();
                  let targetingArray =
                    this.formData[this.formData.entity_targeting.value];
                  for (let index = 0; index < 5; index++) {
                    this.selection.select(targetingArray[index]);
                  }
                });
            }
          }
        });
    });
  }

  // tableColumns() {
  //     return ['select', ...this.displayedColumns];
  // }

  insertDataIntoTable(data: any, count?: number) {
    let newArray = data.map((element: any) => {
      delete element.label;
      delete element.entityType;
      delete element.value;
      delete element.name;
      return element;
    });
    this.displayedColumns = newArray.length ? Object.keys(newArray[0]) : [];
    this.tableColumns = ['select', ...this.displayedColumns].filter(
      (element) => element != '_id'
    );
    this.dataSource = new MatTableDataSource(newArray);
    this.paginator.length = count ? count : data.length;
  }

  getValueOfOption(value: string) {
    return this.formData[value];
  }

  setFormData(event: any, key: any, formElementIndex: number) {
    if (key == 'state') {
      this.dataSource = new MatTableDataSource();
      this.getEntityAndRoles();
      this.formData = {};
      let targetFormInfo= JSON.parse(JSON.stringify(this.criteria[0].form[2]));
      delete this.criteria[0].form[2];
      this.criteria[0].form[2] = targetFormInfo;
      this.targetedEntity = '';
    }
    if (key !== 'roles' && key!== 'gender') {
      this.selection.clear();
      this.criteriaFilters = [];
      this.displayedColumns = [];
      this.tableColumns = [];
    }
    if (key) {
      this.formData[key] = event.value;
    }
    // if(key.meta.dependantIndex) {
    //     key.meta.dependantIndex.forEach((index:string|number)=>{
    //         this.formService.getEntitiesList(this.criteria[0].form[index].meta.url,this.criteria[0].form[index].meta.type, key.meta.type == 'hierarchy'? '': this.formData.state._id).subscribe((res:any)=>{
    //             this.criteria[0].form[index].options = res.result;
    //         })
    //     })
    // }
    if (key == 'entity_targeting') {
      if(this.dialogData.targeting_criteria && this.dialogData.targeting_criteria.length > 0) {
        let item = this.dialogData.targeting_criteria.find((element:any) => ((element.state && element.state._id) || (element.state[0] && element.state[0]._id)) === this.formData.state._id && this.formData.entity_targeting._id === element.entity_targeting._id)
        this.selection.clear();
        this.dataSource = new MatTableDataSource();
        this.tableColumns = [];
        if(item) {
          // item = {'roles':item.roles,'entity_targeting':item.entity_targeting,'label':item.label,[item[item.entity_targeting.value]]:item[item.entity_targeting]}
          item.state = this.formData.state;
          this.formData = item;
          let targetingArray =
          this.formData[this.formData.entity_targeting.value];
          if(targetingArray) {
            for (let index = 0; index < 5; index++) {
              this.selection.select(targetingArray[index]);
            }
          }
        }
      }
      this.targetedEntity = event.value._id;
      this.criteriaFilters = [];
      for (
        let index = 0;
        this.targetEntityArray[index] != event.value._id;
        index++
      ) {
        // index starts 1 to skip state fetching
        this.criteriaFilters.push({
          placeHolder: `select ${this.targetEntityArray[index]}`,
          isMultiple: false,
          meta: {
            url: 'GET_SUB_ENTITIES_LIST',
            type: this.targetEntityArray[index],
          },
          label: this.targetEntityArray[index],
          option: [],
          value: this.targetEntityArray[index],
        });
      }
      // this.formService.getEntitiesListAsType('GET_SUB_ENTITIES_LIST',this.targetEntityArray[1],this.formData.state._id).subscribe((res:any)=>{
      //     this.criteriaFilters[formElementIndex].options = res.result.data;
      // })
      if(this.criteriaFilters.length > 0) {
        for (let index = 0; index < 1; index++) {
          // index starts 1 to skip state fetching
          this.formService
            .getEntitiesListAsType(
              'GET_SUB_ENTITIES_LIST',
              this.criteriaFilters[index].value,
              Array.isArray(this.formData.state)
                ? this.formData.state[0]._id
                : this.formData.state._id
            )
            .subscribe((res: any) => {
              this.criteriaFilters[index].option = res.result.data;
            });
        }
      }
      this.formService
        .getEntitiesList(
          this.criteria[0].form[2].meta.url,
          this.targetedEntity,
          Array.isArray(this.formData.state)
            ? this.formData.state[0]._id
            : this.formData.state._id
        )
        .subscribe((res: any) => {
          this.criteria[0].form[2].options = res.result;
        });
      this.formService
        .getEntitiesListAsType(
          'GET_SUB_ENTITIES_LIST',
          event.value._id,
          Array.isArray(this.formData.state)
            ? this.formData.state[0]._id
            : this.formData.state._id,
          1,
          this.pageCount
        )
        .subscribe((res: any) => {
          this.insertDataIntoTable(res.result.data, res.result.count);
        });
    }
    if (
      key != 'roles' &&
      key != 'entity_targeting' &&
      key != 'state' &&
      key != 'gender'
    ) {
      this.formService
        .getEntitiesListAsType(
          'GET_SUB_ENTITIES_LIST',
          this.targetEntityArray[formElementIndex - 1],
          event.value._id
        )
        .subscribe((res: any) => {
          this.insertDataIntoTable(res.result.data);
        });
    }
    this.criteria = this.criteria;
  }

  getEntityAndRoles() {
    this.formData.state = Array.isArray(this.formData.state)
      ? this.formData.state[0]
      : this.formData.state;
    this.formService
      .getEntitiesList(
        this.criteria[0].form[1].meta.url,
        '',
        Array.isArray(this.formData.state)
          ? this.formData.state[0]?.externalId
          : this.formData.state?.externalId
      )
      .subscribe((res: any) => {
        this.targetEntityArray = res.result[0].childHierarchyPath;
        this.criteria[0].form[1].options = res.result[0].childHierarchyPath.map(
          (element: string) => {
            return {
              _id: element,
              value: element,
              name: element,
            };
          }
        );
        if (
          this.dialogData.data &&
          this.dialogData.data.entity_targeting.name !== 'state'
        ) {
          this.targetedEntity = this.formData.entity_targeting.value;
          this.criteriaFilters = [];
          for (
            let index = 0;
            this.targetEntityArray[index] !=
            this.formData.entity_targeting.value;
            index++
          ) {
            // index starts 1 to skip state fetching
            this.criteriaFilters.push({
              placeHolder: `select ${this.targetEntityArray[index]}`,
              isMultiple: false,
              meta: {
                url: 'GET_SUB_ENTITIES_LIST',
                type: this.targetEntityArray[index],
              },
              label: this.targetEntityArray[index],
              option: [],
              value: this.targetEntityArray[index],
            });
          }
          // this.formService.getEntitiesListAsType('GET_SUB_ENTITIES_LIST',this.targetEntityArray[1],this.formData.state._id).subscribe((res:any)=>{
          //     this.criteriaFilters[formElementIndex].options = res.result.data;
          // })
          for (let index = 0; index < this.criteriaFilters.length; index++) {
            this.formService
              .getEntitiesListAsType(
                'GET_SUB_ENTITIES_LIST',
                this.criteriaFilters[index].value,
                Array.isArray(this.formData.state)
                  ? this.formData.state[0]._id
                  : this.formData.state._id
              )
              .subscribe((res: any) => {
                this.criteriaFilters[index].option = res.result.data;
              });
          }
        }
      });
    this.formService
      .getEntitiesList(
        this.criteria[0].form[2].meta.url,
        '',
        Array.isArray(this.formData.state)
          ? this.formData.state[0]._id
          : this.formData.state._id
      )
      .subscribe((res: any) => {
        this.criteria[0].form[2].options = res.result;
      });
    this.selection.changed.subscribe(() => {
      // Trigger change detection or additional updates if needed
      this.cdr.detectChanges(); // Ensure to inject `ChangeDetectorRef` if used
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onFilterChange(event: any) {
    this.filterSelectedValue = event.values[0];
    this.formService
      .getEntitiesListAsType(
        'GET_SUB_ENTITIES_LIST',
        this.targetedEntity,
        event.values[0],
        1,
        this.pageCount
      )
      .subscribe((res: any) => {
        if (res.result.data) {
          this.insertDataIntoTable(res.result.data, res.result.count);
        } else {
          this.insertDataIntoTable(res.result, res.result.length);
        }
    });
    for (let index = this.criteriaFilters.findIndex((element:any) => element.value === event.filterName)+1; index < this.criteriaFilters.length; index++) {
      this.criteriaFilters[index].option = [];
    }

    for (let index = this.criteriaFilters.findIndex((element:any) => element.value === event.filterName)+1; index < this.criteriaFilters.findIndex((element:any) => element.value === event.filterName)+2; index++) {
      this.formService
        .getEntitiesListAsType(
          'GET_SUB_ENTITIES_LIST',
          this.criteriaFilters[index].value,
          event.values[0]
        )
        .subscribe((res: any) => {
          this.criteriaFilters[index].option = res.result.data ? res.result.data : res.result;
      });
    }
  }
  compareObjects(o1: any, o2: any): boolean {
    return o1 && o2 ? o1._id === o2._id : o1 === o2;
  }

  checkIsRowAvailable(row: any) {
    if (this.formData[this.formData.entity_targeting.value]) {
      return this.formData[this.formData.entity_targeting.value].some(
        (obj: any) => JSON.stringify(obj) === JSON.stringify(row)
      );
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    // Convert arrayB to a map for faster lookup
    if (this.formData[this.formData.entity_targeting.value]) {
      return this.dataSource.data.every((obj1: any) =>
        this.formData[this.formData.entity_targeting.value].some(
          (obj2: any) => JSON.stringify(obj1) === JSON.stringify(obj2)
        )
      );
    } else {
      return false;
    }
  }

  showTooltip(tooltip: MatTooltip) {
    tooltip.disabled = false;
    tooltip.show();
  }

  hideTooltip(tooltip: MatTooltip) {
    tooltip.hide();
    tooltip.disabled = true;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows(event: any) {
    if (!this.formData[this.formData.entity_targeting.value]) {
      this.formData[this.formData.entity_targeting.value] = [];
    }
    if (!event.checked) {
      const setA = new Set(
        this.dataSource.data.map((item: any) => JSON.stringify(item))
      );
      this.formData[this.formData.entity_targeting.value] = this.formData[
        this.formData.entity_targeting.value
      ].filter((item: any) => !setA.has(JSON.stringify(item)));
      if (this.formData[this.formData.entity_targeting.value].length == 0) {
        this.selection.clear();
      }
      return;
    }
    this.formData[this.formData.entity_targeting.value] = this.formData[
      this.formData.entity_targeting.value
    ].concat(this.dataSource.data);
    this.selection.select(...this.dataSource.data);
  }

  /**
   * This function is used for the search functionality
   * @param event - The search event which contains the searchtext
   */
  receiveSearchResults(event: string) {
    this.searchText = event ? true : false;
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.id + 1
    }`;
  }

  isCheckboxChangeable(data?:any):boolean {
    if(this.formData.readOnly) {
      return true;
    }
    else {
      return false;
    }
  }

  selectSingleRow(event: any, row: any) {
    if(this.formData.readOnly && event.checked) {
      return
    }
    this.selection.toggle(row);
    if(this.formData[this.formData.entity_targeting.name] && this.formData[this.formData.entity_targeting.name].length > 0) {
      this.formData[this.formData.entity_targeting.name] = this.formData[
        this.formData.entity_targeting.name
      ].filter(
        (item: any, index: number, self: any) =>
          index ===
          self.findIndex(
            (obj: any) => JSON.stringify(obj) === JSON.stringify(item)
          )
      );
    }
    if (!this.formData[this.formData.entity_targeting.name]) {
      this.formData[this.formData.entity_targeting.name] = [];
    }
    if (event.checked && this.formData[this.formData.entity_targeting.name]) {
      this.formData[this.formData.entity_targeting.name].push(row);
      this.selection.select(row);
    } else if (!event.checked && this.formData[this.formData.entity_targeting.name]) {
      this.selection.deselect(row);
      const index = this.formData[
        this.formData.entity_targeting.name
      ].findIndex(
        (element: any) => JSON.stringify(element) === JSON.stringify(row)
      );
      if (index >= 0) {
        this.formData[this.formData.entity_targeting.name].splice(index, 1);
      }
      if (this.formData[this.formData.entity_targeting.value].length == 0) {
        this.selection.clear();
      }
    }
  }

  closeTargetCriteriaPopup() {
    if (this.formData.state && !Array.isArray(this.formData.state)) {
      // changing state format to an array of object
      this.formData.state = [this.formData.state];
    }
  }
  closeDialog() {
    if (this.formData.state && !Array.isArray(this.formData.state)) {
      // changing state format to an array of object
      this.formData.state = [this.formData.state];
    }
    if (this.formData.state && this.targetedEntity.length > 0) {
      // this.formData[this.targetedEntity] = this.selection.selected;
      this.formData[this.formData.entity_targeting.name] = this.formData[
        this.formData.entity_targeting.name
      ].filter(
        (item: any, index: number, self: any) =>
          index ===
          self.findIndex(
            (obj: any) => JSON.stringify(obj) === JSON.stringify(item)
          )
      );
      this.dialogRef.close({
        ...this.formData,
        ...{
          label:
            this.formData.state[0].name +
            ' - ' +
            this.formData.entity_targeting.name +
            ' (' +
            this.formData[this.formData.entity_targeting.name].length +
            ')',
        },
      });
    } else if (this.formData.state && this.targetedEntity.length == 0) {
      delete this.formData.readOnly
      this.dialogRef.close({
        ...this.formData,
        ...{ label: this.formData.state[0].name },
        ...{
          entity_targeting: { _id: 'state', value: 'state', name: 'state' },
        },
      });
    } else {
      delete this.formData.readOnly
      this.dialogRef.close(this.formData);
    }
  }

  pageEvent(event: any) {
    this.formService
      .getEntitiesListAsType(
        'GET_SUB_ENTITIES_LIST',
        this.targetedEntity,
        this.filterSelectedValue.length > 0
          ? this.filterSelectedValue
          : Array.isArray(this.formData.state)
          ? this.formData.state[0]._id
          : this.formData.state._id,
        event.pageIndex + 1,
        event.pageSize
      )
      .subscribe((res: any) => {
        this.insertDataIntoTable(res.result.data, res.result.count);
        const setA = new Set(
          res.result.data.map((item: any) => JSON.stringify(item))
        );
        let selected = this.formData[
          this.formData.entity_targeting.value
        ].filter((item: any) => setA.has(JSON.stringify(item)));
        selected.forEach((element: any) => {
          this.selection.select(element);
        });
      });
  }

  clearForm(tab:any) {
    this.dialogData.data = null;
    this.getTargetCriteriaDetails();
    this.selection.clear();
    this.dataSource = new MatTableDataSource();
    this.tableColumns = [];
    this.formData = {};
  }

  isDisable() {
    let disable = false;
    if (this.targetedEntity.length > 0 && this.selection.selected.length == 0) {
      disable = true;
    }
    if (
      this.formData &&
      this.formData.entity_targeting &&
      this.formData[this.formData.entity_targeting.value] &&
      this.formData[this.formData.entity_targeting.value].length == 0
    ) {
      disable = true;
    }
    this.criteria?.find((element: any) => {
      element?.form.find((innerElement: any) => {
        if (
          (innerElement?.validators?.required &&
            !this.formData[innerElement?.meta?.type]) ||
          (innerElement?.validators?.required &&
            this.formData[innerElement?.meta?.type].length == 0)
        ) {
          disable = true;
        }
      });
    });
    return disable;
  }

  applyFilter(event: any) {
    this.searchText = event ? true : false;
    this.dataSource.filter = event.trim().toLowerCase();
    this.paginator.firstPage();
  }
}
