import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvListByPrefix } from '../../lib/kv';

const riskDashboard = new Hono<{ Bindings: Env }>();

// GET /api/risk/departments
// Returns competence risk level (High/Medium/Low) per department
riskDashboard.get('/departments', async (c) => {
  // TODO: aggregate from expired certs, failed assessments, incidents, gaps, appraisals
  const list = await kvListByPrefix(c.env, 'risk:department:');
  return c.json({ departments: list.keys.map((k) => k.name) });
});

// GET /api/risk/departments/:name
riskDashboard.get('/departments/:name', async (c) => {
  const name = c.req.param('name');
  // TODO: return detailed risk breakdown for one department
  return c.json({ department: name, risk: null });
});

export default riskDashboard;
