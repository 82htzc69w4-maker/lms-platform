import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { PasswordResetRequest } from './types';
import { getSessionUser } from '../auth/session';
import { hashPassword } from '../auth/crypto';
import type { User } from '../auth/types';

const passwordResetRequests = new Hono<{ Bindings: Env }>();

// POST /api/password-reset-requests — anyone locked out can submit this,
// no login required. There's no email/SMS service configured on this
// deployment, so this can't send a reset link — it queues a request for an
// Admin/Administrator to act on and communicate the new password out of
// band (in person, via a separate channel, etc).
passwordResetRequests.post('/', async (c) => {
  const body = await c.req.json<{ username: string }>();
  if (!body.username?.trim()) {
    return c.json({ error: 'username is required' }, 400);
  }

  const username = body.username.trim();
  const user = await kvGetJSON<User>(c.env, `auth:user:${username}`);

  // Always respond the same way regardless of whether the account exists,
  // so this can't be used to enumerate valid usernames.
  if (user) {
    const request: PasswordResetRequest = {
      id: crypto.randomUUID(),
      username,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    await kvPutJSON(c.env, `password-reset-request:${request.id}`, request);
  }

  return c.json({ ok: true });
});

function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'administrator';
}

// GET /api/password-reset-requests — every pending request (Admin/Administrator only)
passwordResetRequests.get('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isAdminRole(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const list = await kvListByPrefix(c.env, 'password-reset-request:');
  const requests: PasswordResetRequest[] = [];
  for (const key of list.keys) {
    const r = await kvGetJSON<PasswordResetRequest>(c.env, key.name);
    if (r && r.status === 'pending') requests.push(r);
  }
  requests.sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
  return c.json({ requests });
});

// POST /api/password-reset-requests/:id/resolve — set a new password for
// the requesting account and mark the request resolved (Admin/Administrator only)
passwordResetRequests.post('/:id/resolve', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isAdminRole(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const id = c.req.param('id');
  const request = await kvGetJSON<PasswordResetRequest>(c.env, `password-reset-request:${id}`);
  if (!request) return c.json({ error: 'Request not found' }, 404);

  const body = await c.req.json<{ newPassword: string }>();
  if (!body.newPassword || body.newPassword.length < 6) {
    return c.json({ error: 'newPassword must be at least 6 characters' }, 400);
  }

  const user = await kvGetJSON<User>(c.env, `auth:user:${request.username}`);
  if (!user) return c.json({ error: 'Account no longer exists' }, 404);

  user.passwordHash = await hashPassword(body.newPassword);
  await kvPutJSON(c.env, `auth:user:${request.username}`, user);

  request.status = 'resolved';
  request.resolvedByUsername = session.username;
  const resolverUser = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);
  request.resolvedByName = resolverUser?.name || session.username;
  request.resolvedAt = new Date().toISOString();
  await kvPutJSON(c.env, `password-reset-request:${id}`, request);

  return c.json({ ok: true });
});

export default passwordResetRequests;
