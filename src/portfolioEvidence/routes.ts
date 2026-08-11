import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { PortfolioEvidence } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import { createNotification } from '../notifications/routes';

const portfolioEvidence = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

// POST /api/portfolio-evidence — a learner uploads a piece of evidence
// (video, photo, or document) to their own portfolio, not tied to any
// specific course.
portfolioEvidence.post('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const body = await c.req.json<{
    title: string;
    description: string;
    evidenceType: PortfolioEvidence['evidenceType'];
    fileDataUrl: string;
    fileName: string;
    fileMimeType: string;
    relatedSkill?: string;
  }>();

  if (!body.title?.trim() || !body.evidenceType || !body.fileDataUrl || !body.fileName) {
    return c.json({ error: 'title, evidenceType, fileDataUrl, and fileName are required' }, 400);
  }

  const user = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);

  const evidence: PortfolioEvidence = {
    id: crypto.randomUUID(),
    username: session.username,
    employeeName: user?.name || session.username,
    title: body.title.trim(),
    description: body.description?.trim() || '',
    evidenceType: body.evidenceType,
    fileDataUrl: body.fileDataUrl,
    fileName: body.fileName,
    fileMimeType: body.fileMimeType || '',
    relatedSkill: body.relatedSkill?.trim() || undefined,
    status: 'pending',
    uploadedAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `portfolio-evidence:${evidence.id}`, evidence);
  return c.json({ ok: true, evidence });
});

// GET /api/portfolio-evidence/mine — the logged-in learner's own evidence
portfolioEvidence.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, 'portfolio-evidence:');
  const items: PortfolioEvidence[] = [];
  for (const key of list.keys) {
    const e = await kvGetJSON<PortfolioEvidence>(c.env, key.name);
    if (e && e.username === session.username) items.push(e);
  }
  items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  return c.json({ evidence: items });
});

// GET /api/portfolio-evidence/pending — every unreviewed evidence item
// across all learners, for the staff review queue (staff only)
portfolioEvidence.get('/pending', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const list = await kvListByPrefix(c.env, 'portfolio-evidence:');
  const items: PortfolioEvidence[] = [];
  for (const key of list.keys) {
    const e = await kvGetJSON<PortfolioEvidence>(c.env, key.name);
    if (e && e.status === 'pending') items.push(e);
  }
  items.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
  return c.json({ evidence: items });
});

// GET /api/portfolio-evidence/:username — every evidence item for one
// employee, regardless of status (staff only)
portfolioEvidence.get('/:username', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const username = c.req.param('username');
  const list = await kvListByPrefix(c.env, 'portfolio-evidence:');
  const items: PortfolioEvidence[] = [];
  for (const key of list.keys) {
    const e = await kvGetJSON<PortfolioEvidence>(c.env, key.name);
    if (e && e.username === username) items.push(e);
  }
  items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  return c.json({ evidence: items });
});

// POST /api/portfolio-evidence/:id/sign-off — a supervisor reviews an
// evidence item and either signs it off or rejects it (staff only)
portfolioEvidence.post('/:id/sign-off', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const id = c.req.param('id');
  const evidence = await kvGetJSON<PortfolioEvidence>(c.env, `portfolio-evidence:${id}`);
  if (!evidence) return c.json({ error: 'Evidence not found' }, 404);

  const body = await c.req.json<{ decision: 'signed_off' | 'rejected'; notes?: string }>();
  if (body.decision !== 'signed_off' && body.decision !== 'rejected') {
    return c.json({ error: 'decision must be signed_off or rejected' }, 400);
  }

  const reviewer = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);

  evidence.status = body.decision;
  evidence.signedOffByUsername = session.username;
  evidence.signedOffByName = reviewer?.name || session.username;
  evidence.signedOffAt = new Date().toISOString();
  evidence.signOffNotes = body.notes?.trim() || undefined;
  await kvPutJSON(c.env, `portfolio-evidence:${id}`, evidence);

  const message =
    body.decision === 'signed_off'
      ? `Your evidence "${evidence.title}" has been signed off by ${evidence.signedOffByName}.`
      : `Your evidence "${evidence.title}" was not signed off. ${body.notes ? 'Feedback: ' + body.notes.trim() : ''}`;
  await createNotification(c.env, evidence.username, message);

  return c.json({ ok: true, evidence });
});

export default portfolioEvidence;
