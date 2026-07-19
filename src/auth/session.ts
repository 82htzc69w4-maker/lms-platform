import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env } from '../types';
import { kvGetJSON } from '../lib/kv';
import type { Session } from './types';

const SESSION_COOKIE = 'lms_session';

export async function getSessionUser(c: Context<{ Bindings: Env }>): Promise<Session | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const session = await kvGetJSON<Session>(c.env, `auth:session:${token}`);
  return session ?? null;
}
