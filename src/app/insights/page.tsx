import { categorySpend, cashflowByMonth } from '@/lib/ledger';
import { rp, monthWib } from '@/lib/format';
import BottomNav from '@/components/BottomNav';

export const dynamic = 'force-dynamic';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const monthLabel = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1];

export default async function InsightsPage() {
  const month = monthWib();
  const cats = await categorySpend(month);
  const total = cats.reduce((s, c) => s + c.spent, 0);
  const flow = await cashflowByMonth();

  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = cats.map((c) => {
    const frac = total > 0 ? c.spent / total : 0;
    const seg = { ...c, frac, dash: frac * C, offset: acc * C };
    acc += frac;
    return seg;
  });

  const maxFlow = Math.max(...flow.map((f) => Math.max(f.income, f.expense)), 1);
  const top = cats[0];

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6 lg:max-w-5xl lg:px-8 lg:pt-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Insight</h1>
        <span className="text-[11px] text-dim">
          {monthLabel(month)} {month.slice(0, 4)}
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-4 surface p-4 text-xs text-dim">
          Belum ada pengeluaran bulan ini.
        </p>
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
          <section className="mt-3 surface p-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <svg width="144" height="144" viewBox="0 0 144 144">
                  <circle cx="72" cy="72" r={R} fill="none" stroke="#1B1C20" strokeWidth="16" />
                  {segments.map((s) => (
                    <circle
                      key={s.id}
                      cx="72"
                      cy="72"
                      r={R}
                      fill="none"
                      stroke={s.color ?? '#6B7280'}
                      strokeWidth="16"
                      strokeDasharray={`${s.dash} ${C - s.dash}`}
                      strokeDashoffset={-s.offset}
                      transform="rotate(-90 72 72)"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-dim">Total keluar</span>
                  <span className="num text-sm font-bold">{rp(total)}</span>
                </div>
              </div>

              <ul className="min-w-0 flex-1 space-y-1.5">
                {segments.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-[11px]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color ?? '#6B7280' }}
                    />
                    <span className="min-w-0 flex-1 truncate text-dim">{s.name}</span>
                    <span className="num shrink-0">{Math.round(s.frac * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-4 surface p-4 lg:mt-0">
            <h2 className="text-sm font-semibold">Pengeluaran per kategori</h2>
            <ul className="mt-3 space-y-3">
              {segments.map((s) => (
                <li key={s.id}>
                  <div className="num flex justify-between text-xs">
                    <span className="text-dim">{s.name}</span>
                    <span>{rp(s.spent)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-chip">
                    <div
                      className="h-1.5 rounded"
                      style={{
                        width: `${Math.max(s.frac * 100, 2)}%`,
                        backgroundColor: s.color ?? '#6B7280',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <section className="mt-4 surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Tren 6 Bulan</h2>
          <div className="flex items-center gap-2 text-[10px] text-dim">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-income" /> Masuk
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-expense" /> Keluar
            </span>
          </div>
        </div>

        <div className="mt-4 flex h-32 items-end justify-between gap-2">
          {flow.length === 0 && <p className="text-xs text-dim">Belum ada data.</p>}
          {flow.map((f) => (
            <div key={f.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-28 w-full items-end justify-center gap-1">
                <div
                  className="w-2.5 rounded-t bg-income"
                  style={{ height: `${(f.income / maxFlow) * 100}%` }}
                  title={`Masuk ${rp(f.income)}`}
                />
                <div
                  className="w-2.5 rounded-t bg-expense"
                  style={{ height: `${(f.expense / maxFlow) * 100}%` }}
                  title={`Keluar ${rp(f.expense)}`}
                />
              </div>
              <span className="text-[10px] text-dim">{monthLabel(f.month)}</span>
            </div>
          ))}
        </div>
      </section>

      {top && (
        <section className="mt-4 rounded-xl border border-line bg-chip p-4 text-xs text-dim">
          💡 Pengeluaran terbesar bulan ini: <span className="text-ink">{top.name}</span> —{' '}
          {Math.round((top.spent / total) * 100)}% dari total ({rp(top.spent)}).
        </section>
      )}

      <BottomNav />
    </main>
  );
}
