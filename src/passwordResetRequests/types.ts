export type PasswordResetRequest = {
  id: string;
  username: string;
  requestedAt: string;
  status: 'pending' | 'resolved';
  resolvedByUsername?: string;
  resolvedByName?: string;
  resolvedAt?: string;
};
