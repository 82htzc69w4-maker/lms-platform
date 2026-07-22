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
};
