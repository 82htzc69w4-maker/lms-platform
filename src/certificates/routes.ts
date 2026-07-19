import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { Certificate } from './types';
import { getSessionUser } from '../auth/session';

const certificates = new Hono<{ Bindings: Env }>();

// GET /api/certificates/mine — certificates belonging to the logged-in learner
certificates.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, `certificate:${session.username}:`);
  const result: Certificate[] = [];
  for (const key of list.keys) {
    const cert = await kvGetJSON<Certificate>(c.env, key.name);
    if (cert) result.push(cert);
  }
  return c.json({ certificates: result });
});

// POST /api/certificates — issues a certificate to a learner (username in body).
// Not yet wired to a UI; reserved for the Admin role's "load certificates" workflow.
certificates.post('/', async (c) => {
  const body = await c.req.json<Certificate>();
  if (!body.id || !body.username || !body.title || !body.issuedDate) {
    return c.json({ error: 'id, username, title, and issuedDate are required' }, 400);
  }
  await kvPutJSON(c.env, `certificate:${body.username}:${body.id}`, body);
  return c.json({ ok: true, certificate: body });
});

export default certificates;
