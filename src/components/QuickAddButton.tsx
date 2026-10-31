'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import QuickAdd from './QuickAdd';

type Account = { id: number; name: string; balance: number };
type Category = { id: number; name: string; kind: string; color: string | null; icon: string | null };

export default function QuickAddButton({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  if (path === '/login') return null; // FAB tidak boleh muncul di halaman login

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tambah transaksi"
        className="fixed bottom-20 right-5 z-40 lg:bottom-8 lg:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-onaccent shadow-lg shadow-black/40"
      >
        <Plus size={26} strokeWidth={2.6} aria-hidden />
      </button>
      <QuickAdd
        accounts={accounts}
        categories={categories}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
