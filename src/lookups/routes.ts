import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import { LOOKUP_LISTS, type LookupListName } from './types';

const lookups = new Hono<{ Bindings: Env }>();

function isValidList(name: string): name is LookupListName {
  return (LOOKUP_LISTS as readonly string[]).includes(name);
}

// GET /api/lookups/:listName — all values in a list, alphabetically sorted
lookups.get('/:listName', async (c) => {
  const listName = c.req.param('listName');
  if (!isValidList(listName)) return c.json({ error: 'Unknown lookup list' }, 400);

  const list = await kvListByPrefix(c.env, `lookup:${listName}:`);
  const values: string[] = [];
  for (const key of list.keys) {
    const entry = await kvGetJSON<{ value: string }>(c.env, key.name);
    if (entry) values.push(entry.value);
  }
  values.sort((a, b) => a.localeCompare(b));
  return c.json({ values });
});

// POST /api/lookups/:listName  { value }
lookups.post('/:listName', async (c) => {
  const listName = c.req.param('listName');
  if (!isValidList(listName)) return c.json({ error: 'Unknown lookup list' }, 400);

  const body = await c.req.json<{ value: string }>();
  const value = body.value?.trim();
  if (!value) return c.json({ error: 'value is required' }, 400);

  await kvPutJSON(c.env, `lookup:${listName}:${value}`, { value });
  return c.json({ ok: true, value });
});

// DELETE /api/lookups/:listName/:value
lookups.delete('/:listName/:value', async (c) => {
  const listName = c.req.param('listName');
  if (!isValidList(listName)) return c.json({ error: 'Unknown lookup list' }, 400);

  const value = c.req.param('value');
  await c.env.LMS_KV.delete(`lookup:${listName}:${value}`);
  return c.json({ ok: true });
});

export default lookups;
