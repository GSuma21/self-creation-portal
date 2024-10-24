import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Inject, Output, ViewEncapsulation } from '@angular/core';
import {MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'lib-preview',
  standalone: true,
  imports: [MatIconModule,MatDialogModule],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  encapsulation:ViewEncapsulation.None
})
export class PreviewComponent {
  config = {
    maxFileSize: 50,
    baseUrl: "",
    accessToken: "",
    profileInfo: {},
    isPreview: true
  }
  projectData ={
    "id": "5342",//
    "title": "test ",//
    "categories": [
        "teachers",
        "students"
    ],//
    "objective": "dddjf",//
    "recommended_duration": {
        "number": "12",
        "duration": "weeks"
    },//
    "keywords": "ereer",
    "recommended_for": [
        "hm",
        "ht"
    ],//
    "languages": [
        "bengali",
        "gujarati"
    ],
    "learning_resources": [
        {
            "name": "ls",
            "url": "https://fddf"
        }
    ],//
    "licenses": "cc_by_4.0",
    "formMeta": {
        "formValidation": {
            "projectDetails": "VALID",
            "tasks": "VALID",
            "subTasks": "VALID",
            "certificates": "VALID"
        },
        "isCertificateSelected": "1",
        "isProjectEvidenceSelected": "1",
        "taskEvidenceSelected": {
            "67fe1828-bd5a-4384-9c56-923aac489a1b": 1,
            "663ebe06-9708-4d52-94f2-a8f6bb676818": 1
        }
    },
    "tasks": [
        {
            "id": "67fe1828-bd5a-4384-9c56-923aac489a1b",//
            "name": "task 1",//
            "is_mandatory": true,//
            "allow_evidences": true,//
            "evidence_details": {
                "file_types": [
                    "document",
                    "videos"
                ],
                "min_no_of_evidences": 5
            },//
            "learning_resources": [],//
            "children": [],//
            "type": "simple",//
            "sequence_no": 1,
            "solution_details": {
                "name": "observation",
                "link": "https://qa.elevate-ml.shikshalokam.org/view/observation/beb6e72ad73a097b9d7910e45a613431",
                "min_no_of_submissions_required": 1,
                "type": "observation"
            },//
            "values": "8",
            "slicedName": "task 1"
        },
        {
            "id": "663ebe06-9708-4d52-94f2-a8f6bb676818",
            "name": "task 2",
            "is_mandatory": false,
            "allow_evidences": true,
            "evidence_details": {
                "file_types": [
                    "images",
                    "document",
                    "videos",
                    "audio"
                ],
                "min_no_of_evidences": 1
            },
            "learning_resources": [
                {
                    "name": "rejjh",
                    "url": "https:///dfdf"
                }
            ],
            "children": [
                {
                    "id": "c0b12c45-ded0-4bdf-a18c-aa387fa68929",
                    "name": "fdjdfj",
                    "type": "content",
                    "parent_id": "663ebe06-9708-4d52-94f2-a8f6bb676818",
                    "sequence_no": 1,
                    "is_mandatory": false,
                    "allow_evidences": true
                },
                {
                    "id": "6dd9e27c-1742-42e4-b62c-7e0a529b7207",
                    "name": "fdjkfdjkjkdf",
                    "type": "content",
                    "parent_id": "663ebe06-9708-4d52-94f2-a8f6bb676818",
                    "sequence_no": 2,
                    "is_mandatory": false,
                    "allow_evidences": true
                }
            ],
            "type": "content",
            "sequence_no": 2,
            "solution_details": {},
            "values": "12",
            "slicedName": "task 2"
        }
    ],
    "certificate": {
        "base_template_id": 1,
        "base_template_url": "https://mentoring-prod-storage.s3.ap-south-1.amazonaws.com/certfile_BASE_TEMPLATE/system/cert/98c89226-c694-439f-9070-cc3ffe4315fd/one_logo_one_sign.svg",
        "code": "one_logo_one_sign",
        "name": "One Logo One Signature",
        "logos": {
            "no_of_logos": 1,
            "stateLogo1": "https://mentoring-prod-storage.s3.ap-south-1.amazonaws.com/certificate/234/certificate/4c85b194-2d20-4764-8328-704e82a28e43/logo%20one%20logo%20with%20one%20logo%20one%20logo%20%282%29.png",
            "stateLogo2": ""
        },
        "signature": {
            "no_of_signature": 1,
            "signatureImg1": "https://mentoring-prod-storage.s3.ap-south-1.amazonaws.com/certificate/234/certificate/b6a940cf-7cd7-49a3-9095-26a6c5a626c7/image-120x50%20%282%29.png",
            "signatureTitleName1": "sdffd",
            "signatureTitleDesignation1": "sd",
            "signatureImg2": "",
            "signatureTitleName2": "",
            "signatureTitleDesignation2": ""
        },
        "issuer": "sdjsjdjd",
        "criteria": {
            "validationText": "Complete validation message",
            "expression": "C1&&C3&&C2",
            "conditions": {
                "C1": {
                    "validationText": "Project Should be submitted.",
                    "expression": "C1",
                    "conditions": {
                        "C1": {
                            "scope": "project",
                            "key": "status",
                            "operator": "==",
                            "value": "submitted"
                        }
                    }
                },
                "C2": {
                    "validationText": "Evidence project level validation",
                    "expression": "C1",
                    "conditions": {
                        "C1": {
                            "scope": "project",
                            "key": "attachments",
                            "function": "count",
                            "filter": {
                                "key": "type",
                                "value": "all"
                            },
                            "operator": ">=",
                            "value": "5"
                        }
                    }
                },
                "C3": {
                    "validationText": "Evidence task level validation",
                    "expression": "67fe1828-bd5a-4384-9c56-923aac489a1b&&663ebe06-9708-4d52-94f2-a8f6bb676818",
                    "conditions": {
                        "67fe1828-bd5a-4384-9c56-923aac489a1b": {
                            "scope": "task",
                            "key": "attachments",
                            "function": "count",
                            "filter": {
                                "key": "type",
                                "value": "all"
                            },
                            "operator": ">=",
                            "value": "8",
                            "taskDetails": [
                                "67fe1828-bd5a-4384-9c56-923aac489a1b"
                            ]
                        },
                        "663ebe06-9708-4d52-94f2-a8f6bb676818": {
                            "scope": "task",
                            "key": "attachments",
                            "function": "count",
                            "filter": {
                                "key": "type",
                                "value": "all"
                            },
                            "operator": ">=",
                            "value": "12",
                            "taskDetails": [
                                "663ebe06-9708-4d52-94f2-a8f6bb676818"
                            ]
                        }
                    }
                }
            }
        }
    }
}
constructor(public dialogRef: MatDialogRef<PreviewComponent>,
    @Inject(MAT_DIALOG_DATA)  public dialogData: any) {}

}
