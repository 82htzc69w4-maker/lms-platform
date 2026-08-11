export type ProductivityMetric = {
  id: string;
  username: string;
  employeeName: string;
  department?: string;
  metricName: string;
  value: number;
  unit?: string;
  recordedDate: string;
  notes?: string;
  recordedByUsername: string;
  recordedByName: string;
  createdAt: string;
};
