export type IncidentType = 'injury' | 'near_miss' | 'property_damage' | 'safety_violation' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentReport = {
  id: string;
  username: string;
  employeeName: string;
  department?: string;
  incidentDate: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  courseId?: string;
  courseTitle?: string;
  reportedByUsername: string;
  reportedByName: string;
  createdAt: string;
};
