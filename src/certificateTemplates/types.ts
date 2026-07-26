export type CertificateType = 'competency' | 'completion';

export type CertificateOrientation = 'landscape' | 'portrait';

export type CertificateTemplate = {
  courseId: string;
  certificateType: CertificateType;
  orientation: CertificateOrientation;
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
};

export const DEFAULT_CERTIFICATE_TEMPLATE: Omit<CertificateTemplate, 'courseId'> = {
  certificateType: 'completion',
  orientation: 'landscape',
  includeLogo: true,
  includeStudentName: true,
  includeCourseName: true,
  includeCourseDate: true,
  includeCourseNumber: false,
  includeSignatory: true,
  includeExpiryDate: false,
};
