import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { CoachingNotification, CoachingSession, CoachingScheduleEvent } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { Enrollment } from '../courses/types';
import type { LearnerProfile } from '../users/types';
import { createNotification } from '../notifications/routes';

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

async function logScheduleEvent(
  env: Env,
  notification: CoachingNotification,
  action: 'proposed' | 'accepted',
  actorRole: 'facilitator' | 'learner',
  actorName: string,
  scheduledDate: string,
  scheduledTime: string
): Promise<void> {
  const event: CoachingScheduleEvent = {
    id: crypto.randomUUID(),
    notificationId: notification.id,
    username: notification.username,
    courseId: notification.courseId,
    courseTitle: notification.courseTitle,
    action,
    actorRole,
    actorName,
    scheduledDate,
    scheduledTime,
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(env, `coaching:schedule-event:${event.id}`, event);
}

// GET /api/coaching/notifications/:id/schedule-history — every scheduling
// change (proposed or accepted, by either side) for one coaching
// notification. Accessible to the learner it belongs to, or any staff member.
coaching.get('/notifications/:id/schedule-history', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const notificationId = c.req.param('id');
  const notification = await kvGetJSON<CoachingNotification>(c.env, `coaching:notification:${notificationId}`);
  if (!notification) return c.json({ error: 'Notification not found' }, 404);
  if (notification.username !== session.username && !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const list = await kvListByPrefix(c.env, 'coaching:schedule-event:');
  const events: CoachingScheduleEvent[] = [];
  for (const key of list.keys) {
    const e = await kvGetJSON<CoachingScheduleEvent>(c.env, key.name);
    if (e && e.notificationId === notificationId) events.push(e);
  }
  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ events });
});

// POST /api/coaching/notifications/:id/schedule — the facilitator proposes
// (or re-proposes) a date and time for an upcoming coaching session. This
// doesn't resolve the notification or unblock the course — it just lets the
// learner see and respond to when their session is planned.
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
  notification.scheduledByUsername = coachSession.username;
  notification.proposedBy = 'facilitator';
  notification.scheduleStatus = 'proposed';
  await kvPutJSON(c.env, `coaching:notification:${notificationId}`, notification);
  await logScheduleEvent(
    c.env,
    notification,
    'proposed',
    'facilitator',
    coachUser?.name || coachSession.username,
    body.scheduledDate,
    body.scheduledTime
  );

  return c.json({ ok: true, notification });
});

// POST /api/coaching/notifications/:id/accept-schedule — the facilitator
// accepts the learner's proposed date/time as-is, without changing it.
coaching.post('/notifications/:id/accept-schedule', async (c) => {
  const coachSession = await getSessionUser(c);
  if (!coachSession || !isStaff(coachSession.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const notificationId = c.req.param('id');
  const notification = await kvGetJSON<CoachingNotification>(c.env, `coaching:notification:${notificationId}`);
  if (!notification) return c.json({ error: 'Notification not found' }, 404);
  if (!notification.scheduledDate) return c.json({ error: 'No session has been proposed yet' }, 400);

  notification.scheduleStatus = 'accepted';
  await kvPutJSON(c.env, `coaching:notification:${notificationId}`, notification);

  const coachUser = await kvGetJSON<User>(c.env, `auth:user:${coachSession.username}`);
  await logScheduleEvent(
    c.env,
    notification,
    'accepted',
    'facilitator',
    coachUser?.name || coachSession.username,
    notification.scheduledDate,
    notification.scheduledTime!
  );

  return c.json({ ok: true, notification });
});

// POST /api/coaching/notifications/:id/learner-respond — the learner either
// accepts the currently proposed date/time, or proposes a different one
// (which notifies the facilitator who made the original booking).
coaching.post('/notifications/:id/learner-respond', async (c) => {
  const learnerSession = await getSessionUser(c);
  if (!learnerSession) return c.json({ error: 'Not logged in' }, 401);

  const notificationId = c.req.param('id');
  const notification = await kvGetJSON<CoachingNotification>(c.env, `coaching:notification:${notificationId}`);
  if (!notification) return c.json({ error: 'Notification not found' }, 404);
  if (notification.username !== learnerSession.username) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const body = await c.req.json<{ action: 'accept' | 'propose'; scheduledDate?: string; scheduledTime?: string }>();
  const learnerUser = await kvGetJSON<User>(c.env, `auth:user:${learnerSession.username}`);

  if (body.action === 'accept') {
    if (!notification.scheduledDate) return c.json({ error: 'No session has been proposed yet' }, 400);
    notification.scheduleStatus = 'accepted';
    await kvPutJSON(c.env, `coaching:notification:${notificationId}`, notification);
    await logScheduleEvent(
      c.env,
      notification,
      'accepted',
      'learner',
      learnerUser?.name || learnerSession.username,
      notification.scheduledDate,
      notification.scheduledTime!
    );
    return c.json({ ok: true, notification });
  }

  if (body.action === 'propose') {
    if (!body.scheduledDate || !body.scheduledTime) {
      return c.json({ error: 'scheduledDate and scheduledTime are required' }, 400);
    }
    notification.scheduledDate = body.scheduledDate;
    notification.scheduledTime = body.scheduledTime;
    notification.proposedBy = 'learner';
    notification.scheduleStatus = 'proposed';
    await kvPutJSON(c.env, `coaching:notification:${notificationId}`, notification);
    await logScheduleEvent(
      c.env,
      notification,
      'proposed',
      'learner',
      learnerUser?.name || learnerSession.username,
      body.scheduledDate,
      body.scheduledTime
    );

    if (notification.scheduledByUsername) {
      await createNotification(
        c.env,
        notification.scheduledByUsername,
        `${notification.learnerName} proposed a new coaching time for "${notification.courseTitle}": ${body.scheduledDate} at ${body.scheduledTime}.`,
        notification.courseId
      );
    }

    return c.json({ ok: true, notification });
  }

  return c.json({ error: 'Invalid action' }, 400);
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
    escalationTier: notification.escalationTier || 'facilitator',
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
