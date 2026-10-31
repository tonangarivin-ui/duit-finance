'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { rp } from '@/lib/format';

type Account = { id: number; name: string; balance: number };

export default function NetWorthCard({
  total,
  accounts,
}: {
  total: number;
  accounts: Account[];
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem('hideNetWorth') === '1');
  }, []);

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem('hideNetWorth', next ? '1' : '0');
  };

  const mask = (s: string) => (hidden ? '••••••' : s);

  return (
    <section className="surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-widest text-dim">TOTAL SALDO</p>
        <button
          type="button"
          onClick={toggle}
          aria-label={hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          className="rounded-lg bg-chip p-1.5 text-dim"
        >
          {hidden ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>

      <p className="num mt-1 text-4xl font-bold text-gold">{mask(rp(total))}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {accounts.map((a) => (
          <span key={a.id} className="num rounded-full bg-chip px-3 py-1.5 text-xs text-dim">
            {a.name} · {mask(rp(a.balance))}
          </span>
        ))}
        {accounts.length === 0 && (
          <span className="text-xs text-dim">Belum ada dompet — tambah di Pengaturan.</span>
        )}
      </div>
    </section>
  );
}
