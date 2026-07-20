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
  const body = await c.req.json<Partial<Course> & { id: string; title: string; description: string }>();
  if (!body.id || !body.title || !body.description) {
    return c.json({ error: 'id, title, and description are required' }, 400);
  }
  const course: Course = {
    id: body.id,
    courseNumber: body.courseNumber ?? '',
    title: body.title,
    instructor: body.instructor ?? '',
    duration: body.duration ?? '',
    description: body.description,
    category: body.category,
    outcomes: body.outcomes ?? '',
    linkedStandards: body.linkedStandards ?? '',
    status: body.status ?? 'draft',
  };
  await kvPutJSON(c.env, `course:def:${course.id}`, course);
  return c.json({ ok: true, course });
});

// GET /api/courses/:id — full detail for the Course Development screen
courses.get('/:id', async (c) => {
  const courseId = c.req.param('id');
  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);
  return c.json({ course });
});

// PUT /api/courses/:id — update full course information
courses.put('/:id', async (c) => {
  const courseId = c.req.param('id');
  const existing = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!existing) return c.json({ error: 'Course not found' }, 404);

  const body = await c.req.json<Partial<Course>>();
  const updated: Course = {
    ...existing,
    courseNumber: body.courseNumber ?? existing.courseNumber,
    title: body.title ?? existing.title,
    instructor: body.instructor ?? existing.instructor,
    duration: body.duration ?? existing.duration,
    description: body.description ?? existing.description,
    category: body.category ?? existing.category,
    outcomes: body.outcomes ?? existing.outcomes,
    linkedStandards: body.linkedStandards ?? existing.linkedStandards,
  };

  await kvPutJSON(c.env, `course:def:${courseId}`, updated);
  return c.json({ ok: true, course: updated });
});

// POST /api/courses/:id/publish — moves a course from draft to published
courses.post('/:id/publish', async (c) => {
  const courseId = c.req.param('id');
  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const updated: Course = { ...course, status: 'published' };
  await kvPutJSON(c.env, `course:def:${courseId}`, updated);
  return c.json({ ok: true, course: updated });
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
