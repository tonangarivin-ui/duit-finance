import { budgetRows, listCategories } from '@/lib/ledger';
import { rp, monthWib } from '@/lib/format';
import BottomNav from '@/components/BottomNav';
import LimitForm from '@/components/LimitForm';
import CatIcon from '@/components/CatIcon';

export const dynamic = 'force-dynamic';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default async function BudgetPage() {
  const month = monthWib();
  const rows = await budgetRows(month);
  const noLimit = (await listCategories()).filter(
    (c) => c.kind === 'EXPENSE' && !rows.some((r) => r.id === c.id),
  );

  const totalLimit = rows.reduce((s, r) => s + (r.limit ?? 0), 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const pct = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6 lg:max-w-5xl lg:px-8 lg:pt-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Anggaran</h1>
        <span className="text-[11px] text-dim">
          {MONTHS[Number(month.slice(5, 7)) - 1]} {month.slice(0, 4)}
        </span>
      </div>

      <section className="mt-3 surface p-4">
        <p className="text-[10px] uppercase tracking-widest text-dim">Total anggaran</p>
        <p className="num mt-1 text-2xl font-bold">{rp(totalLimit)}</p>
        <div className="mt-2 h-2 rounded bg-chip">
          <div className="h-2 rounded bg-gold" style={{ width: `${pct}%` }} />
        </div>
        <div className="num mt-2 flex justify-between text-[11px] text-dim">
          <span>{rp(totalSpent)} terpakai</span>
          <span className={totalLimit - totalSpent < 0 ? 'text-expense' : 'text-income'}>
            {totalLimit - totalSpent < 0 ? 'Lewat ' : 'Sisa '}
            {rp(Math.abs(totalLimit - totalSpent))}
          </span>
        </div>
      </section>

      {rows.length === 0 && (
        <p className="mt-4 surface p-4 text-xs text-dim">
          Belum ada anggaran. Atur batas di bawah.
        </p>
      )}

      <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {rows.map((r) => {
          const ratio = r.limit ? r.spent / r.limit : 0;
          const bar =
            ratio >= 1 ? 'bg-expense' : ratio >= 0.75 ? 'bg-amberish' : 'bg-income';
          const left = (r.limit ?? 0) - r.spent;

          return (
            <section key={r.id} className="surface p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CatIcon icon={r.icon} color={r.color} size={16} />
                  {r.name}
                </p>
                <p className="num text-xs text-dim">
                  {rp(r.spent)} / {rp(r.limit ?? 0)}
                </p>
              </div>

              <div className="mt-2 h-2 rounded bg-chip">
                <div
                  className={`h-2 rounded ${bar}`}
                  style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className={`num text-[11px] ${left < 0 ? 'text-expense' : 'text-dim'}`}>
                  {left < 0 ? `Overbudget ${rp(-left)}` : `Sisa ${rp(left)}`}
                </p>
                <div className="w-32">
                  <LimitForm categoryId={r.id} current={r.limit} compact />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {noLimit.length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold">Atur anggaran kategori lain</h2>
          <div className="mt-2 space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
            {noLimit.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 surface border-dashed p-3"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-xs text-dim">
                  <CatIcon icon={c.icon} color={c.color} size={15} />
                  {c.name}
                </span>
                <div className="w-36">
                  <LimitForm categoryId={c.id} current={null} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}
