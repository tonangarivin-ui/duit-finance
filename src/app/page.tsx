import { getHome } from '@/lib/ledger';
import { rp, monthWib, dayLabel } from '@/lib/format';
import NetWorthCard from '@/components/NetWorthCard';
import TxRow from '@/components/TxRow';
import BottomNav from '@/components/BottomNav';

export const dynamic = 'force-dynamic';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export default async function Home() {
  const { accounts, total, summary: month, recent } = await getHome(monthWib());

  const [y, m] = monthWib().split('-');
  const max = Math.max(month.income, month.expense, 1);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6 lg:max-w-5xl lg:px-8 lg:pt-10">
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-8">
        {/* ---- kolom kiri (desktop): saldo + ringkasan bulan ---- */}
        <div className="space-y-4">
          <NetWorthCard
            total={total}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name, balance: a.balance }))}
          />

          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {MONTHS[Number(m) - 1]} {y}
              </p>
              <span
                className={`num rounded-full px-2 py-1 text-[11px] font-semibold ${
                  month.net >= 0 ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense'
                }`}
              >
                {month.net >= 0 ? 'Surplus' : 'Defisit'} {rp(month.net)}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div>
                <div className="num flex justify-between text-xs text-dim">
                  <span>Pemasukan</span>
                  <span className="text-income">{rp(month.income)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-chip">
                  <div
                    className="h-1.5 rounded bg-income"
                    style={{ width: `${(month.income / max) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="num flex justify-between text-xs text-dim">
                  <span>Pengeluaran</span>
                  <span className="text-expense">{rp(month.expense)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-chip">
                  <div
                    className="h-1.5 rounded bg-expense"
                    style={{ width: `${(month.expense / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ---- kolom kanan (desktop): transaksi terakhir ---- */}
        <section className="mt-5 flex flex-1 flex-col lg:mt-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Transaksi Terakhir</h2>
            <a href="/history" className="text-[11px] text-dim underline">
              Lihat semua
            </a>
          </div>

          {recent.length === 0 ? (
            <div className="surface mt-2 flex min-h-[clamp(11rem,34dvh,20rem)] flex-1 items-center justify-center px-6 py-10 text-center">
              <p className="max-w-[22ch] text-xs leading-relaxed text-dim">
                Belum ada transaksi. Ketuk tombol + untuk mencatat.
              </p>
            </div>
          ) : (
            <div className="surface mt-2 px-3">
              {recent.map((item, i) => (
                <div key={item.tx_id}>
                  {(i === 0 || recent[i - 1].date !== item.date) && (
                    <p className="pt-3 text-[11px] font-medium uppercase tracking-wider text-dim">
                      {dayLabel(item.date)}
                    </p>
                  )}
                  <TxRow item={item} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
