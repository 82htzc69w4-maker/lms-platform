export type ObservationOutcome = 'competent' | 'not_yet_competent' | 'needs_improvement';

export type WorkplaceObservation = {
  id: string;
  username: string;
  employeeName: string;
  observedByUsername: string;
  observedByName: string;
  observationDate: string;
  taskObserved: string;
  outcome: ObservationOutcome;
  notes: string;
  createdAt: string;
};
