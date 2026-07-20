export type ContentBlockType =
  // Standard Content
  | 'heading'
  | 'subtitle'
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

export type HeadingLayout = 'textOnly' | 'imageLeft' | 'bannerTop';

export type ContentBlockSettings = {
  layout?: HeadingLayout;
  imageDataUrl?: string;
};

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  title: string;
  createdAt: string;
  settings?: ContentBlockSettings;
};

export type CourseContent = {
  courseId: string;
  blocks: ContentBlock[];
};
