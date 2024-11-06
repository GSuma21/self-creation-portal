export const rejectform = {
    "name": "title",
    "label": "Add a reason",
    "value": "",
    "class": "",
    "type": "text",
    "placeHolder": "Reason for reporting the content",
    "position": "floating",
    "errorMessage": {
      "required": "Enter a valid reason",
      "maxLength": "Reason must not exceed 256 characters"
    },
    "validators": {
      "required": false,
      "maxLength": 255
    }
  }