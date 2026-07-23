import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { Course, Enrollment } from './types';
import type { ContentBlock, ContentBlockType, CourseContent } from './content-types';
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
    imageDataUrl: body.imageDataUrl !== undefined ? body.imageDataUrl : existing.imageDataUrl,
    bannerDataUrl: body.bannerDataUrl !== undefined ? body.bannerDataUrl : existing.bannerDataUrl,
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

// ---------------------------------------------------------------------------
// Course Design — content blocks (Standard Content + Learning Activity tools)
// ---------------------------------------------------------------------------

// GET /api/courses/:id/content
courses.get('/:id/content', async (c) => {
  const courseId = c.req.param('id');
  const content = await kvGetJSON<CourseContent>(c.env, `course:content:${courseId}`);
  return c.json({ blocks: content?.blocks ?? [] });
});

// POST /api/courses/:id/content — add a new block from the tool palette
courses.post('/:id/content', async (c) => {
  const courseId = c.req.param('id');
  const body = await c.req.json<{ type: ContentBlockType; title?: string }>();
  if (!body.type) return c.json({ error: 'type is required' }, 400);

  const content: CourseContent = (await kvGetJSON<CourseContent>(c.env, `course:content:${courseId}`)) ?? {
    courseId,
    blocks: [],
  };

  const block: ContentBlock = {
    id: crypto.randomUUID(),
    type: body.type,
    title: body.title?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  content.blocks.push(block);
  await kvPutJSON(c.env, `course:content:${courseId}`, content);
  return c.json({ ok: true, blocks: content.blocks });
});

// PUT /api/courses/:id/content/:blockId — rename a block and/or update its settings
courses.put('/:id/content/:blockId', async (c) => {
  const courseId = c.req.param('id');
  const blockId = c.req.param('blockId');
  const body = await c.req.json<{ title?: string; settings?: ContentBlock['settings'] }>();

  const content = await kvGetJSON<CourseContent>(c.env, `course:content:${courseId}`);
  if (!content) return c.json({ error: 'Course content not found' }, 404);

  const block = content.blocks.find((b) => b.id === blockId);
  if (!block) return c.json({ error: 'Block not found' }, 404);

  if (body.title !== undefined) block.title = body.title.trim();
  if (body.settings !== undefined) block.settings = { ...block.settings, ...body.settings };

  await kvPutJSON(c.env, `course:content:${courseId}`, content);
  return c.json({ ok: true, blocks: content.blocks });
});

// DELETE /api/courses/:id/content/:blockId
courses.delete('/:id/content/:blockId', async (c) => {
  const courseId = c.req.param('id');
  const blockId = c.req.param('blockId');

  const content = await kvGetJSON<CourseContent>(c.env, `course:content:${courseId}`);
  if (!content) return c.json({ error: 'Course content not found' }, 404);

  content.blocks = content.blocks.filter((b) => b.id !== blockId);
  await kvPutJSON(c.env, `course:content:${courseId}`, content);
  return c.json({ ok: true, blocks: content.blocks });
});

// PUT /api/courses/:id/content-reorder — persists a new block order
courses.put('/:id/content-reorder', async (c) => {
  const courseId = c.req.param('id');
  const body = await c.req.json<{ blockIds: string[] }>();

  const content = await kvGetJSON<CourseContent>(c.env, `course:content:${courseId}`);
  if (!content) return c.json({ error: 'Course content not found' }, 404);

  const byId = new Map(content.blocks.map((b) => [b.id, b]));
  const reordered = body.blockIds
    .map((id) => byId.get(id))
    .filter((b): b is ContentBlock => Boolean(b));
  content.blocks = reordered;
  await kvPutJSON(c.env, `course:content:${courseId}`, content);
  return c.json({ ok: true, blocks: content.blocks });
});

export default courses;
