export type User = {
  username: string;
  passwordHash: string;
  name: string;
  role: string;
};

export type Session = {
  username: string;
  name: string;
  role: string;
  createdAt: string;
};
