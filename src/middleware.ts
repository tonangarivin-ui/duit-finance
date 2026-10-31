import { NextResponse, type NextRequest } from 'next/server';

/** Cookie session Better Auth. Backend pakai prefix `__Secure-` karena baseURL https. */
const COOKIES = ['__Secure-better-auth.session_token', 'better-auth.session_token'];

/**
 * Gate ringan: cukup cek cookie ada. Validasi session sebenarnya terjadi di backend
 * (setiap request data balik 401 kalau session mati) — tidak perlu double query DB
 * di Edge runtime.
 */
export function middleware(req: NextRequest) {
  if (COOKIES.some((name) => req.cookies.get(name)?.value)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = req.nextUrl.pathname === '/' ? '' : `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Semua route kecuali: /login, /register, /api/login, /api/register, /api/logout,
     * aset Next, dan file statis di root (ikon/manifest).
     */
    '/((?!login|register|api/login|api/register|api/logout|_next/static|_next/image|icon.svg|manifest.webmanifest|favicon.ico|glass-demo\\.html).*)',
  ],
};
