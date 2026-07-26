import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvListByPrefix } from '../lib/kv';
import type { IssuedCertificate } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';

const issuedCertificates = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

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

// GET /api/issued-certificates/expired — every expired course certificate,
// across every learner (Instructor/Admin/Administrator only)
issuedCertificates.get('/expired', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const list = await kvListByPrefix(c.env, 'certificate:issued:');
  const now = Date.now();
  const expired: Array<IssuedCertificate & { learnerDisplayName: string }> = [];

  for (const key of list.keys) {
    const cert = await kvGetJSON<IssuedCertificate>(c.env, key.name);
    if (!cert || !cert.expiryDate) continue;
    if (new Date(cert.expiryDate).getTime() > now) continue;

    const learnerUser = await kvGetJSON<User>(c.env, `auth:user:${cert.username}`);
    expired.push({ ...cert, learnerDisplayName: learnerUser?.name || cert.username });
  }

  expired.sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  return c.json({ certificates: expired });
});

export default issuedCertificates;
