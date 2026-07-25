import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON } from '../lib/kv';
import type { AssignmentSubmission } from './types';
import { getSessionUser } from '../auth/session';

const assignments = new Hono<{ Bindings: Env }>();

// GET /api/assignments/:blockId/my-submission
assignments.get('/:blockId/my-submission', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const blockId = c.req.param('blockId');
  const submission = await kvGetJSON<AssignmentSubmission>(
    c.env,
    `assignment:submission:${blockId}:${session.username}`
  );
  return c.json({ submission: submission ?? null });
});

// POST /api/assignments/:blockId/submit — uploads or replaces the learner's submission
assignments.post('/:blockId/submit', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const blockId = c.req.param('blockId');
  const body = await c.req.json<{ fileName: string; fileDataUrl: string; fileMimeType: string }>();

  if (!body.fileName || !body.fileDataUrl) {
    return c.json({ error: 'fileName and fileDataUrl are required' }, 400);
  }

  const submission: AssignmentSubmission = {
    blockId,
    username: session.username,
    fileName: body.fileName,
    fileDataUrl: body.fileDataUrl,
    fileMimeType: body.fileMimeType ?? '',
    submittedAt: new Date().toISOString(),
  };

  await kvPutJSON(c.env, `assignment:submission:${blockId}:${session.username}`, submission);
  return c.json({ ok: true, submission });
});

export default assignments;
