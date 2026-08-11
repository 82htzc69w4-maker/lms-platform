export type AppraisalRating = 'exceeds' | 'meets' | 'below' | 'unsatisfactory';

export type PerformanceAppraisal = {
  id: string;
  username: string;
  employeeName: string;
  department?: string;
  appraisalDate: string;
  rating: AppraisalRating;
  reviewerUsername: string;
  reviewerName: string;
  comments: string;
  createdAt: string;
};
