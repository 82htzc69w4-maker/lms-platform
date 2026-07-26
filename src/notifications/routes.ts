import { Hono } from 'hono';
import type { Env } from '../types';
import { kvPutJSON, kvGetJSON, kvListByPrefix } from '../lib/kv';
import type { Notification } from './types';
import { getSessionUser } from '../auth/session';

const notifications = new Hono<{ Bindings: Env }>();

// GET /api/notifications/mine — the logged-in user's notifications, newest first
notifications.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, 'notification:');
  const items: Notification[] = [];
  for (const key of list.keys) {
    const n = await kvGetJSON<Notification>(c.env, key.name);
    if (n && n.username === session.username) items.push(n);
  }
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ notifications: items });
});

export default notifications;

// Shared helper used by other route modules to create a notification for a
// learner — not exposed as its own endpoint, just a plain function.
export async function createNotification(
  env: Env,
  username: string,
  message: string,
  courseId?: string
): Promise<void> {
  const notification: Notification = {
    id: crypto.randomUUID(),
    username,
    message,
    courseId,
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(env, `notification:${notification.id}`, notification);
}
