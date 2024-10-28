import { Injectable } from '@angular/core';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { ConfigService } from '../../configs/config.service';
import { HttpProviderService } from '../http-provider.service';
import { PROJECT_DETAILS, CERTIFICATE_DETAILS } from '../../constants/formConstant';
import { IndexDbService } from '../index-db/index-db.service';




@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor(private httpService: HttpProviderService, private configService:ConfigService, private indexDb:IndexDbService) { }


  getForm(formBody: any): Observable<any> {
    const config = {
      url: this.configService.urlConFig.FORM_URLS.READ_FORM,
      payload: formBody,
    };

    return this.indexDb.getObjectByKey(formBody.sub_type).pipe(
      switchMap((dbResponse: any) => {
        if (dbResponse) {
          // If data is found in IndexedDB, return it
          return of(dbResponse);
        } else {
          // If no data in IndexedDB, make an HTTP request
          return this.httpService.post(config.url, config.payload).pipe(
            tap((result: any) => {
              // Save the result to IndexedDB after a successful HTTP response
              this.indexDb.addObject({...result,...{customKey:formBody.sub_type}}).subscribe(() => {
                console.log("Data added to IndexedDB");
              });
            }),
            map((result: any) => result)
          );
        }
      })
    );
  }

  // getForm(formBody: any) {
  //   const config = {
  //     url: this.configService.urlConFig.FORM_URLS.READ_FORM,
  //     payload: formBody,
  //   };
  //   return this.httpService.post(config.url, config.payload).pipe(
  //     map((result: any) => {
  //       this.indexDb.addObject({...result,...{customKey:formBody.sub_type}}).subscribe(() => {
  //         console.log("Data added to IndexedDB");
  //       });
  //       return result;
  //     })
  //   )
  // }

  getEntities(entityTypes: any) {
    const config = {
      url: this.configService.urlConFig.FORM_URLS.READ_ENTITY_TYPE,
      payload: entityTypes.length ? { value: entityTypes } : {}
    };
    return this.httpService.post(config.url, config.payload).pipe(
      map((result: any) => {
        let data = result?.result?.entity_types || [];
        return data;
      })
    );
  }

  getEntityNames(formData: any) {
    const arr1 = formData.controls
      .filter((control: { meta: { entityType: any; }; }) => control?.meta && control.meta.entityType)
      .map((control: { meta: { entityType: any; }; }) => control.meta.entityType);

    const arr2 = formData.controls
      .flatMap((control: { subfields: any; }) => control.subfields ? control.subfields : [])
      .filter((subfield: { meta: { entityType: any; }; }) => subfield?.meta && subfield.meta.entityType)
      .map((subfield: { meta: { entityType: any; }; }) => subfield.meta.entityType);

    return [...arr1, ...arr2];
  }

  populateEntity(formData: any, entityList: any) {
    formData.controls.forEach((control: { name: any; options: any; subfields: any; }) => {
      let entity = entityList.find((entityData: { value: any; }) => control.name === entityData.value);
      if (entity) {
        control.options = entity.entities.map((entityItem: { label: any; value: any; }) => ({ label: entityItem.label, value: entityItem.value }));
      }
      if (control.subfields) {
        control.subfields.forEach((subfield: { name: any; options: any; }) => {
          let subfieldEntity = entityList.find((entityData: { value: any; }) => subfield.name === entityData.value);
          if (subfieldEntity) {
            subfield.options = subfieldEntity.entities.map((entityItem: { label: any; value: any; }) => ({ label: entityItem.label, value: entityItem.value }));
          }
        });
      }
    });
    return formData;
  }


  getFormWithEntities(form: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.getForm(PROJECT_DETAILS).subscribe((formResponse:any) => {
          let formData = formResponse?.result?.data?.fields || [];
          let entityNames = this.getEntityNames(formData);
          this.getEntities(entityNames).subscribe((entities:any) => {
            let data = this.populateEntity(formData, entities);
            resolve(data);
          }, (error:any) => {
            reject(error);
          });
        }, (error:any) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });

  }

  getPermissions() {
    return this.httpService.get(this.configService.urlConFig.PERMISSIONS.PERMISSION_LIST);
  }

  checkPermissions(data:any,permissions:any) {
    if(data && data[0]?.permission_modules) {
      return data.filter((item:any) =>
      item.permission_modules.some((module: string) =>
        permissions.some((perm:any) => perm.module.includes(module))
      )
    );
    }
  }

  getCertificateForm(){
    return new Promise((resolve, reject) => {
      try{
        this.getForm(CERTIFICATE_DETAILS).subscribe((formResponse : any) => {
          let formData = formResponse?.result?.data?.fields || [];
          let entityNames = this.getEntityNames(formData);
          this.getEntities(entityNames).subscribe((entities:any) => {
            let data = this.populateEntity(formData, entities);
            resolve(data)
          });
        })
      }
      catch(error){
        reject(error)
      }
    });
  }

  // checkRolePermissions(data:any,roles:any) {
  //     if(data && data[0]?.roles) {
  //       return data.filter((item:any) =>
  //       item.roles.some((role: string) =>
  //         roles.some((perm:any) => perm.roles.includes(role))
  //       )
  //     );
  //   }
  // }


}
