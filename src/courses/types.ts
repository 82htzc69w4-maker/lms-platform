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
  completionPeriodDays?: number;
};

export type Enrollment = {
  username: string;
  courseId: string;
  registeredAt: string;
  status: 'active' | 'completed';
  completedAt?: string;
  blocked?: boolean;
  overdueFlagged?: boolean;
};

export type OverdueCourseAlert = {
  id: string;
  username: string;
  learnerName: string;
  courseId: string;
  courseTitle: string;
  registeredAt: string;
  dueDate: string;
  flaggedAt: string;
};
