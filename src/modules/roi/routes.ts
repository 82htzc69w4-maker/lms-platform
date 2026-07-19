import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON, kvPutJSON } from '../../lib/kv';

const roi = new Hono<{ Bindings: Env }>();

// POST /api/roi/calculate
// Input: training spend + before/after metrics (productivity, incidents, turnover, quality)
roi.post('/calculate', async (c) => {
  const body = await c.req.json();
  // TODO: implement ROI formula once metric sources are finalized
  return c.json({ input: body, roi: null });
});

// GET /api/roi/history
roi.get('/history', async (c) => {
  const record = await kvGetJSON(c.env, 'roi:history');
  return c.json(record ?? { entries: [] });
});

export default roi;
