export type QuestionType = 'multipleChoice' | 'trueFalse' | 'written' | 'matching' | 'ordering';

export type MultipleChoiceOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type MatchingPair = {
  id: string;
  left: string;
  right: string;
};

export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  marks?: number;
  // Multiple choice
  options?: MultipleChoiceOption[];
  // True / False
  correctBoolean?: boolean;
  // Written
  modelAnswer?: string;
  // Matching
  pairs?: MatchingPair[];
  // Ordering — items listed in the correct order
  orderedItems?: string[];
};

export type Test = {
  blockId: string;
  questions: Question[];
  passingRatePercent?: number;
  maxAttempts?: number;
};

export type QuestionResult = {
  questionId: string;
  type: QuestionType;
  correct: boolean | null; // null = not auto-gradable (written)
  pointsEarned: number;
  pointsPossible: number;
  correctAnswerSummary?: string;
  questionText?: string;
};

export type Attempt = {
  blockId: string;
  courseId?: string;
  username: string;
  attemptNumber: number;
  results: QuestionResult[];
  score: number;
  maxScore: number;
  passingRatePercent?: number;
  passed: boolean | null;
  failedQuestionTexts: string[];
  submittedAt: string;
};
