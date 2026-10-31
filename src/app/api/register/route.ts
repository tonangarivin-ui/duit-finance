import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API = process.env.FINANCE_API_URL ?? 'http://127.0.0.1:3301';
/** Origin yang dikenali Better Auth (trustedOrigins di backend). */
const ORIGIN = process.env.FINANCE_PUBLIC_ORIGIN ?? 'https://duit.darklabs.tech';

/** ponytail: rate-limit in-memory per IP; pindah ke tabel kalau multi-instance. */
const tries = new Map<string, { n: number; until: number }>();
const WINDOW = 10 * 60_000;
const MAX = 5;

function base(req: Request) {
  const h = req.headers;
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  return `${proto}://${host}`;
}

/**
 * Pendaftaran lewat Better Auth di backend. Session cookie sengaja TIDAK
 * diteruskan: setelah daftar, user diarahkan ke /login untuk masuk sendiri.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const rec = tries.get(ip);
  if (rec && rec.until > Date.now() && rec.n >= MAX) {
    return NextResponse.redirect(`${base(req)}/register?e=invalid`, 303);
  }

  const fail = (code: string) => {
    const fresh = rec && rec.until > Date.now() ? rec : { n: 0, until: Date.now() + WINDOW };
    fresh.n += 1;
    tries.set(ip, fresh);
    return NextResponse.redirect(`${base(req)}/register?e=${code}`, 303);
  };

  if (!email.includes('@') || email.length < 5 || password.length < 8) return fail('invalid');
  if (password !== confirm) return fail('mismatch');

  const res = await fetch(`${API}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ email, password, name: email.split('@')[0] }),
  }).catch(() => null);

  if (!res?.ok) {
    const body = res ? await res.text().catch(() => '') : '';
    const code = /exist/i.test(body) ? 'exists' : 'failed';
    return fail(code);
  }

  tries.delete(ip);
  return NextResponse.redirect(`${base(req)}/login?registered=1`, 303);
}
