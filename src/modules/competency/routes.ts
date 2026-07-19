import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../../lib/kv';

const competency = new Hono<{ Bindings: Env }>();

// GET /api/competency/employees/:id/matrix
competency.get('/employees/:id/matrix', async (c) => {
  const id = c.req.param('id');
  const matrix = await kvGetJSON(c.env, `competency:matrix:${id}`);
  return c.json(matrix ?? { employeeId: id, skills: [] });
});

// POST /api/competency/employees/:id/matrix
competency.post('/employees/:id/matrix', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await kvPutJSON(c.env, `competency:matrix:${id}`, body);
  return c.json({ ok: true });
});

// GET /api/competency/gaps
competency.get('/gaps', async (c) => {
  const list = await kvListByPrefix(c.env, 'competency:matrix:');
  // TODO: gap-detection logic once schema is finalized
  return c.json({ keys: list.keys.map((k) => k.name) });
});

export default competency;
