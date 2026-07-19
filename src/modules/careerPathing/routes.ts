import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON } from '../../lib/kv';

const careerPathing = new Hono<{ Bindings: Env }>();

// GET /api/career/roles/:role/next
// Returns the next role in the path and its requirements
careerPathing.get('/roles/:role/next', async (c) => {
  const role = c.req.param('role');
  const record = await kvGetJSON(c.env, `career:role:${role}`);
  return c.json(record ?? { role, next: null });
});

// GET /api/career/employees/:id/progress
// Compares employee's current skills against next-role requirements
careerPathing.get('/employees/:id/progress', async (c) => {
  const id = c.req.param('id');
  // TODO: cross-reference competency matrix with role requirements
  return c.json({ employeeId: id, progress: null });
});

export default careerPathing;
