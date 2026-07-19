export type Course = {
  id: string;
  title: string;
  description: string;
  category?: string;
  status: 'draft' | 'published';
};

export type Enrollment = {
  username: string;
  courseId: string;
  registeredAt: string;
  status: 'active' | 'completed';
};
