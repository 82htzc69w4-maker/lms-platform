import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { CoachingNotification, CoachingSession } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { Enrollment } from '../courses/types';

const coaching = new Hono<{ Bindings: Env }>();

// GET /api/coaching/notifications — every coaching notification, newest first
coaching.get('/notifications', async (c) => {
  const list = await kvListByPrefix(c.env, 'coaching:notification:');
  const notifications: CoachingNotification[] = [];
  for (const key of list.keys) {
    const n = await kvGetJSON<CoachingNotification>(c.env, key.name);
    if (n) notifications.push(n);
  }
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ notifications });
});

// GET /api/coaching/sessions/mine — the logged-in learner's own coaching session history
coaching.get('/sessions/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, 'coaching:session:');
  const sessions: CoachingSession[] = [];
  for (const key of list.keys) {
    const s = await kvGetJSON<CoachingSession>(c.env, key.name);
    if (s && s.username === session.username) sessions.push(s);
  }
  sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ sessions });
});

// POST /api/coaching/notifications/:id/resolve — records what the coach did,
// unblocks the learner's enrollment, and resets their test attempts so they
// can retake the course.
coaching.post('/notifications/:id/resolve', async (c) => {
  const coachSession = await getSessionUser(c);
  if (!coachSession) return c.json({ error: 'Not logged in' }, 401);

  const notificationId = c.req.param('id');
  const notification = await kvGetJSON<CoachingNotification>(c.env, `coaching:notification:${notificationId}`);
  if (!notification) return c.json({ error: 'Notification not found' }, 404);

  const body = await c.req.json<{ notes: string }>();
  if (!body.notes || !body.notes.trim()) {
    return c.json({ error: 'notes is required' }, 400);
  }

  const coachUser = await kvGetJSON<User>(c.env, `auth:user:${coachSession.username}`);

  const coachingSession: CoachingSession = {
    id: crypto.randomUUID(),
    notificationId,
    username: notification.username,
    courseId: notification.courseId,
    courseTitle: notification.courseTitle,
    coachUsername: coachSession.username,
    coachName: coachUser?.name || coachSession.username,
    notes: body.notes.trim(),
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `coaching:session:${coachingSession.id}`, coachingSession);

  notification.resolved = true;
  await kvPutJSON(c.env, `coaching:notification:${notificationId}`, notification);

  // Unblock the learner's enrollment for this course
  const enrollmentKey = `enrollment:${notification.username}:${notification.courseId}`;
  const enrollment = await kvGetJSON<Enrollment>(c.env, enrollmentKey);
  if (enrollment) {
    enrollment.blocked = false;
    enrollment.status = 'active';
    await kvPutJSON(c.env, enrollmentKey, enrollment);
  }

  // Reset test attempts so the learner starts fresh
  await c.env.LMS_KV.delete(`test:attempts:${notification.blockId}:${notification.username}`);

  return c.json({ ok: true, session: coachingSession });
});

export default coaching;
