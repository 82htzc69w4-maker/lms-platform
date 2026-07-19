import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON, kvPutJSON } from '../../lib/kv';

const appraisal = new Hono<{ Bindings: Env }>();

// GET /api/appraisal/employees/:id
appraisal.get('/employees/:id', async (c) => {
  const id = c.req.param('id');
  const record = await kvGetJSON(c.env, `appraisal:employee:${id}`);
  return c.json(record ?? { employeeId: id, reviews: [] });
});

// POST /api/appraisal/employees/:id
// Records a new appraisal; identifying weak areas should auto-trigger training assignment
appraisal.post('/employees/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await kvPutJSON(c.env, `appraisal:employee:${id}`, body);
  // TODO: trigger training assignment in competency module based on flagged weaknesses
  return c.json({ ok: true });
});

export default appraisal;
