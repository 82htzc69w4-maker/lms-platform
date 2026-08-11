import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { PerformanceAppraisal } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { LearnerProfile } from '../users/types';
import { createNotification } from '../notifications/routes';

const performanceAppraisals = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

// POST /api/performance-appraisals — log a performance appraisal for an
// employee (staff only)
performanceAppraisals.post('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const body = await c.req.json<{
    username: string;
    appraisalDate: string;
    rating: PerformanceAppraisal['rating'];
    comments: string;
  }>();

  if (!body.username || !body.appraisalDate || !body.rating || !body.comments?.trim()) {
    return c.json({ error: 'username, appraisalDate, rating, and comments are required' }, 400);
  }

  const employeeUser = await kvGetJSON<User>(c.env, `auth:user:${body.username}`);
  const employeeProfile = await kvGetJSON<LearnerProfile>(c.env, `learner:profile:${body.username}`);
  const reviewerUser = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);

  const appraisal: PerformanceAppraisal = {
    id: crypto.randomUUID(),
    username: body.username,
    employeeName: employeeUser?.name || body.username,
    department: employeeProfile?.department,
    appraisalDate: body.appraisalDate,
    rating: body.rating,
    reviewerUsername: session.username,
    reviewerName: reviewerUser?.name || session.username,
    comments: body.comments.trim(),
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `performance-appraisal:${appraisal.id}`, appraisal);

  await createNotification(c.env, body.username, `A performance appraisal was recorded by ${appraisal.reviewerName}.`);

  return c.json({ ok: true, appraisal });
});

// GET /api/performance-appraisals/mine — the logged-in learner's own appraisals
performanceAppraisals.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, 'performance-appraisal:');
  const items: PerformanceAppraisal[] = [];
  for (const key of list.keys) {
    const a = await kvGetJSON<PerformanceAppraisal>(c.env, key.name);
    if (a && a.username === session.username) items.push(a);
  }
  items.sort((a, b) => new Date(b.appraisalDate).getTime() - new Date(a.appraisalDate).getTime());
  return c.json({ appraisals: items });
});

// GET /api/performance-appraisals/:username — every appraisal for one
// employee (staff only)
performanceAppraisals.get('/:username', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const username = c.req.param('username');
  const list = await kvListByPrefix(c.env, 'performance-appraisal:');
  const items: PerformanceAppraisal[] = [];
  for (const key of list.keys) {
    const a = await kvGetJSON<PerformanceAppraisal>(c.env, key.name);
    if (a && a.username === username) items.push(a);
  }
  items.sort((a, b) => new Date(b.appraisalDate).getTime() - new Date(a.appraisalDate).getTime());
  return c.json({ appraisals: items });
});

export default performanceAppraisals;
