import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Masuk · Finance' };

const ERRORS: Record<string, string> = {
  '1': 'Email atau password salah.',
  locked: 'Terlalu banyak percobaan. Coba lagi dalam 5 menit.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; next?: string; registered?: string }>;
}) {
  const sp = await searchParams;
  const err = sp.e ? (ERRORS[sp.e] ?? 'Gagal masuk.') : null;
  const next = sp.next?.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/';
  const justRegistered = sp.registered === '1';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <div className="mb-8">
        <p className="text-[11px] font-medium tracking-widest text-dim">FINANCE</p>
        <h1 className="mt-1 text-2xl font-semibold">Masuk</h1>
        <p className="mt-1 text-[11px] text-dim">
          Data keuangan lo ada di server ini — butuh akun untuk buka.
        </p>
      </div>

      <form method="post" action="/api/login" className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <input
          type="email"
          name="email"
          autoFocus
          required
          autoComplete="username"
          placeholder="Email"
          aria-label="email"
          className="w-full rounded-xl border border-line bg-chip px-3 py-3 text-sm outline-none placeholder:text-dim"
        />
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          aria-label="password"
          className="w-full rounded-xl border border-line bg-chip px-3 py-3 text-sm outline-none placeholder:text-dim"
        />

        <label className="flex items-center gap-2 text-xs text-dim">
          <input type="checkbox" name="remember" className="h-4 w-4 accent-[#E5A93C]" />
          Ingat saya 30 hari
        </label>

        {justRegistered && <p className="text-xs text-gold">Akun dibuat. Silakan masuk.</p>}
        {err && <p className="text-xs text-expense">{err}</p>}

        <button
          type="submit"
          className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-onaccent"
        >
          Masuk
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-dim">
        Belum punya akun?{' '}
        <a href="/register" className="font-semibold text-gold underline-offset-2 hover:underline">
          Daftar
        </a>
      </p>
    </main>
  );
}
