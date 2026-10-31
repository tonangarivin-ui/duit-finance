import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/** Satu-satunya pintu ke backend Express. Cookie session user diteruskan apa adanya. */
const BASE = process.env.FINANCE_API_URL ?? 'http://127.0.0.1:3301';

export async function api<T>(path: string, init: { method?: string; json?: unknown } = {}): Promise<T> {
  const jar = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? (init.json === undefined ? 'GET' : 'POST'),
    headers: {
      cookie: jar,
      ...(init.json !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
    cache: 'no-store',
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `API ${res.status}`);
  }
  return (await res.json()) as T;
}
