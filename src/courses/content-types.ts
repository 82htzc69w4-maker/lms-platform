export type ContentBlockType =
  // Modules — a container marker; every block type below can sit inside one
  | 'module'
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
  | 'experientialLog'
  // Section Controls
  | 'forwardButton'
  | 'backButton'
  | 'endOfSection';

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
