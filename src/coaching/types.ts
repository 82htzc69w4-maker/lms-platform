export type AttemptSnapshot = {
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number | null;
  failedQuestionTexts: string[];
  submittedAt: string;
};

export type CoachingNotification = {
  id: string;
  username: string;
  learnerName: string;
  courseId: string;
  courseTitle: string;
  blockId: string;
  attempts: AttemptSnapshot[];
  createdAt: string;
  resolved: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledByName?: string;
};

export type CoachingSession = {
  id: string;
  notificationId: string;
  username: string;
  courseId: string;
  courseTitle: string;
  coachUsername: string;
  coachName: string;
  notes: string;
  sessionDate: string;
  sessionTime: string;
  department?: string;
  createdAt: string;
};
