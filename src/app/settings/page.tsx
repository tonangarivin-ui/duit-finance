import { balances, listCategories } from '@/lib/ledger';
import AccountsEditor from '@/components/AccountsEditor';
import BottomNav from '@/components/BottomNav';
import CatIcon from '@/components/CatIcon';
import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const accounts = (await balances()).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: a.balance,
  }));
  const cats = await listCategories();

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6 lg:max-w-5xl lg:px-8 lg:pt-10">
      <h1 className="text-2xl font-semibold">Pengaturan</h1>
      <p className="mt-1 text-[11px] text-dim">
        Koreksi saldo selalu dicatat sebagai baris Penyesuaian — tidak pernah menimpa angka awal.
      </p>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <section className="mt-4 lg:mt-0">
          <h2 className="mb-2 text-sm font-semibold">Dompet</h2>
          <AccountsEditor accounts={accounts} />
        </section>

        <div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Tema</h2>
        <ThemeToggle />
        <p className="mt-2 text-[10px] text-dim">
          Dark = hitam-gold. Vanila = krem hangat + aksen pastel. Tersimpan di perangkat ini.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Kategori</h2>
        <div className="surface px-3">
          {cats.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 border-b border-line py-2.5 last:border-b-0"
            >
              <CatIcon icon={c.icon} color={c.color} size={16} />
              <span className="flex-1 text-xs">{c.name}</span>
              <span className={`text-[10px] ${c.kind === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                {c.kind === 'INCOME' ? 'Masuk' : 'Keluar'}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-dim">
          Kategori bawaan. Tambah/ubah kategori menyusul setelah pemakaian nyata.
        </p>
      </section>

      <section className="mt-6">
        <form method="post" action="/api/logout">
          <button
            type="submit"
            className="w-full rounded-xl border border-line py-2.5 text-xs font-semibold text-dim"
          >
            Keluar (logout)
          </button>
        </form>
      </section>

        </div>
      </div>

      <BottomNav />
    </main>
  );
}
