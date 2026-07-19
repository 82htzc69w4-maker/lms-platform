import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { Course, Enrollment } from './types';
import { getSessionUser } from '../auth/session';

const courses = new Hono<{ Bindings: Env }>();

// GET /api/courses — the full catalogue, every course registered on the platform
courses.get('/', async (c) => {
  const list = await kvListByPrefix(c.env, 'course:def:');
  const result: Course[] = [];
  for (const key of list.keys) {
    const course = await kvGetJSON<Course>(c.env, key.name);
    if (course) result.push(course);
  }
  return c.json({ courses: result });
});

// POST /api/courses — add a course to the catalogue (for an upcoming
// Instructor/Admin "manage courses" screen; not yet wired to a form)
courses.post('/', async (c) => {
  const body = await c.req.json<Course>();
  if (!body.id || !body.title || !body.description) {
    return c.json({ error: 'id, title, and description are required' }, 400);
  }
  await kvPutJSON(c.env, `course:def:${body.id}`, body);
  return c.json({ ok: true, course: body });
});

// GET /api/courses/mine — courses the logged-in learner is registered to
courses.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, `enrollment:${session.username}:`);
  const result: Course[] = [];
  for (const key of list.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (!enrollment) continue;
    const course = await kvGetJSON<Course>(c.env, `course:def:${enrollment.courseId}`);
    if (course) result.push(course);
  }
  return c.json({ courses: result });
});

// POST /api/courses/:id/enroll — registers the logged-in learner for a course
courses.post('/:id/enroll', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const courseId = c.req.param('id');
  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const enrollment: Enrollment = {
    username: session.username,
    courseId,
    registeredAt: new Date().toISOString(),
    status: 'active',
  };
  await kvPutJSON(c.env, `enrollment:${session.username}:${courseId}`, enrollment);
  return c.json({ ok: true, enrollment });
});

export default courses;
