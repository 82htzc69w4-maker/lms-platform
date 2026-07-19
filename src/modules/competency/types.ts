// Types for the Competency Engine module

export type CompetencyType = 'skill' | 'certification';

export type Competency = {
  id: string;
  name: string;
  type: CompetencyType;
  category?: string;
  /** For certifications that lapse after a period. Skills typically leave this undefined. */
  expiresAfterMonths?: number;
};

export type LinkSourceType =
  | 'course'
  | 'assessment'
  | 'observation'
  | 'coaching_session'
  | 'practical_task';

export type LinkResult = 'pass' | 'fail' | 'pending';

export type CompetencyLink = {
  competencyId: string;
  sourceType: LinkSourceType;
  sourceId: string;
  result: LinkResult;
  date: string; // ISO date
};

export type CompetencyStatusValue = 'competent' | 'not_competent' | 'needs_refresher' | 'expired';

export type CompetencyStatus = {
  competencyId: string;
  status: CompetencyStatusValue;
  autoCalculated: boolean;
  overriddenBy?: string;
  overrideReason?: string;
  lastEvaluated: string; // ISO date
  expiresOn?: string; // ISO date, for certifications
};

export type EmployeeSkillsMatrix = {
  employeeId: string;
  statuses: Record<string, CompetencyStatus>; // keyed by competencyId
  links: CompetencyLink[];
};
