import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { CoachingNotification, CoachingSession } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { Enrollment } from '../courses/types';
import type { LearnerProfile } from '../users/types';

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

// GET /api/coaching/notifications/mine — the logged-in learner's own
// coaching notifications (so they can see if they're currently blocked and
// awaiting a session, not just their resolved history).
coaching.get('/notifications/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, 'coaching:notification:');
  const notifications: CoachingNotification[] = [];
  for (const key of list.keys) {
    const n = await kvGetJSON<CoachingNotification>(c.env, key.name);
    if (n && n.username === session.username) notifications.push(n);
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

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

// POST /api/coaching/notifications/:id/schedule — the facilitator books a
// date and time for an upcoming coaching session. This doesn't resolve the
// notification or unblock the course — it just lets the learner see when
// their session is planned. Can be called again to reschedule.
coaching.post('/notifications/:id/schedule', async (c) => {
  const coachSession = await getSessionUser(c);
  if (!coachSession || !isStaff(coachSession.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const notificationId = c.req.param('id');
  const notification = await kvGetJSON<CoachingNotification>(c.env, `coaching:notification:${notificationId}`);
  if (!notification) return c.json({ error: 'Notification not found' }, 404);

  const body = await c.req.json<{ scheduledDate: string; scheduledTime: string }>();
  if (!body.scheduledDate || !body.scheduledTime) {
    return c.json({ error: 'scheduledDate and scheduledTime are required' }, 400);
  }

  const coachUser = await kvGetJSON<User>(c.env, `auth:user:${coachSession.username}`);

  notification.scheduledDate = body.scheduledDate;
  notification.scheduledTime = body.scheduledTime;
  notification.scheduledByName = coachUser?.name || coachSession.username;
  await kvPutJSON(c.env, `coaching:notification:${notificationId}`, notification);

  return c.json({ ok: true, notification });
});

// GET /api/coaching/sessions — every coaching session ever logged, for
// Management Reporting (Instructor/Admin/Administrator only)
coaching.get('/sessions', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const list = await kvListByPrefix(c.env, 'coaching:session:');
  const sessions: CoachingSession[] = [];
  for (const key of list.keys) {
    const s = await kvGetJSON<CoachingSession>(c.env, key.name);
    if (s) sessions.push(s);
  }
  sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ sessions });
});

// POST /api/coaching/notifications/:id/resolve — records what the coach did
// (including exactly when the session took place), unblocks the learner's
// enrollment, and resets their test attempts so they can retake the course.
coaching.post('/notifications/:id/resolve', async (c) => {
  const coachSession = await getSessionUser(c);
  if (!coachSession) return c.json({ error: 'Not logged in' }, 401);

  const notificationId = c.req.param('id');
  const notification = await kvGetJSON<CoachingNotification>(c.env, `coaching:notification:${notificationId}`);
  if (!notification) return c.json({ error: 'Notification not found' }, 404);

  const body = await c.req.json<{ notes: string; sessionDate: string; sessionTime: string }>();
  if (!body.notes || !body.notes.trim()) {
    return c.json({ error: 'notes is required' }, 400);
  }
  if (!body.sessionDate) {
    return c.json({ error: 'sessionDate is required' }, 400);
  }
  if (!body.sessionTime) {
    return c.json({ error: 'sessionTime is required' }, 400);
  }

  const coachUser = await kvGetJSON<User>(c.env, `auth:user:${coachSession.username}`);
  const learnerProfile = await kvGetJSON<LearnerProfile>(c.env, `learner:profile:${notification.username}`);

  const coachingSession: CoachingSession = {
    id: crypto.randomUUID(),
    notificationId,
    username: notification.username,
    courseId: notification.courseId,
    courseTitle: notification.courseTitle,
    coachUsername: coachSession.username,
    coachName: coachUser?.name || coachSession.username,
    notes: body.notes.trim(),
    sessionDate: body.sessionDate,
    sessionTime: body.sessionTime,
    department: learnerProfile?.department,
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
