import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API = process.env.FINANCE_API_URL ?? 'http://127.0.0.1:3301';

function base(req: Request) {
  const h = req.headers;
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  return `${proto}://${host}`;
}

/** Logout = matikan session di Better Auth, lalu buang cookie di browser. */
export async function POST(req: Request) {
  const jar = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  await fetch(`${API}/api/auth/sign-out`, {
    method: 'POST',
    headers: { cookie: jar, 'content-type': 'application/json' },
    body: '{}',
  }).catch(() => null);

  const out = NextResponse.redirect(`${base(req)}/login`, 303);
  for (const c of (await cookies()).getAll()) {
    // nama cookie bisa `better-auth.*` atau `__Secure-better-auth.*`
    if (c.name.includes('better-auth.')) out.cookies.delete(c.name);
  }
  return out;
}
