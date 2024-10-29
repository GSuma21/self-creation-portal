import { Injectable } from '@angular/core';
import { ConfigService } from '../../configs/config.service';
import { HttpProviderService } from '../http-provider.service';
import { map } from 'rxjs/internal/operators/map';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  saveComment :boolean= true;

  constructor( private Configuration:ConfigService,private httpService:HttpProviderService,private http:HttpClient) { }

  approveResource(resourceId:string|number,payload:any){
    const config = {
      url : `${this.Configuration.urlConFig.RESOURCE_URLS.APPROVE_PROJECT}/${resourceId}`,
      payload:payload
    }
    return this.httpService.post(config.url, config.payload)
  }

  updateReview(resourceId:string|number,payload:any){
    const config = {
      url : `${this.Configuration.urlConFig.RESOURCE_URLS.UPDATE_REVIEW}/${resourceId}`,
      payload: payload
    }
    return this.httpService.post(config.url, config.payload)
  }

  startOrResumeReview(resourceId:string|number){
    const config = {
      url : `${this.Configuration.urlConFig.RESOURCE_URLS.START_REVIEW}/${resourceId}`,
      payload:{}
    }
    return this.httpService.post(config.url, config.payload)
  }

  rejectOrReportedReview(resourceId:string|number,payload:any,isReported:boolean=false){
    const config = {
      url : `${this.Configuration.urlConFig.RESOURCE_URLS.REJECT_OR_REPORTED}/${resourceId}${isReported === true ? `?isReported=${isReported}` : ''}`,
      payload:payload
    }
    return this.httpService.post(config.url, config.payload)
  }

  updateComment(resourceId:string|number,payload:any,commentId:string|number = ''){
    const config = {
      url : `${this.Configuration.urlConFig.RESOURCE_URLS.UPDATE_COMMENT+"?resource_id="+resourceId}`,
      payload:{ "comment": payload }
    };
    return this.httpService.post(config.url, config.payload)
  }

  downloadFiles(url:string) {
    return this.http.get(url, { responseType: 'text' })
  }

  getCommentList(resourceId:string|number){
    const config = {
      url : `${this.Configuration.urlConFig.RESOURCE_URLS.COMMENT_LIST+"?resource_id="+resourceId}`,
    };
    return this.httpService.get(config.url)
  }

  filterCommentByContext(comment:any,page:string) {
    return comment.filter((element:any) => element.page === page);
  }

  getImageUploadUrl(file: any) {
    let payload = {
      "request": {
        "certificate": {
          "files": [
            file.name
          ]
        }
      },
      "ref": "certificate"
    }
    return this.httpService.post(this.Configuration.urlConFig.UPLOAD.SIGNED_URL,payload);
  }

  uploadSignedURL(file: any, path: any) {
    var options = {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    };
    return this.http.put(path, file,options);
  }

  deleteComment(commentId: any, resourceId: any) {
    const config = {
      url: `${this.Configuration.urlConFig.RESOURCE_URLS.UPDATE_COMMENT}/${commentId}?resource_id=${resourceId}`,
    };
    return this.httpService.delete(config.url);
  }


  removeEmptyKey(obj: any): Observable<any> {
    for (let key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((element: any) =>
          element.value ? element.label : element
        );
      }
      obj[key] = obj[key]?.value ? obj[key].label : obj[key];
    }
    return of(obj).pipe(
      map((data) => {
        const isEmpty = (value: any): boolean => {
          return (
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' &&
              value !== null &&
              Object.keys(value).length === 0)
          );
        };

        const cleanData = (input: any): any => {
          if (Array.isArray(input)) {
            return input.map(cleanData).filter((item) => !isEmpty(item)); // Filter out empty items
          } else if (typeof input === 'object' && input !== null) {
            return Object.entries(input).reduce((acc, [key, value]) => {
              const cleanedValue = cleanData(value);
              if (!isEmpty(cleanedValue)) {
                acc[key] = cleanedValue;
              }
              return acc;
            }, {} as { [key: string]: any });
          }
          return input;
        };

        return cleanData(data);
      })
    );
  }

}
