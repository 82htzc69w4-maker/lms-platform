import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON } from '../lib/kv';
import { DEFAULT_BRANDING, type BrandingSettings } from './types';

const settings = new Hono<{ Bindings: Env }>();

// GET /api/settings
settings.get('/', async (c) => {
  const branding = await kvGetJSON<BrandingSettings>(c.env, 'settings:branding');
  return c.json(branding ?? DEFAULT_BRANDING);
});

// POST /api/settings
// Updates company name, system name, and/or logo. Any field left out keeps
// its current stored value (or the default, if nothing has been saved yet).
settings.post('/', async (c) => {
  const body = await c.req.json<Partial<BrandingSettings>>();
  const current = (await kvGetJSON<BrandingSettings>(c.env, 'settings:branding')) ?? DEFAULT_BRANDING;

  const updated: BrandingSettings = {
    companyName: body.companyName?.trim() || current.companyName,
    systemName: body.systemName?.trim() || current.systemName,
    logoDataUrl: body.logoDataUrl !== undefined ? body.logoDataUrl : current.logoDataUrl,
    theme: body.theme || current.theme,
  };

  await kvPutJSON(c.env, 'settings:branding', updated);
  return c.json({ ok: true, settings: updated });
});

export default settings;
