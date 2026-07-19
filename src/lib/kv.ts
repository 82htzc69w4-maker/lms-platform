import type { Env } from '../types';

// Generic helpers so every module reads/writes KV the same way
export async function kvGetJSON<T>(env: Env, key: string): Promise<T | null> {
  const raw = await env.LMS_KV.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function kvPutJSON<T>(env: Env, key: string, value: T): Promise<void> {
  await env.LMS_KV.put(key, JSON.stringify(value));
}

export async function kvListByPrefix(env: Env, prefix: string) {
  return env.LMS_KV.list({ prefix });
}
