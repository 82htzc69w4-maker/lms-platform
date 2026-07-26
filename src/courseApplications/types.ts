export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type CourseApplication = {
  id: string;
  username: string;
  learnerName: string;
  courseId: string;
  courseTitle: string;
  motivation: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};
