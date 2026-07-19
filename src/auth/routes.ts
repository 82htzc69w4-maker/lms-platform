import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { User, Session } from './types';
import { hashPassword, generateSessionToken } from './crypto';

const auth = new Hono<{ Bindings: Env }>();

const SESSION_COOKIE = 'lms_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// POST /api/auth/login
// If no users exist yet, the first successful login bootstraps that
// username/password as the initial admin account.
auth.post('/login', async (c) => {
  const body = await c.req.json<{ username: string; password: string }>();
  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  const existingUsersList = await kvListByPrefix(c.env, 'auth:user:');
  const passwordHash = await hashPassword(password);

  let user: User | null = null;

  if (existingUsersList.keys.length === 0) {
    // Bootstrap: first login creates the first account, as the top-level
    // Administrator role (full system control, including user management).
    user = { username, passwordHash, name: username, role: 'administrator' };
    await kvPutJSON(c.env, `auth:user:${username}`, user);
  } else {
    const stored = await kvGetJSON<User>(c.env, `auth:user:${username}`);
    if (!stored || stored.passwordHash !== passwordHash) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    user = stored;
  }

  const token = generateSessionToken();
  const session: Session = {
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `auth:session:${token}`, session);

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return c.json({ ok: true, user: session });
});

// GET /api/auth/me
auth.get('/me', async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) {
    return c.json({ error: 'Not logged in' }, 401);
  }

  const session = await kvGetJSON<Session>(c.env, `auth:session:${token}`);
  if (!session) {
    return c.json({ error: 'Session expired' }, 401);
  }

  return c.json({ user: session });
});

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await c.env.LMS_KV.delete(`auth:session:${token}`);
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
});

export default auth;
