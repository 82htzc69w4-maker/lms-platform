import type { CertificateType } from '../certificateTemplates/types';

export type IssuedCertificate = {
  id: string;
  username: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  courseNumber: string;
  certificateType: CertificateType;
  includeLogo: boolean;
  includeStudentName: boolean;
  includeCourseName: boolean;
  includeCourseDate: boolean;
  includeCourseNumber: boolean;
  includeSignatory: boolean;
  includeExpiryDate: boolean;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureDataUrl?: string;
  backgroundImageDataUrl?: string;
  backgroundBrightness?: number;
  backgroundOpacity?: number;
  borderColor?: string;
  logoDataUrl?: string;
  issuedDate: string;
  expiryDate?: string;
};
