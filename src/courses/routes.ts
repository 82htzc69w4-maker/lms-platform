import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { Course, Enrollment } from './types';
import type { ContentBlock, ContentBlockType, CourseContent } from './content-types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { CertificateTemplate } from '../certificateTemplates/types';
import { DEFAULT_CERTIFICATE_TEMPLATE } from '../certificateTemplates/types';
import type { IssuedCertificate } from '../issuedCertificates/types';
import type { BrandingSettings } from '../settings/types';

const courses = new Hono<{ Bindings: Env }>();

// Instructors may only edit/publish courses they created. Administrators (and
// any other role) have full access. If a course has no recorded owner yet
// (e.g. it predates this field), any instructor may edit it — and doing so
// claims ownership for them going forward.
function canEditCourse(
  session: { username: string; role: string } | null,
  course: Course
): boolean {
  if (!session) return false;
  if (session.role !== 'instructor') return true;
  return !course.instructorUsername || course.instructorUsername === session.username;
}

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
  const session = await getSessionUser(c);
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
    developmentStartDate: new Date().toISOString(),
    instructorUsername: session?.username,
    validityMonths: body.validityMonths,
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

  const session = await getSessionUser(c);
  if (!canEditCourse(session, existing)) {
    return c.json({ error: 'You can only edit courses you created' }, 403);
  }

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
    bannerFit: body.bannerFit ?? existing.bannerFit,
    bannerHeight: body.bannerHeight ?? existing.bannerHeight,
    validityMonths: body.validityMonths ?? existing.validityMonths,
    // Claim ownership for whichever instructor first edits an unclaimed course.
    instructorUsername:
      existing.instructorUsername || (session?.role === 'instructor' ? session.username : existing.instructorUsername),
  };

  await kvPutJSON(c.env, `course:def:${courseId}`, updated);
  return c.json({ ok: true, course: updated });
});

// POST /api/courses/:id/publish — moves a course from draft to published
courses.post('/:id/publish', async (c) => {
  const courseId = c.req.param('id');
  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const session = await getSessionUser(c);
  if (!canEditCourse(session, course)) {
    return c.json({ error: 'You can only publish courses you created' }, 403);
  }

  const updated: Course = {
    ...course,
    status: 'published',
    instructorUsername:
      course.instructorUsername || (session?.role === 'instructor' ? session.username : course.instructorUsername),
  };
  await kvPutJSON(c.env, `course:def:${courseId}`, updated);
  return c.json({ ok: true, course: updated });
});

// GET /api/courses/mine — courses the logged-in learner is registered to
// GET /api/courses/:id/enrollment-status — is the logged-in learner blocked on this course?
courses.get('/:id/enrollment-status', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const courseId = c.req.param('id');
  const enrollment = await kvGetJSON<Enrollment>(c.env, `enrollment:${session.username}:${courseId}`);
  return c.json({ enrolled: !!enrollment, blocked: enrollment?.blocked ?? false });
});

courses.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, `enrollment:${session.username}:`);
  const result: Array<Course & { enrollmentStatus: string; completedAt?: string }> = [];
  for (const key of list.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (!enrollment) continue;
    const course = await kvGetJSON<Course>(c.env, `course:def:${enrollment.courseId}`);
    if (course) {
      result.push({ ...course, enrollmentStatus: enrollment.status, completedAt: enrollment.completedAt });
    }
  }
  return c.json({ courses: result });
});

// POST /api/courses/:id/enroll — registers the logged-in learner for a course
// POST /api/courses/:id/enroll-user — lets Instructor/Admin/Administrator enroll
// a specific learner into a course on their behalf
courses.post('/:id/enroll-user', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);
  if (session.role !== 'instructor' && session.role !== 'admin' && session.role !== 'administrator') {
    return c.json({ error: 'Only Instructors, Admins, and Administrators can enroll students' }, 403);
  }

  const courseId = c.req.param('id');
  const body = await c.req.json<{ username: string }>();
  if (!body.username) return c.json({ error: 'username is required' }, 400);

  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const enrollment: Enrollment = {
    username: body.username,
    courseId,
    registeredAt: new Date().toISOString(),
    status: 'active',
  };
  await kvPutJSON(c.env, `enrollment:${body.username}:${courseId}`, enrollment);
  return c.json({ ok: true, enrollment });
});

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

// POST /api/courses/:id/complete — marks the logged-in learner's enrollment as completed
courses.post('/:id/complete', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const courseId = c.req.param('id');
  const key = `enrollment:${session.username}:${courseId}`;
  const enrollment = await kvGetJSON<Enrollment>(c.env, key);
  if (!enrollment) return c.json({ error: 'Not enrolled in this course' }, 404);

  const completedAt = new Date().toISOString();
  const updated: Enrollment = { ...enrollment, status: 'completed', completedAt };
  await kvPutJSON(c.env, key, updated);

  // Generate the certificate for this completion, using the course's
  // Certificate Design (or sensible defaults if none has been configured).
  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  const template =
    (await kvGetJSON<CertificateTemplate>(c.env, `certificate-template:${courseId}`)) ??
    ({ courseId, ...DEFAULT_CERTIFICATE_TEMPLATE } as CertificateTemplate);
  const learnerUser = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);
  const branding = await kvGetJSON<BrandingSettings>(c.env, 'settings:branding');

  let expiryDate: string | undefined;
  if (course?.validityMonths) {
    const expiry = new Date(completedAt);
    expiry.setMonth(expiry.getMonth() + course.validityMonths);
    expiryDate = expiry.toISOString();
  }

  const certificate: IssuedCertificate = {
    id: crypto.randomUUID(),
    username: session.username,
    studentName: learnerUser?.name || session.username,
    courseId,
    courseTitle: course?.title || courseId,
    courseNumber: course?.courseNumber || '',
    certificateType: template.certificateType,
    includeLogo: template.includeLogo,
    includeStudentName: template.includeStudentName,
    includeCourseName: template.includeCourseName,
    includeCourseDate: template.includeCourseDate,
    includeCourseNumber: template.includeCourseNumber,
    includeSignatory: template.includeSignatory,
    includeExpiryDate: template.includeExpiryDate,
    signatoryName: template.signatoryName,
    signatoryTitle: template.signatoryTitle,
    signatureDataUrl: template.signatureDataUrl,
    backgroundImageDataUrl: template.backgroundImageDataUrl,
    backgroundBrightness: template.backgroundBrightness,
    backgroundOpacity: template.backgroundOpacity,
    borderColor: template.borderColor,
    logoDataUrl: branding?.logoDataUrl || undefined,
    issuedDate: completedAt,
    expiryDate,
  };
  await kvPutJSON(c.env, `certificate:issued:${courseId}:${session.username}`, certificate);

  return c.json({ ok: true, enrollment: updated, certificate });
});

// GET /api/courses/expired — every completed enrollment that has passed the
// course's Validity Period (courses without a validity period never expire)
courses.get('/expired', async (c) => {
  const list = await kvListByPrefix(c.env, 'enrollment:');
  const expired: Array<{
    username: string;
    courseId: string;
    courseTitle: string;
    completedAt: string;
    expiredOn: string;
  }> = [];
  const now = Date.now();

  for (const key of list.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (!enrollment || enrollment.status !== 'completed' || !enrollment.completedAt) continue;

    const course = await kvGetJSON<Course>(c.env, `course:def:${enrollment.courseId}`);
    if (!course || !course.validityMonths) continue;

    const expiryDate = new Date(enrollment.completedAt);
    expiryDate.setMonth(expiryDate.getMonth() + course.validityMonths);

    if (expiryDate.getTime() <= now) {
      expired.push({
        username: enrollment.username,
        courseId: enrollment.courseId,
        courseTitle: course.title,
        completedAt: enrollment.completedAt,
        expiredOn: expiryDate.toISOString(),
      });
    }
  }

  return c.json({ expired });
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
  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const session = await getSessionUser(c);
  if (!canEditCourse(session, course)) {
    return c.json({ error: 'You can only edit courses you created' }, 403);
  }

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

  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const session = await getSessionUser(c);
  if (!canEditCourse(session, course)) {
    return c.json({ error: 'You can only edit courses you created' }, 403);
  }

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

  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const session = await getSessionUser(c);
  if (!canEditCourse(session, course)) {
    return c.json({ error: 'You can only edit courses you created' }, 403);
  }

  const content = await kvGetJSON<CourseContent>(c.env, `course:content:${courseId}`);
  if (!content) return c.json({ error: 'Course content not found' }, 404);

  content.blocks = content.blocks.filter((b) => b.id !== blockId);
  await kvPutJSON(c.env, `course:content:${courseId}`, content);
  return c.json({ ok: true, blocks: content.blocks });
});

// PUT /api/courses/:id/content-reorder — persists a new block order
courses.put('/:id/content-reorder', async (c) => {
  const courseId = c.req.param('id');

  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const session = await getSessionUser(c);
  if (!canEditCourse(session, course)) {
    return c.json({ error: 'You can only edit courses you created' }, 403);
  }

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
