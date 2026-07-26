import type { Env } from '../types';

// Generic helpers so every module reads/writes KV the same way
export async function kvGetJSON<T>(env: Env, key: string): Promise<T | null> {
  let raw: string | null;
  try {
    raw = await env.LMS_KV.get(key);
  } catch (err) {
    // A transient KV failure (rate limit, quota, etc.) should return "not
    // found" rather than crash whatever endpoint called this.
    console.error('kvGetJSON: KV.get failed for key', key, err);
    return null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // A single corrupted record should never take down an entire listing
    // endpoint that iterates over many keys — skip it instead of throwing.
    return null;
  }
}

export async function kvPutJSON<T>(env: Env, key: string, value: T): Promise<void> {
  await env.LMS_KV.put(key, JSON.stringify(value));
}

export async function kvListByPrefix(env: Env, prefix: string) {
  try {
    return await env.LMS_KV.list({ prefix });
  } catch (err) {
    // If the underlying KV API call fails (e.g. a rate limit or quota
    // issue), degrade gracefully with an empty list instead of taking down
    // the whole endpoint that called this.
    console.error('kvListByPrefix failed for prefix', prefix, err);
    return { keys: [] as Array<{ name: string }>, list_complete: true, cacheStatus: null };
  }
}
