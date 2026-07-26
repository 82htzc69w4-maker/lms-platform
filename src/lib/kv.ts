import type { Env } from '../types';

// Generic helpers so every module reads/writes KV the same way
export async function kvGetJSON<T>(env: Env, key: string): Promise<T | null> {
  const raw = await env.LMS_KV.get(key);
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
  return env.LMS_KV.list({ prefix });
}
