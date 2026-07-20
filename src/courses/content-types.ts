export type ContentBlockType =
  // Standard Content
  | 'heading'
  | 'text'
  | 'webContent'
  | 'presentation'
  // Learning Activity
  | 'mobileUpload' // SCORM/HTML/CMI5
  | 'test'
  | 'assignmentUpload'
  | 'assessmentUpload'
  | 'externalCertificate'
  | 'experientialLog';

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  title: string;
  createdAt: string;
};

export type CourseContent = {
  courseId: string;
  blocks: ContentBlock[];
};
