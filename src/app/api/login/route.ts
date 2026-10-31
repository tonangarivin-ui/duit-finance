import { NextResponse } from 'next/server';
import { verifyLegacyPassword } from '@/lib/legacy-password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API = process.env.FINANCE_API_URL ?? 'http://127.0.0.1:3301';
const EMAIL = process.env.FINANCE_AUTH_EMAIL ?? '';
/** Origin yang dikenali Better Auth (trustedOrigins di backend). */
const ORIGIN = process.env.FINANCE_PUBLIC_ORIGIN ?? 'https://duit.darklabs.tech';

/** ponytail: rate-limit in-memory (1 proses, 1 user). Pindah ke tabel kalau multi-instance. */
const tries = new Map<string, { n: number; until: number }>();
const WINDOW = 5 * 60_000;
const MAX = 5;

function base(req: Request) {
  const h = req.headers;
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  return `${proto}://${host}`;
}

/**
 * Proxy ke Better Auth di backend. Cookie session yang dipasang backend
 * diteruskan apa adanya, jadi yang tersimpan di browser adalah session
 * `better-auth.session_token` — bukan lagi HMAC lokal.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const emailRaw = String(form.get('email') ?? '').trim().toLowerCase();
  const email = emailRaw || EMAIL;
  const password = String(form.get('password') ?? '');
  const remember = form.get('remember') === 'on';
  const nextRaw = String(form.get('next') ?? '/');
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/';

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const rec = tries.get(ip);
  if (rec && rec.until > Date.now() && rec.n >= MAX) {
    return NextResponse.redirect(`${base(req)}/login?e=locked`, 303);
  }

  const signIn = (pw: string) =>
    fetch(`${API}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ email, password: pw, rememberMe: remember }),
    }).catch(() => null);

  let res = password ? await signIn(password) : null;

  // Provisioning sekali jalan: password lama (scrypt) masih valid tapi akun
  // Better Auth belum ada → bikin dengan password yang sama, lalu masuk normal.
  // Hanya untuk akun pemilik (EMAIL), bukan akun lain yang mendaftar sendiri.
  if (!res?.ok && password && email === EMAIL && verifyLegacyPassword(password)) {
    await fetch(`${API}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ email: EMAIL, password, name: 'Areif' }),
    }).catch(() => null);
    res = await signIn(password);
  }

  if (!res?.ok) {
    const fresh = rec && rec.until > Date.now() ? rec : { n: 0, until: Date.now() + WINDOW };
    fresh.n += 1;
    tries.set(ip, fresh);
    return NextResponse.redirect(`${base(req)}/login?e=1`, 303);
  }

  tries.delete(ip);

  const out = NextResponse.redirect(`${base(req)}${next}`, 303);
  for (const c of res.headers.getSetCookie()) out.headers.append('set-cookie', c);
  return out;
}
