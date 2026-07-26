import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON } from '../lib/kv';
import type { CertificateTemplate } from './types';
import { DEFAULT_CERTIFICATE_TEMPLATE } from './types';

const certificateTemplates = new Hono<{ Bindings: Env }>();

// GET /api/certificate-templates/:courseId
certificateTemplates.get('/:courseId', async (c) => {
  const courseId = c.req.param('courseId');
  const template = await kvGetJSON<CertificateTemplate>(c.env, `certificate-template:${courseId}`);
  return c.json({ template: template ?? { courseId, ...DEFAULT_CERTIFICATE_TEMPLATE } });
});

// PUT /api/certificate-templates/:courseId — create or update the design
certificateTemplates.put('/:courseId', async (c) => {
  const courseId = c.req.param('courseId');
  const body = await c.req.json<Partial<CertificateTemplate>>();

  const existing = (await kvGetJSON<CertificateTemplate>(c.env, `certificate-template:${courseId}`)) ?? {
    courseId,
    ...DEFAULT_CERTIFICATE_TEMPLATE,
  };

  const updated: CertificateTemplate = {
    ...existing,
    certificateType: body.certificateType ?? existing.certificateType,
    includeLogo: body.includeLogo ?? existing.includeLogo,
    includeStudentName: body.includeStudentName ?? existing.includeStudentName,
    includeCourseName: body.includeCourseName ?? existing.includeCourseName,
    includeCourseDate: body.includeCourseDate ?? existing.includeCourseDate,
    includeCourseNumber: body.includeCourseNumber ?? existing.includeCourseNumber,
    includeSignatory: body.includeSignatory ?? existing.includeSignatory,
    includeExpiryDate: body.includeExpiryDate ?? existing.includeExpiryDate,
    signatoryName: body.signatoryName !== undefined ? body.signatoryName : existing.signatoryName,
    signatoryTitle: body.signatoryTitle !== undefined ? body.signatoryTitle : existing.signatoryTitle,
    signatureDataUrl: body.signatureDataUrl !== undefined ? body.signatureDataUrl : existing.signatureDataUrl,
    backgroundImageDataUrl:
      body.backgroundImageDataUrl !== undefined ? body.backgroundImageDataUrl : existing.backgroundImageDataUrl,
    backgroundBrightness: body.backgroundBrightness ?? existing.backgroundBrightness,
    backgroundOpacity: body.backgroundOpacity ?? existing.backgroundOpacity,
    borderColor: body.borderColor !== undefined ? body.borderColor : existing.borderColor,
  };

  await kvPutJSON(c.env, `certificate-template:${courseId}`, updated);
  return c.json({ ok: true, template: updated });
});

export default certificateTemplates;
