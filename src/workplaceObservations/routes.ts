import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { WorkplaceObservation } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import { createNotification } from '../notifications/routes';

const workplaceObservations = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

// POST /api/workplace-observations — a supervisor logs a workplace
// observation of a learner performing a task (staff only)
workplaceObservations.post('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const body = await c.req.json<{
    username: string;
    observationDate: string;
    taskObserved: string;
    outcome: WorkplaceObservation['outcome'];
    notes: string;
  }>();

  if (!body.username || !body.observationDate || !body.taskObserved?.trim() || !body.outcome || !body.notes?.trim()) {
    return c.json({ error: 'username, observationDate, taskObserved, outcome, and notes are required' }, 400);
  }

  const employeeUser = await kvGetJSON<User>(c.env, `auth:user:${body.username}`);
  const observerUser = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);

  const observation: WorkplaceObservation = {
    id: crypto.randomUUID(),
    username: body.username,
    employeeName: employeeUser?.name || body.username,
    observedByUsername: session.username,
    observedByName: observerUser?.name || session.username,
    observationDate: body.observationDate,
    taskObserved: body.taskObserved.trim(),
    outcome: body.outcome,
    notes: body.notes.trim(),
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `workplace-observation:${observation.id}`, observation);

  await createNotification(
    c.env,
    body.username,
    `A workplace observation was logged for "${observation.taskObserved}" by ${observation.observedByName}.`
  );

  return c.json({ ok: true, observation });
});

// GET /api/workplace-observations/mine — the logged-in learner's own observations
workplaceObservations.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, 'workplace-observation:');
  const items: WorkplaceObservation[] = [];
  for (const key of list.keys) {
    const o = await kvGetJSON<WorkplaceObservation>(c.env, key.name);
    if (o && o.username === session.username) items.push(o);
  }
  items.sort((a, b) => new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime());
  return c.json({ observations: items });
});

// GET /api/workplace-observations/:username — every observation for one
// employee (staff only)
workplaceObservations.get('/:username', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const username = c.req.param('username');
  const list = await kvListByPrefix(c.env, 'workplace-observation:');
  const items: WorkplaceObservation[] = [];
  for (const key of list.keys) {
    const o = await kvGetJSON<WorkplaceObservation>(c.env, key.name);
    if (o && o.username === username) items.push(o);
  }
  items.sort((a, b) => new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime());
  return c.json({ observations: items });
});

export default workplaceObservations;
