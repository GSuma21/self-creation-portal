export const PROJECT_DETAILS_PAGE = 'solution/project/project-details'
export const SUBMITTED_FOR_REVIEW = 'home/submit-for-review'
export const DRAFTS = 'home/drafts'
export const UP_FOR_REVIEW = 'home/up-for-review'
export const BROWSE_EXISTING = 'home/browse-existing'
export const resourceStatus = {
    SUBMITTED: 'SUBMITTED',
    PUBLISHED: 'PUBLISHED',
    REJECTED: 'REJECTED',
    REJECTED_AND_REPORTED: 'REJECTED_AND_REPORTED',
    IN_REVIEW: 'IN_REVIEW',
    COMMENTS: 'COMMENTS',
    DRAFT:"DRAFT",
    REVIEW:"REVIEW",
    IN_PROGRESS:"INPROGRESS",
    REQUEST_FOR_CHANGES:'REQUESTED_FOR_CHANGES',
};
export const reviewStatus = {
    NOT_STARTED: 'NOT_STARTED',
    INPROGRESS: 'IN_PROGRESS',
    REQUEST_FOR_CHANGES:'REQUESTED_FOR_CHANGES',
    CHANGES_UPDATED:'CHANGES_UPDATED'

};
export const projectMode = {
  VIEWONLY: 'viewOnly',
  EDIT: 'edit',
  REQUEST_FOR_EDIT:'reqEdit',
  CREATOR_VIEW:'creatorView',
  REVIEWER_VIEW:'reviewerView',
  REVIEW:'review',
  COPY_EDIT:"copyEdit"
};
export const ROUTE_PATHS = {
    SIDENAV: {
      BROWSE_EXISTING: 'browse-existing',
      DRAFTS: 'drafts',
      UP_FOR_REVIEW: 'up-for-review',
      SUBMITTED_FOR_REVIEW: 'submitted-for-review',
    },
    PROJECT_ROUTES: {
      PROJECT_DETAILS: PROJECT_DETAILS_PAGE,
    }
};
