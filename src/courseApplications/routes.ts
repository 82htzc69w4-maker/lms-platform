import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { CourseApplication } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { Course, Enrollment } from '../courses/types';
import { createNotification } from '../notifications/routes';

const courseApplications = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

// POST /api/course-applications — a learner applies for a course
courseApplications.post('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const body = await c.req.json<{ courseId: string; motivation: string }>();
  if (!body.courseId || !body.motivation || !body.motivation.trim()) {
    return c.json({ error: 'courseId and motivation are required' }, 400);
  }

  const course = await kvGetJSON<Course>(c.env, `course:def:${body.courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const learnerUser = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);

  const application: CourseApplication = {
    id: crypto.randomUUID(),
    username: session.username,
    learnerName: learnerUser?.name || session.username,
    courseId: body.courseId,
    courseTitle: course.title,
    motivation: body.motivation.trim(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `course-application:${application.id}`, application);
  return c.json({ ok: true, application });
});

// GET /api/course-applications/mine — the logged-in learner's own applications
courseApplications.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, 'course-application:');
  const applications: CourseApplication[] = [];
  for (const key of list.keys) {
    const app = await kvGetJSON<CourseApplication>(c.env, key.name);
    if (app && app.username === session.username) applications.push(app);
  }
  return c.json({ applications });
});

// GET /api/course-applications — every application (Instructor/Admin/Administrator only)
courseApplications.get('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const list = await kvListByPrefix(c.env, 'course-application:');
  const applications: CourseApplication[] = [];
  for (const key of list.keys) {
    const app = await kvGetJSON<CourseApplication>(c.env, key.name);
    if (app) applications.push(app);
  }
  applications.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  return c.json({ applications });
});

// POST /api/course-applications/:id/approve — approves and creates the real enrollment
courseApplications.post('/:id/approve', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const id = c.req.param('id');
  const application = await kvGetJSON<CourseApplication>(c.env, `course-application:${id}`);
  if (!application) return c.json({ error: 'Application not found' }, 404);

  application.status = 'approved';
  application.reviewedAt = new Date().toISOString();
  application.reviewedBy = session.username;
  await kvPutJSON(c.env, `course-application:${id}`, application);

  const enrollment: Enrollment = {
    username: application.username,
    courseId: application.courseId,
    registeredAt: new Date().toISOString(),
    status: 'active',
  };
  await kvPutJSON(c.env, `enrollment:${application.username}:${application.courseId}`, enrollment);
  await createNotification(
    c.env,
    application.username,
    `You have been registered for "${application.courseTitle}".`,
    application.courseId
  );

  return c.json({ ok: true, application, enrollment });
});

// POST /api/course-applications/:id/reject
courseApplications.post('/:id/reject', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const id = c.req.param('id');
  const application = await kvGetJSON<CourseApplication>(c.env, `course-application:${id}`);
  if (!application) return c.json({ error: 'Application not found' }, 404);

  application.status = 'rejected';
  application.reviewedAt = new Date().toISOString();
  application.reviewedBy = session.username;
  await kvPutJSON(c.env, `course-application:${id}`, application);

  return c.json({ ok: true, application });
});

export default courseApplications;
