// TEMPORARY account recovery module — added to help regain access after
// losing login credentials. This must be removed as soon as access is
// restored; it is a real security hole if left in place.
import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { User } from '../auth/types';
import { hashPassword } from '../auth/crypto';

const tempRecovery = new Hono<{ Bindings: Env }>();

const RECOVERY_SECRET = 'temp-recovery-9f2a7c1e';

// GET /api/temp-recovery/list-users?key=... — lists every account's
// username, name, and role (never password hashes)
tempRecovery.get('/list-users', async (c) => {
  if (c.req.query('key') !== RECOVERY_SECRET) return c.json({ error: 'Not authorized' }, 403);

  const list = await kvListByPrefix(c.env, 'auth:user:');
  const users: Array<{ username: string; name: string; role: string }> = [];
  for (const key of list.keys) {
    const u = await kvGetJSON<User>(c.env, key.name);
    if (u) users.push({ username: u.username, name: u.name, role: u.role });
  }
  return c.json({ users });
});

// POST /api/temp-recovery/reset-password — sets a specific account's
// password to a known value so you can log back in
tempRecovery.post('/reset-password', async (c) => {
  const body = await c.req.json<{ key: string; username: string; newPassword: string }>();
  if (body.key !== RECOVERY_SECRET) return c.json({ error: 'Not authorized' }, 403);
  if (!body.username || !body.newPassword) return c.json({ error: 'username and newPassword are required' }, 400);

  const user = await kvGetJSON<User>(c.env, `auth:user:${body.username}`);
  if (!user) return c.json({ error: 'User not found' }, 404);

  user.passwordHash = await hashPassword(body.newPassword);
  await kvPutJSON(c.env, `auth:user:${body.username}`, user);

  return c.json({ ok: true, username: body.username });
});

export default tempRecovery;
