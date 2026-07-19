import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../../lib/kv';

const evidence = new Hono<{ Bindings: Env }>();

// GET /api/evidence/employees/:id
// Returns all uploaded evidence items (videos, photos, docs, sign-offs) for an employee
evidence.get('/employees/:id', async (c) => {
  const id = c.req.param('id');
  const items = await kvGetJSON(c.env, `evidence:employee:${id}`);
  return c.json(items ?? { employeeId: id, items: [] });
});

// POST /api/evidence/employees/:id
// Add a new evidence item (metadata only for now — actual file storage TBD, e.g. R2)
evidence.post('/employees/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const existing = (await kvGetJSON<{ items: unknown[] }>(c.env, `evidence:employee:${id}`)) ?? {
    items: [],
  };
  existing.items.push(body);
  await kvPutJSON(c.env, `evidence:employee:${id}`, existing);
  return c.json({ ok: true });
});

// GET /api/evidence/employees/:id/passport
// Compiles the Competency Passport (quals, certs, skills, evidence) for an employee
evidence.get('/employees/:id/passport', async (c) => {
  const id = c.req.param('id');
  // TODO: aggregate from competency + evidence modules once schemas are finalized
  return c.json({ employeeId: id, passport: null });
});

export default evidence;
