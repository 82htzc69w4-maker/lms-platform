import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvListByPrefix } from '../lib/kv';
import type { IssuedCertificate } from './types';
import { getSessionUser } from '../auth/session';

const issuedCertificates = new Hono<{ Bindings: Env }>();

// GET /api/issued-certificates/mine — every certificate generated for the logged-in learner
issuedCertificates.get('/mine', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const list = await kvListByPrefix(c.env, `certificate:issued:`);
  const certificates: IssuedCertificate[] = [];
  for (const key of list.keys) {
    if (!key.name.endsWith(`:${session.username}`)) continue;
    const cert = await kvGetJSON<IssuedCertificate>(c.env, key.name);
    if (cert) certificates.push(cert);
  }
  certificates.sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
  return c.json({ certificates });
});

export default issuedCertificates;
