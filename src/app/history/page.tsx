import Link from 'next/link';
import { balances, listCategories, listHistory, getTx, type HistoryItem } from '@/lib/ledger';
import { dayLabel, rp, todayWib, weekStart, monthStart } from '@/lib/format';
import TxRow from '@/components/TxRow';
import BottomNav from '@/components/BottomNav';
import EditSheet from '@/components/EditSheet';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const q = one(sp.q) ?? '';
  const range = one(sp.range) ?? 'month';
  const accountId = Number(one(sp.account)) || undefined;
  const categoryId = Number(one(sp.category)) || undefined;
  const txId = one(sp.tx) ?? null;
  const customFrom = one(sp.from);
  const customTo = one(sp.to);

  const today = todayWib();
  const from =
    range === 'today'
      ? today
      : range === 'week'
        ? weekStart(today)
        : range === 'all'
          ? undefined
          : customFrom || monthStart(today);
  const to = range === 'custom' ? customTo : undefined;

  const items = await listHistory({
    from,
    to,
    accountId,
    categoryId,
    q: q || undefined,
  });

  const groups = new Map<string, HistoryItem[]>();
  for (const it of items) {
    const arr = groups.get(it.date);
    if (arr) arr.push(it);
    else groups.set(it.date, [it]);
  }

  const accounts = await balances();
  const cats = await listCategories();

  const raw = txId ? await getTx(txId) : null;
  const editing =
    raw && raw.kind !== 'ADJUSTMENT'
      ? {
          tx_id: raw.tx_id,
          kind: raw.kind as 'INCOME' | 'EXPENSE' | 'TRANSFER',
          amount: raw.amount,
          accountId: raw.accountId,
          toAccountId: raw.toAccountId,
          categoryId: raw.categoryId,
          date: raw.date,
          note: raw.note,
        }
      : null;

  const href = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      q,
      account: accountId?.toString(),
      category: categoryId?.toString(),
      ...extra,
    };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    return `/history?${p.toString()}`;
  };

  const chips = [
    { key: 'today', label: 'Hari ini' },
    { key: 'week', label: 'Minggu ini' },
    { key: 'month', label: 'Bulan ini' },
    { key: 'all', label: 'Semua' },
  ];

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6 lg:max-w-5xl lg:px-8 lg:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Riwayat</h1>
        <span className="num text-[11px] text-dim">{items.length} transaksi</span>
      </div>

      <form method="get" className="mt-3 space-y-2">
        <input type="hidden" name="range" value={range} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari catatan…"
          className="w-full rounded-xl border border-line bg-chip px-3 py-2.5 text-sm outline-none placeholder:text-dim"
        />
        <div className="flex gap-2">
          <select
            name="account"
            defaultValue={accountId?.toString() ?? ''}
            aria-label="filter dompet"
            className="w-full rounded-xl border border-line bg-chip px-3 py-2.5 text-sm text-dim outline-none"
          >
            <option value="">Semua Dompet</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={categoryId?.toString() ?? ''}
            aria-label="filter kategori"
            className="w-full rounded-xl border border-line bg-chip px-3 py-2.5 text-sm text-dim outline-none"
          >
            <option value="">Semua Kategori</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kind === 'INCOME' ? '+ ' : '− '}
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-gold px-3 text-sm font-semibold text-onaccent">
            Cari
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c.key}
            href={href({ range: c.key })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              range === c.key ? 'bg-gold text-onaccent' : 'bg-chip text-dim'
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {items.length === 0 && (
        <p className="mt-5 surface p-4 text-xs text-dim">
          Tidak ada transaksi pada filter ini.
        </p>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-5">
      {[...groups.entries()].map(([date, list]) => {
        const spend = list
          .filter((i) => i.kind === 'EXPENSE')
          .reduce((s, i) => s + i.amount, 0);
        return (
          <section key={date} className="mt-4">
            <div className="num flex items-baseline justify-between px-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-dim">
                {dayLabel(date)}
              </p>
              {spend > 0 && <p className="text-[11px] text-dim">− {rp(spend)}</p>}
            </div>
            <div className="mt-1 surface px-3">
              {list.map((item) => (
                <TxRow key={item.tx_id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
      </div>

      {editing && (
        <EditSheet
          initial={editing}
          accounts={accounts.map((a) => ({ id: a.id, name: a.name, balance: a.balance }))}
          categories={cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind, color: c.color, icon: c.icon }))}
        />
      )}

      <BottomNav />
    </main>
  );
}
