export type Role = 'learner' | 'instructor' | 'admin' | 'administrator';

export type User = {
  username: string;
  passwordHash: string;
  name: string;
  firstName: string;
  surname: string;
  role: Role;
};

export type Session = {
  username: string;
  name: string;
  role: Role;
  createdAt: string;
};
