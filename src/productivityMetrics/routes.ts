import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { ProductivityMetric } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { LearnerProfile } from '../users/types';

const productivityMetrics = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

// POST /api/productivity-metrics — log a new productivity data point (staff only)
productivityMetrics.post('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const body = await c.req.json<{
    username: string;
    metricName: string;
    value: number;
    unit?: string;
    recordedDate: string;
    notes?: string;
  }>();

  if (!body.username || !body.metricName?.trim() || body.value == null || !body.recordedDate) {
    return c.json({ error: 'username, metricName, value, and recordedDate are required' }, 400);
  }

  const employeeUser = await kvGetJSON<User>(c.env, `auth:user:${body.username}`);
  const employeeProfile = await kvGetJSON<LearnerProfile>(c.env, `learner:profile:${body.username}`);
  const recorderUser = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);

  const metric: ProductivityMetric = {
    id: crypto.randomUUID(),
    username: body.username,
    employeeName: employeeUser?.name || body.username,
    department: employeeProfile?.department,
    metricName: body.metricName.trim(),
    value: body.value,
    unit: body.unit?.trim() || undefined,
    recordedDate: body.recordedDate,
    notes: body.notes?.trim() || undefined,
    recordedByUsername: session.username,
    recordedByName: recorderUser?.name || session.username,
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `productivity-metric:${metric.id}`, metric);
  return c.json({ ok: true, metric });
});

// GET /api/productivity-metrics — every productivity metric on record (staff only)
productivityMetrics.get('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const list = await kvListByPrefix(c.env, 'productivity-metric:');
  const metrics: ProductivityMetric[] = [];
  for (const key of list.keys) {
    const m = await kvGetJSON<ProductivityMetric>(c.env, key.name);
    if (m) metrics.push(m);
  }
  metrics.sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());
  return c.json({ metrics });
});

// GET /api/productivity-metrics/:username — every metric for one employee (staff only)
productivityMetrics.get('/:username', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const username = c.req.param('username');
  const list = await kvListByPrefix(c.env, 'productivity-metric:');
  const metrics: ProductivityMetric[] = [];
  for (const key of list.keys) {
    const m = await kvGetJSON<ProductivityMetric>(c.env, key.name);
    if (m && m.username === username) metrics.push(m);
  }
  metrics.sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());
  return c.json({ metrics });
});

export default productivityMetrics;
