import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../../lib/kv';

const incidents = new Hono<{ Bindings: Env }>();

// GET /api/incidents
incidents.get('/', async (c) => {
  const list = await kvListByPrefix(c.env, 'incident:');
  return c.json({ keys: list.keys.map((k) => k.name) });
});

// POST /api/incidents
// Records an investigated incident; should auto-create lessons-learned + corrective training
incidents.post('/', async (c) => {
  const body = await c.req.json<{ id: string }>();
  await kvPutJSON(c.env, `incident:${body.id}`, body);
  // TODO: auto-generate corrective training assignment, track completion + effectiveness
  return c.json({ ok: true });
});

// GET /api/incidents/:id
incidents.get('/:id', async (c) => {
  const id = c.req.param('id');
  const record = await kvGetJSON(c.env, `incident:${id}`);
  return c.json(record ?? { id, found: false });
});

export default incidents;
