import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON } from '../lib/kv';
import type { CertificateUploadSubmission } from './types';
import { getSessionUser } from '../auth/session';

const certificateUploads = new Hono<{ Bindings: Env }>();

// GET /api/certificate-uploads/:blockId/my-submission
certificateUploads.get('/:blockId/my-submission', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const blockId = c.req.param('blockId');
  const submission = await kvGetJSON<CertificateUploadSubmission>(
    c.env,
    `certificate-upload:${blockId}:${session.username}`
  );
  return c.json({ submission: submission ?? null });
});

// POST /api/certificate-uploads/:blockId/submit — uploads or replaces the
// learner's external certificate. PDF only, enforced server-side too.
certificateUploads.post('/:blockId/submit', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const blockId = c.req.param('blockId');
  const body = await c.req.json<{
    certificateName: string;
    issuedDate: string;
    expiryDate: string;
    fileName: string;
    fileDataUrl: string;
  }>();

  if (!body.certificateName || !body.issuedDate || !body.fileName || !body.fileDataUrl) {
    return c.json(
      { error: 'certificateName, issuedDate, fileName, and fileDataUrl are required' },
      400
    );
  }

  const isPdf =
    body.fileDataUrl.startsWith('data:application/pdf') || body.fileName.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return c.json({ error: 'Only PDF files are accepted for certificate uploads' }, 400);
  }

  const submission: CertificateUploadSubmission = {
    blockId,
    username: session.username,
    certificateName: body.certificateName.trim(),
    issuedDate: body.issuedDate,
    expiryDate: body.expiryDate ?? '',
    fileName: body.fileName,
    fileDataUrl: body.fileDataUrl,
    submittedAt: new Date().toISOString(),
  };

  await kvPutJSON(c.env, `certificate-upload:${blockId}:${session.username}`, submission);
  return c.json({ ok: true, submission });
});

export default certificateUploads;
