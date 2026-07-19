export type Course = {
  id: string;
  title: string;
  description: string;
  category?: string;
};

export type Enrollment = {
  username: string;
  courseId: string;
  registeredAt: string;
  status: 'active' | 'completed';
};
