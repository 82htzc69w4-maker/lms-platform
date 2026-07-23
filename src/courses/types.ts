export type Course = {
  id: string;
  courseNumber: string;
  title: string;
  instructor: string;
  duration: string;
  description: string;
  category?: string;
  outcomes: string;
  linkedStandards: string;
  status: 'draft' | 'published';
  imageDataUrl?: string;
  bannerDataUrl?: string;
  bannerFit?: 'cover' | 'contain';
  bannerHeight?: number;
  developmentStartDate?: string;
  instructorUsername?: string;
  validityMonths?: number;
};

export type Enrollment = {
  username: string;
  courseId: string;
  registeredAt: string;
  status: 'active' | 'completed';
};
