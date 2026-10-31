import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Daftar · Finance' };

const ERRORS: Record<string, string> = {
  invalid: 'Email atau password belum valid (password minimal 8 karakter).',
  mismatch: 'Konfirmasi password tidak sama.',
  exists: 'Email ini sudah terdaftar. Coba masuk.',
  failed: 'Pendaftaran gagal. Coba lagi.',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const sp = await searchParams;
  const err = sp.e ? (ERRORS[sp.e] ?? 'Pendaftaran gagal.') : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <div className="mb-8">
        <p className="text-[11px] font-medium tracking-widest text-dim">FINANCE</p>
        <h1 className="mt-1 text-2xl font-semibold">Daftar</h1>
        <p className="mt-1 text-[11px] text-dim">
          Bikin akun dulu, lalu masuk pakai email dan password itu.
        </p>
      </div>

      <form method="post" action="/api/register" className="space-y-3">
        <input
          type="email"
          name="email"
          autoFocus
          required
          autoComplete="email"
          placeholder="Email"
          aria-label="email"
          className="w-full rounded-xl border border-line bg-chip px-3 py-3 text-sm outline-none placeholder:text-dim"
        />
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Password (min. 8 karakter)"
          aria-label="password"
          className="w-full rounded-xl border border-line bg-chip px-3 py-3 text-sm outline-none placeholder:text-dim"
        />
        <input
          type="password"
          name="confirm"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Ulangi password"
          aria-label="confirm password"
          className="w-full rounded-xl border border-line bg-chip px-3 py-3 text-sm outline-none placeholder:text-dim"
        />

        {err && <p className="text-xs text-expense">{err}</p>}

        <button
          type="submit"
          className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-onaccent"
        >
          Daftar
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-dim">
        Sudah punya akun?{' '}
        <a href="/login" className="font-semibold text-gold underline-offset-2 hover:underline">
          Masuk
        </a>
      </p>
    </main>
  );
}
