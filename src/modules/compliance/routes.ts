import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON, kvListByPrefix } from '../../lib/kv';

const compliance = new Hono<{ Bindings: Env }>();

// GET /api/compliance/frameworks
// Lists tracked regulatory/standards frameworks (MHSA, OHSA, ISO 45001/9001/14001)
compliance.get('/frameworks', async (c) => {
  const list = await kvListByPrefix(c.env, 'compliance:framework:');
  return c.json({ frameworks: list.keys.map((k) => k.name) });
});

// GET /api/compliance/frameworks/:name/gaps
compliance.get('/frameworks/:name/gaps', async (c) => {
  const name = c.req.param('name');
  const record = await kvGetJSON(c.env, `compliance:framework:${name}`);
  // TODO: cross-reference training records against framework requirements
  return c.json(record ?? { framework: name, gaps: [] });
});

export default compliance;
