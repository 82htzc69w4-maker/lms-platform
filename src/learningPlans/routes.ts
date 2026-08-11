import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { LearningPlan } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { LearnerProfile } from '../users/types';
import type { Course, Enrollment } from '../courses/types';
import type { PerformanceAppraisal } from '../performanceAppraisals/types';
import { createNotification } from '../notifications/routes';

const learningPlans = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

// POST /api/learning-plans/generate — the core automation: given an
// appraisal and one identified development gap (e.g. "Leadership"), the
// LMS searches published courses whose title or category loosely matches
// the gap (same transparent text-matching heuristic as Learning Pathway —
// not a real skills taxonomy), auto-enrolls the employee in up to 3
// matches, and creates a LearningPlan record to track it. Coaching is
// tracked on the plan itself, logged separately by staff (not auto-scheduled,
// since there's no calendar integration to book a real time slot against).
// (Instructor/Admin/Administrator only)
learningPlans.post('/generate', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const body = await c.req.json<{ appraisalId: string; gap: string }>();
  if (!body.appraisalId || !body.gap?.trim()) {
    return c.json({ error: 'appraisalId and gap are required' }, 400);
  }

  const appraisal = await kvGetJSON<PerformanceAppraisal>(c.env, `performance-appraisal:${body.appraisalId}`);
  if (!appraisal) return c.json({ error: 'Appraisal not found' }, 404);

  const gap = body.gap.trim();
  const gapLower = gap.toLowerCase();

  const courseList = await kvListByPrefix(c.env, 'course:def:');
  const existingEnrollmentList = await kvListByPrefix(c.env, `enrollment:${appraisal.username}:`);
  const alreadyEnrolledCourseIds = new Set<string>();
  for (const key of existingEnrollmentList.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (enrollment) alreadyEnrolledCourseIds.add(enrollment.courseId);
  }

  const matches: Course[] = [];
  for (const key of courseList.keys) {
    const course = await kvGetJSON<Course>(c.env, key.name);
    if (!course || course.status !== 'published' || alreadyEnrolledCourseIds.has(course.id)) continue;

    const titleLower = course.title.toLowerCase();
    const categoryLower = (course.category || '').toLowerCase();
    const isMatch =
      titleLower.includes(gapLower) ||
      gapLower.includes(titleLower) ||
      (categoryLower && (categoryLower.includes(gapLower) || gapLower.includes(categoryLower)));

    if (isMatch) matches.push(course);
    if (matches.length >= 3) break;
  }

  const reviewer = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);
  const assignedCourseIds: string[] = [];
  const assignedCourseTitles: string[] = [];

  for (const course of matches) {
    const enrollment: Enrollment = {
      username: appraisal.username,
      courseId: course.id,
      registeredAt: new Date().toISOString(),
      status: 'active',
    };
    await kvPutJSON(c.env, `enrollment:${appraisal.username}:${course.id}`, enrollment);
    assignedCourseIds.push(course.id);
    assignedCourseTitles.push(course.title);
  }

  const plan: LearningPlan = {
    id: crypto.randomUUID(),
    username: appraisal.username,
    employeeName: appraisal.employeeName,
    department: appraisal.department,
    sourceAppraisalId: appraisal.id,
    identifiedGap: gap,
    baselineRating: appraisal.rating,
    assignedCourseIds,
    assignedCourseTitles,
    coachingCompleted: false,
    status: 'active',
    createdByUsername: session.username,
    createdByName: reviewer?.name || session.username,
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `learning-plan:${plan.id}`, plan);

  const message =
    assignedCourseTitles.length > 0
      ? `A learning plan was created for "${gap}" — you've been enrolled in: ${assignedCourseTitles.join(', ')}.`
      : `A learning plan was created for "${gap}", but no matching published courses were found to assign — check with your facilitator.`;
  await createNotification(c.env, appraisal.username, message);

  return c.json({ ok: true, plan });
});

// GET /api/learning-plans/mine — the logged-in learner's own learning plans
learningPlans.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, 'learning-plan:');
  const plans: LearningPlan[] = [];
  for (const key of list.keys) {
    const p = await kvGetJSON<LearningPlan>(c.env, key.name);
    if (p && p.username === session.username) plans.push(p);
  }
  plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ plans });
});

// GET /api/learning-plans/:username — every learning plan for one employee,
// with live progress computed fresh each time (course completion rate, and
// whether their most recent appraisal rating has improved since the plan's
// baseline). This is an effectiveness measure, not financial ROI — the LMS
// has no cost or salary data to compute a real dollar return on investment.
// (Instructor/Admin/Administrator only)
learningPlans.get('/:username', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const username = c.req.param('username');
  const list = await kvListByPrefix(c.env, 'learning-plan:');
  const plans: LearningPlan[] = [];
  for (const key of list.keys) {
    const p = await kvGetJSON<LearningPlan>(c.env, key.name);
    if (p && p.username === username) plans.push(p);
  }
  plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const ratingOrder: Record<string, number> = { unsatisfactory: 0, below: 1, meets: 2, exceeds: 3 };

  const appraisalList = await kvListByPrefix(c.env, 'performance-appraisal:');
  const employeeAppraisals: PerformanceAppraisal[] = [];
  for (const key of appraisalList.keys) {
    const a = await kvGetJSON<PerformanceAppraisal>(c.env, key.name);
    if (a && a.username === username) employeeAppraisals.push(a);
  }
  employeeAppraisals.sort((a, b) => new Date(b.appraisalDate).getTime() - new Date(a.appraisalDate).getTime());
  const latestAppraisal = employeeAppraisals[0];

  const enrichedPlans = [];
  for (const plan of plans) {
    let completedCount = 0;
    for (const courseId of plan.assignedCourseIds) {
      const enrollment = await kvGetJSON<Enrollment>(c.env, `enrollment:${username}:${courseId}`);
      if (enrollment?.status === 'completed') completedCount += 1;
    }
    const completionPercent =
      plan.assignedCourseIds.length > 0 ? Math.round((completedCount / plan.assignedCourseIds.length) * 100) : null;

    let ratingTrend: 'improved' | 'same' | 'declined' | 'not_yet_reassessed' = 'not_yet_reassessed';
    if (latestAppraisal && latestAppraisal.id !== plan.sourceAppraisalId) {
      const baselineScore = ratingOrder[plan.baselineRating] ?? 1;
      const latestScore = ratingOrder[latestAppraisal.rating] ?? 1;
      ratingTrend = latestScore > baselineScore ? 'improved' : latestScore < baselineScore ? 'declined' : 'same';
    }

    enrichedPlans.push({ ...plan, completedCount, completionPercent, ratingTrend, latestRating: latestAppraisal?.rating });
  }

  return c.json({ plans: enrichedPlans });
});

// POST /api/learning-plans/:id/log-coaching — staff records that the
// coaching portion of this plan happened (Instructor/Admin/Administrator only)
learningPlans.post('/:id/log-coaching', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const id = c.req.param('id');
  const plan = await kvGetJSON<LearningPlan>(c.env, `learning-plan:${id}`);
  if (!plan) return c.json({ error: 'Learning plan not found' }, 404);

  const body = await c.req.json<{ coachingDate: string; coachingNotes: string }>();
  if (!body.coachingDate || !body.coachingNotes?.trim()) {
    return c.json({ error: 'coachingDate and coachingNotes are required' }, 400);
  }

  plan.coachingCompleted = true;
  plan.coachingDate = body.coachingDate;
  plan.coachingNotes = body.coachingNotes.trim();
  await kvPutJSON(c.env, `learning-plan:${id}`, plan);

  return c.json({ ok: true, plan });
});

// POST /api/learning-plans/:id/close — mark a plan completed or cancelled
// (Instructor/Admin/Administrator only)
learningPlans.post('/:id/close', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const id = c.req.param('id');
  const plan = await kvGetJSON<LearningPlan>(c.env, `learning-plan:${id}`);
  if (!plan) return c.json({ error: 'Learning plan not found' }, 404);

  const body = await c.req.json<{ status: 'completed' | 'cancelled' }>();
  if (body.status !== 'completed' && body.status !== 'cancelled') {
    return c.json({ error: 'status must be completed or cancelled' }, 400);
  }

  plan.status = body.status;
  await kvPutJSON(c.env, `learning-plan:${id}`, plan);
  return c.json({ ok: true, plan });
});

export default learningPlans;
