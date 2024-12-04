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
import { FormService, SideNavbarComponent } from 'lib-shared-modules';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatSort, MatSortModule} from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';


export interface UserData {
    id: string;
    name: string;
    progress: string;
    fruit: string;
  }

  /** Constants used to fill up our data base. */
  const FRUITS: string[] = [
    'blueberry',
    'lychee',
    'kiwi',
    'mango',
    'peach',
    'lime',
    'pomegranate',
    'pineapple',
  ];
  const NAMES: string[] = [
    'Maia',
    'Asher',
    'Olivia',
    'Atticus',
    'Amelia',
    'Jack',
    'Charlotte',
    'Theodore',
    'Isla',
    'Oliver',
    'Isabella',
    'Jasper',
    'Cora',
    'Levi',
    'Violet',
    'Arthur',
    'Mia',
    'Thomas',
    'Elizabeth',
  ];
@Component({
  selector: 'lib-target-criteria',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, SideNavbarComponent, MatIconModule,MatDialogModule, MatTableModule, MatSortModule, MatPaginatorModule, MatCheckboxModule],
  templateUrl: './target-criteria.component.html',
  styleUrl: './target-criteria.component.scss'
})

export class TargetCriteriaComponent implements OnInit{

  criteria:any = [
    {
      placeHolder:"Choose State",
      isMultiple:false,
      label:"State",
      options:[
          {
              "_id": "667d30ca8ead9320cf997c4a",
              "name": "Arunachal Pradesh",
              "externalId": "enf3"
          },
          {
              "_id": "6687b8d38ead9320cf997c65",
              "name": "Andhra Pradesh",
              "externalId": "enkhfjg"
          },
          {
              "_id": "66aca8d1116811ed2986ab11",
              "name": "Manipur",
              "externalId": "extManipur"
          },
          {
              "_id": "66b9e17660de1616f42cb94f",
              "name": "Nagaland",
              "externalId": "extNagaland"
          },
          {
              "_id": "66bf7eb960de1616f42cb984",
              "name": "Karnataka",
              "externalId": "entity6889"
          },
          {
              "_id": "66bf7edf8d2c4516ea1b44df",
              "name": "Kerala",
              "externalId": "extKerala"
          },
          {
              "_id": "66bf7ef28d2c4516ea1b44e2",
              "name": "Jharkhand",
              "externalId": "extJharkhand"
          },
          {
              "_id": "66bf7efc8d2c4516ea1b44e5",
              "name": "Goa",
              "externalId": "extGoa"
          },
          {
              "_id": "66bf7f0b60de1616f42cb990",
              "name": "Tamil Nadu ",
              "externalId": "entit900"
          },
          {
              "_id": "66d5621ff9b0f657a7e20bb7",
              "name": "Rajasthan",
              "externalId": "extRajasthan"
          },
          {
              "_id": "66e418e27165395fcea49ab5",
              "name": "Assam",
              "externalId": "extAssam"
          },
          {
              "_id": "66e41ce8a770045fc4236049",
              "name": "Gujarat",
              "externalId": "extGJ"
          },
          {
              "_id": "66e9607c66895e1a085c1f25",
              "name": "Madhya Pradesh",
              "externalId": "extMadhyapradesh"
          },
          {
              "_id": "66e96eb18f376a1a12096518",
              "name": "Puducherry",
              "externalId": "extPuducherry"
          },
          {
              "_id": "66ea618968cd063346a10355",
              "name": "RAJANDHRASTATE",
              "externalId": "rajAPSTATEDummy"
          },
          {
              "_id": "66ea61fb68cd063346a1035a",
              "name": "RAJANDHRASTATE",
              "externalId": "rajAPSTATEDummy1"
          },
          {
              "_id": "66ea6369eff7aa33502f2df9",
              "name": "RAJANDHRASTATE",
              "externalId": "rajAPSTATEDummy2"
          },
          {
              "_id": "66ea646268cd063346a10362",
              "name": "          ",
              "externalId": "rajAPSTATEDummy3"
          },
          {
              "_id": "66ea64fa68cd063346a10365",
              "name": "Uttarakhand",
              "externalId": "extUttarakhand"
          },
          {
              "_id": "66ec06c0eff7aa33502f30fc",
              "name": "Himachal Pradesh",
              "externalId": "extHP"
          },
          {
              "_id": "66ec07cbeff7aa33502f3106",
              "name": "Uttar Pradesh",
              "externalId": "extUP"
          },
          {
              "_id": "66ec0969eff7aa33502f312b",
              "name": "Punjab",
              "externalId": "pun123"
          },
          {
              "_id": "66f157266efc01710b71509d",
              "name": "West Bengal",
              "externalId": "extWB"
          },
          {
              "_id": "66f1661a6efc01710b7150f5",
              "name": "Odisha",
              "externalId": "extOdi"
          },
          {
              "_id": "66f3a878ebe4ef7115900948",
              "name": "Tripura",
              "externalId": "extTri"
          },
          {
              "_id": "66f3aa896efc01710b715370",
              "name": "Mizoram",
              "externalId": "extMizo"
          },
          {
              "_id": "66f3ae04ebe4ef711590096d",
              "name": "Chandigarh",
              "externalId": "extChandigarh"
          },
          {
              "_id": "66f3af766efc01710b7153b0",
              "name": "Chhattisgarh",
              "externalId": "extChhattis"
          },
          {
              "_id": "66f3cd596efc01710b715423",
              "name": "Bihar",
              "externalId": "extBihar"
          },
          {
              "_id": "66f3d1d8ebe4ef7115900afe",
              "name": "Tamil nadu",
              "externalId": "extTN"
          },
          {
              "_id": "66f3da016efc01710b715573",
              "name": "Jammu & Kashmir",
              "externalId": "extJK"
          },
          {
              "_id": "66fa288bebe4ef71159011e8",
              "name": "Sampl4e1",
              "externalId": "tg6f623"
          },
          {
              "_id": "66fa29cdebe4ef71159011ec",
              "name": "Udipi",
              "externalId": "testUser1374"
          },
          {
              "_id": "66fa34e3ebe4ef711590120b",
              "name": "Tenali",
              "externalId": "testUser13794"
          },
          {
              "_id": "66fa45bfebe4ef711590121f",
              "name": "Tenali11",
              "externalId": "testUser139794"
          },
          {
              "_id": "6704df2a6efc01710b715ded",
              "name": "Qa public school12",
              "externalId": "testUser13957694"
          },
          {
              "_id": "6704f4476efc01710b715dfc",
              "name": "qa engineer1",
              "externalId": "entity12556334"
          },
          {
              "_id": "6704f4e86efc01710b715e05",
              "name": "qa engineer13",
              "externalId": "entity124556334"
          },
          {
              "_id": "6705006a6efc01710b715e96",
              "name": "lalbagh",
              "externalId": "entity1245563334"
          },
          {
              "_id": "670602346efc01710b715ef0",
              "name": "Qa public school128",
              "externalId": "testUser139576794"
          },
          {
              "_id": "670610f6ebe4ef71159015c6",
              "name": "Qa public school1289",
              "externalId": "testUser1395766794"
          },
          {
              "_id": "6706b9a26efc01710b715f46",
              "name": "lalbagh1",
              "externalId": "entity41245563334"
          },
          {
              "_id": "6710979946719d77a3fb0b50",
              "name": "PunjabQA",
              "externalId": "PNB"
          },
          {
              "_id": "6710b4e467b6747799a7636e",
              "name": "GoaQa",
              "externalId": "GQ"
          },
          {
              "_id": "6710c25c46719d77a3fb0e1f",
              "name": "Tamil NaduQA",
              "externalId": "TMN"
          },
          {
              "_id": "6710c34046719d77a3fb0e2a",
              "name": "MaharashtraQA",
              "externalId": "MQA"
          },
          {
              "_id": "6710cebb46719d77a3fb1046",
              "name": "AssamQA",
              "externalId": "ASQ"
          },
          {
              "_id": "6710cf9267b6747799a76713",
              "name": "Madhya PradeshQA",
              "externalId": "MPQ"
          },
          {
              "_id": "672841d0b1422706754bbf0b",
              "name": "Qa1 public school12758",
              "externalId": "testUser13957667946"
          }
      ]
    },
    {
        placeHolder:"Role",
        isMultiple:false,
        label:"Select Target",
        options:[
            {
                "_id": "66b9df998d2c4516ea1b4494",
                "value": "28",
                "label": "Block Education Officer"
            },
            {
                "_id": "66b9dfa760de1616f42cb93d",
                "value": "29",
                "label": "Block Academic Coordinator"
            },
            {
                "_id": "66b9def560de1616f42cb936",
                "value": "34",
                "label": "Cluster Academic Coordinator"
            },
            {
                "_id": "66b9dff78d2c4516ea1b4499",
                "value": "30",
                "label": "District Education Officer"
            },
            {
                "_id": "66b9e00a60de1616f42cb941",
                "value": "31",
                "label": "District Resource Person"
            },
            {
                "_id": "66b9e03e8d2c4516ea1b449c",
                "value": "32",
                "label": "State Project Director"
            },
            {
                "_id": "673599fab1422706754bfc04",
                "value": "899",
                "label": "Qa Level1 Officer"
            },
            {
                "_id": "66b9df618d2c4516ea1b4491",
                "value": "35",
                "label": "Head master"
            }
        ]
    },
    {
        placeHolder:"Choose Entity targetting",
        isMultiple:false,
        label:"Entity Targeting",
        options:[]
    }
  ]
  displayedColumns: string[] = ['select','id', 'name', 'progress', 'fruit'];
  dataSource: MatTableDataSource<UserData>;
  selection = new SelectionModel<UserData>(true, []);

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  constructor(public dialogRef: MatDialogRef<TargetCriteriaComponent>, @Inject(MAT_DIALOG_DATA) public dialogData: any, private getFormWithEntities:FormService) {
    console.log(this.dialogData)
    const users = Array.from({length: 100}, (_, k) => createNewUser(k + 1));

    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(users);

  }

  ngOnInit(): void {
    // this.getFormWithEntities.getEntitiesList("GET_ENTITIES_LIST","state").subscribe((res)=> console.log(res))
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
    checkboxLabel(row?: UserData): string {
    if (!row) {
        return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
    }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

/** Builds and returns a new User. */
function createNewUser(id: number): UserData {
  const name =
    NAMES[Math.round(Math.random() * (NAMES.length - 1))] +
    ' ' +
    NAMES[Math.round(Math.random() * (NAMES.length - 1))].charAt(0) +
    '.';

  return {
    id: id.toString(),
    name: name,
    progress: Math.round(Math.random() * 100).toString(),
    fruit: FRUITS[Math.round(Math.random() * (FRUITS.length - 1))],
  };

}
