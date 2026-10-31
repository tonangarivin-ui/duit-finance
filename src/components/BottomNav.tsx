'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartPie, History, House, Settings, Target } from 'lucide-react';

const items = [
  { href: '/', label: 'Beranda', Icon: House },
  { href: '/history', label: 'Riwayat', Icon: History },
  { href: '/insights', label: 'Insight', Icon: ChartPie },
  { href: '/budget', label: 'Anggaran', Icon: Target },
  { href: '/settings', label: 'Atur', Icon: Settings },
];

export default function BottomNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <>
      {/* ================= sidebar (desktop) ================= */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-card/95 px-3 py-6 backdrop-blur lg:flex">
        <div className="mb-8 px-3">
          <p className="text-[10px] font-medium tracking-[0.2em] text-dim">FINANCE</p>
          <p className="mt-0.5 text-sm font-semibold">Catatan Keuangan</p>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-chip text-gold' : 'text-dim hover:bg-chip hover:text-ink'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto px-3 text-[10px] leading-relaxed text-dim">
          Saldo dihitung ulang dari mutasi setiap kali halaman dibuka.
        </p>
      </aside>

      {/* ================= bottom bar (mobile) ================= */}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md justify-around border-t border-line bg-card/95 px-1 py-1.5 backdrop-blur lg:hidden">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium ${
                active ? 'text-gold' : 'text-dim'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
