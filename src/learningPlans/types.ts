export type LearningPlanStatus = 'active' | 'completed' | 'cancelled';

export type LearningPlan = {
  id: string;
  username: string;
  employeeName: string;
  department?: string;
  sourceAppraisalId: string;
  identifiedGap: string;
  baselineRating: string;
  assignedCourseIds: string[];
  assignedCourseTitles: string[];
  coachingCompleted: boolean;
  coachingDate?: string;
  coachingNotes?: string;
  status: LearningPlanStatus;
  createdByUsername: string;
  createdByName: string;
  createdAt: string;
};
