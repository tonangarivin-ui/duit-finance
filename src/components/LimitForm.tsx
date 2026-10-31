'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setBudgetLimit } from '@/app/actions';

export default function LimitForm({
  categoryId,
  current,
  compact = false,
}: {
  categoryId: number;
  current: number | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(current ? String(current) : '');
  const [pending, start] = useTransition();

  const save = () => {
    const n = Number(value.replace(/\D/g, ''));
    start(async () => {
      await setBudgetLimit(categoryId, Number.isFinite(n) && n > 0 ? n : null);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
        placeholder="0"
        aria-label="batas anggaran"
        className="num w-full rounded-lg bg-chip px-2 py-1.5 text-right text-xs text-ink outline-none placeholder:text-dim"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className={`shrink-0 rounded-lg bg-gold px-2.5 py-1.5 text-[11px] font-semibold text-onaccent disabled:opacity-50 ${
          compact ? '' : 'px-3'
        }`}
      >
        {pending ? '…' : current ? 'Ubah' : 'Simpan'}
      </button>
    </div>
  );
}
