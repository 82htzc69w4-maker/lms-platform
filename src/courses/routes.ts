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
import { createNotification } from '../notifications/routes';
import type { LearnerProfile } from '../users/types';

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

  // Count enrollments per course in a single pass, rather than one lookup
  // per course, to keep KV usage down.
  const enrollmentList = await kvListByPrefix(c.env, 'enrollment:');
  const countByCourseId: Record<string, number> = {};
  for (const key of enrollmentList.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (enrollment) {
      countByCourseId[enrollment.courseId] = (countByCourseId[enrollment.courseId] || 0) + 1;
    }
  }

  const result: Array<Course & { enrolledCount: number }> = [];
  for (const key of list.keys) {
    const course = await kvGetJSON<Course>(c.env, key.name);
    if (course) result.push({ ...course, enrolledCount: countByCourseId[course.id] || 0 });
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

// GET /api/courses/mine — the logged-in learner's enrolled courses.
// Registered before /:id so "mine" is never mistaken for a course ID.
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

// GET /api/courses/expired — every completed enrollment that has passed the
// course's Validity Period (courses without a validity period never expire).
// Also registered before /:id for the same reason.
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

// GET /api/courses/my-overall-progress — the average progress across every
// course the learner is enrolled in (completed courses count as 100%).
// Registered before /:id so "my-overall-progress" is never mistaken for a
// course ID. (The actual calculation logic is defined further down in this
// file as hoisted function declarations, so it's safe to call from here.)
courses.get('/my-overall-progress', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, `enrollment:${session.username}:`);
  let totalPercent = 0;
  let courseCount = 0;

  for (const key of list.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (!enrollment) continue;
    courseCount += 1;

    if (enrollment.status === 'completed') {
      totalPercent += 100;
    } else {
      totalPercent += await computeCourseProgressPercent(c.env, session.username, enrollment.courseId);
    }
  }

  const overallPercent = courseCount > 0 ? Math.round(totalPercent / courseCount) : 0;
  return c.json({ overallPercent, courseCount });
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
  const pageProgress = await kvGetJSON<{ lastPageIndex: number }>(
    c.env,
    `course-progress:${courseId}:${session.username}`
  );
  return c.json({
    enrolled: !!enrollment,
    blocked: enrollment?.blocked ?? false,
    lastPageIndex: pageProgress?.lastPageIndex ?? 0,
  });
});

// GET /api/courses/:id/enrolled-learners — every learner enrolled in this
// course, with registration date, progress, and completion status
// (Instructor/Admin/Administrator only)
courses.get('/:id/enrolled-learners', async (c) => {
  const session = await getSessionUser(c);
  if (!session || (session.role !== 'instructor' && session.role !== 'admin' && session.role !== 'administrator')) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const courseId = c.req.param('id');
  const list = await kvListByPrefix(c.env, 'enrollment:');
  const learners: Array<{
    username: string;
    firstName: string;
    surname: string;
    registeredAt: string;
    status: string;
    completedAt?: string;
    percent: number;
  }> = [];

  for (const key of list.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (!enrollment || enrollment.courseId !== courseId) continue;

    const user = await kvGetJSON<User>(c.env, `auth:user:${enrollment.username}`);
    const percent =
      enrollment.status === 'completed' ? 100 : await computeCourseProgressPercent(c.env, enrollment.username, courseId);

    learners.push({
      username: enrollment.username,
      firstName: user?.firstName || '',
      surname: user?.surname || '',
      registeredAt: enrollment.registeredAt,
      status: enrollment.status,
      completedAt: enrollment.completedAt,
      percent,
    });
  }

  learners.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  return c.json({ learners });
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
  await createNotification(c.env, body.username, `You have been registered for "${course.title}".`, courseId);
  return c.json({ ok: true, enrollment });
});

courses.post('/:id/enroll', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);
  if (session.role === 'learner') {
    return c.json({ error: 'Learners must apply for enrollment — see the Course Catalogue Apply button' }, 403);
  }

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
  await createNotification(c.env, session.username, `You have been registered for "${course.title}".`, courseId);
  return c.json({ ok: true, enrollment });
});

// POST /api/courses/:id/complete — marks the logged-in learner's enrollment as completed
// Shared logic: marks an enrollment completed and issues a certificate using
// the course's Certificate Design (or sensible defaults if none configured).
// Used only when completion is earned automatically — never from a learner
// simply clicking a button.
async function completeEnrollmentAndIssueCertificate(
  env: Env,
  username: string,
  courseId: string
): Promise<{ enrollment: Enrollment; certificate: IssuedCertificate }> {
  const enrollmentKey = `enrollment:${username}:${courseId}`;
  const enrollment = (await kvGetJSON<Enrollment>(env, enrollmentKey)) ?? {
    username,
    courseId,
    registeredAt: new Date().toISOString(),
    status: 'active' as const,
  };

  const completedAt = new Date().toISOString();
  const updatedEnrollment: Enrollment = { ...enrollment, status: 'completed', completedAt };
  await kvPutJSON(env, enrollmentKey, updatedEnrollment);

  const course = await kvGetJSON<Course>(env, `course:def:${courseId}`);
  const template =
    (await kvGetJSON<CertificateTemplate>(env, `certificate-template:${courseId}`)) ??
    ({ courseId, ...DEFAULT_CERTIFICATE_TEMPLATE } as CertificateTemplate);
  const learnerUser = await kvGetJSON<User>(env, `auth:user:${username}`);
  const learnerProfile = await kvGetJSON<LearnerProfile>(env, `learner:profile:${username}`);
  const branding = await kvGetJSON<BrandingSettings>(env, 'settings:branding');

  // The certificate's own Validity Period (set in Certificate Design) takes
  // priority; falls back to the course's Validity Period if the
  // certificate doesn't have its own set.
  const effectiveValidityMonths = template.validityMonths ?? course?.validityMonths;
  let expiryDate: string | undefined;
  if (effectiveValidityMonths) {
    const expiry = new Date(completedAt);
    expiry.setMonth(expiry.getMonth() + effectiveValidityMonths);
    expiryDate = expiry.toISOString();
  }

  const certificate: IssuedCertificate = {
    id: crypto.randomUUID(),
    username,
    studentName: learnerUser?.name || username,
    courseId,
    courseTitle: course?.title || courseId,
    courseNumber: course?.courseNumber || '',
    certificateType: template.certificateType,
    orientation: template.orientation,
    includeLogo: template.includeLogo,
    includeStudentName: template.includeStudentName,
    includeIdNumber: template.includeIdNumber,
    studentIdNumber: learnerProfile?.idNumber,
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
  await kvPutJSON(env, `certificate:issued:${courseId}:${username}`, certificate);

  return { enrollment: updatedEnrollment, certificate };
}

// GET /api/courses/:id/my-progress — real, computed progress based on the
// learner's actual activity (test attempts, assignment submissions,
// certificate uploads) rather than a self-reported "mark complete" button.
// Only Test, Assignment Upload, and External Certificate blocks are counted,
// since those are the only block types with genuine learner-submitted
// records to check — ordinary content blocks (text, images, etc.) have no
// "viewed" tracking yet, so they can't honestly be included.
// Reaching 100% automatically completes the course and issues the certificate.
// POST /api/courses/:id/view-page — records that the learner has viewed a
// given page of the course (course-view.ts calls this every time a page
// renders). This is what lets "reading through the course" actually move
// the progress needle, not just embedded Tests/Assignments/Certificates.
courses.post('/:id/view-page', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const courseId = c.req.param('id');
  const body = await c.req.json<{ pageIndex: number; totalPages: number }>();

  const key = `course-progress:${courseId}:${session.username}`;
  const existing = (await kvGetJSON<{ viewedPages: number[]; totalPages: number; lastPageIndex: number }>(
    c.env,
    key
  )) ?? {
    viewedPages: [],
    totalPages: body.totalPages,
    lastPageIndex: 0,
  };

  if (!existing.viewedPages.includes(body.pageIndex)) {
    existing.viewedPages.push(body.pageIndex);
  }
  existing.totalPages = body.totalPages;
  existing.lastPageIndex = body.pageIndex;

  await kvPutJSON(c.env, key, existing);
  return c.json({ ok: true });
});

// GET /api/courses/:id/my-progress — real, computed progress combining two
// genuine signals: how many pages of the course the learner has actually
// viewed, and how many of the course's Test/Assignment/Certificate blocks
// they've genuinely submitted. Reaching 100% automatically completes the
// course and issues the certificate.
// Mirrors course-view.ts's client-side splitIntoPages() exactly, so the
// server always knows the *current* true page count for a course — never
// a stale number reported by the learner's last visit. This is what lets
// progress stay accurate when an instructor adds or removes pages after a
// learner has already started the course.
function splitIntoPagesServer(blocks: ContentBlock[]): ContentBlock[][] {
  const pages: ContentBlock[][] = [];
  let current: ContentBlock[] = [];
  let pendingBreak = false;

  for (const b of blocks) {
    if (b.type === 'module') {
      if (current.length > 0) pages.push(current);
      current = [b];
      pendingBreak = false;
      continue;
    }

    const isNavButton = b.type === 'forwardButton' || b.type === 'backButton';

    if (pendingBreak && !isNavButton) {
      pages.push(current);
      current = [];
      pendingBreak = false;
    }

    current.push(b);

    if (b.type === 'forwardButton') {
      pendingBreak = true;
    }
  }

  if (current.length > 0) pages.push(current);
  return pages;
}

// Computes one course's progress percent for one learner — combines real
// page-view tracking with real Test/Assignment/Certificate submissions.
// Shared by both the per-course progress endpoint and the learner's overall
// progress gauge.
async function computeCourseProgressPercent(env: Env, username: string, courseId: string): Promise<number> {
  const content = await kvGetJSON<CourseContent>(env, `course:content:${courseId}`);
  const blocks = content?.blocks ?? [];
  const trackableBlocks = blocks.filter(
    (b) => b.type === 'test' || b.type === 'assignmentUpload' || b.type === 'externalCertificate'
  );

  let completedActivities = 0;
  for (const block of trackableBlocks) {
    if (block.type === 'test') {
      const history = await kvGetJSON<unknown[]>(env, `test:attempts:${block.id}:${username}`);
      if (history && history.length > 0) completedActivities += 1;
    } else if (block.type === 'assignmentUpload') {
      const submission = await kvGetJSON<unknown>(env, `assignment:submission:${block.id}:${username}`);
      if (submission) completedActivities += 1;
    } else if (block.type === 'externalCertificate') {
      const submission = await kvGetJSON<unknown>(env, `certificate-upload:${block.id}:${username}`);
      if (submission) completedActivities += 1;
    }
  }

  const pageProgress = await kvGetJSON<{ viewedPages: number[]; totalPages: number }>(
    env,
    `course-progress:${courseId}:${username}`
  );
  const totalPages = splitIntoPagesServer(blocks).length;
  const viewedPages = Math.min(pageProgress?.viewedPages.length ?? 0, totalPages);

  const totalItems = totalPages + trackableBlocks.length;
  const completedItems = viewedPages + completedActivities;
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
}

courses.get('/:id/my-progress', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const courseId = c.req.param('id');
  const content = await kvGetJSON<CourseContent>(c.env, `course:content:${courseId}`);
  const blocks = content?.blocks ?? [];
  const trackableBlocks = blocks.filter(
    (b) => b.type === 'test' || b.type === 'assignmentUpload' || b.type === 'externalCertificate'
  );

  const percent = await computeCourseProgressPercent(c.env, session.username, courseId);
  const totalPages = splitIntoPagesServer(blocks).length;
  const totalItems = totalPages + trackableBlocks.length;
  const completedItems = Math.round((percent / 100) * totalItems);

  let justCompleted = false;
  if (totalItems > 0 && percent === 100) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, `enrollment:${session.username}:${courseId}`);
    if (enrollment && enrollment.status !== 'completed') {
      await completeEnrollmentAndIssueCertificate(c.env, session.username, courseId);
      justCompleted = true;
    }
  }

  return c.json({
    totalItems,
    completedItems,
    percent,
    justCompleted,
  });
});

// POST /api/courses/:id/reset-for-learner — full reset of a learner's
// progress on this course (Instructor/Admin/Administrator only). Clears
// enrollment status, page-view progress, every trackable activity record
// (test attempts, assignment submissions, certificate uploads) tied to this
// course's blocks, and the issued certificate itself — so the progress bar
// genuinely returns to 0% and the learner has to complete the course again.
// Notifies the learner that this happened.
courses.post('/:id/reset-for-learner', async (c) => {
  const session = await getSessionUser(c);
  if (!session || (session.role !== 'instructor' && session.role !== 'admin' && session.role !== 'administrator')) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const courseId = c.req.param('id');
  const body = await c.req.json<{ username: string }>();
  if (!body.username) return c.json({ error: 'username is required' }, 400);

  const course = await kvGetJSON<Course>(c.env, `course:def:${courseId}`);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const enrollmentKey = `enrollment:${body.username}:${courseId}`;
  const enrollment = await kvGetJSON<Enrollment>(c.env, enrollmentKey);
  if (enrollment) {
    enrollment.status = 'active';
    delete enrollment.completedAt;
    enrollment.blocked = false;
    await kvPutJSON(c.env, enrollmentKey, enrollment);
  }

  await c.env.LMS_KV.delete(`course-progress:${courseId}:${body.username}`);

  const content = await kvGetJSON<CourseContent>(c.env, `course:content:${courseId}`);
  const blocks = content?.blocks ?? [];
  for (const block of blocks) {
    if (block.type === 'test') {
      await c.env.LMS_KV.delete(`test:attempts:${block.id}:${body.username}`);
    } else if (block.type === 'assignmentUpload') {
      await c.env.LMS_KV.delete(`assignment:submission:${block.id}:${body.username}`);
    } else if (block.type === 'externalCertificate') {
      await c.env.LMS_KV.delete(`certificate-upload:${block.id}:${body.username}`);
    }
  }

  await c.env.LMS_KV.delete(`certificate:issued:${courseId}:${body.username}`);

  await createNotification(
    c.env,
    body.username,
    `Your completion of "${course.title}" has been reset. Please complete the course again.`,
    courseId
  );

  return c.json({ ok: true });
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
