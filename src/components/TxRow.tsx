import Link from 'next/link';
import { rp } from '@/lib/format';
import type { HistoryItem } from '@/lib/ledger';
import CatIcon from './CatIcon';

export default function TxRow({ item }: { item: HistoryItem }) {
  const isTransfer = item.kind === 'TRANSFER';
  const sign = isTransfer ? '' : item.signed > 0 ? '+' : '−';
  const color = isTransfer
    ? 'text-dim'
    : item.kind === 'ADJUSTMENT'
      ? 'text-dim'
      : item.signed > 0
        ? 'text-income'
        : 'text-expense';

  const title =
    item.kind === 'TRANSFER'
      ? 'Transfer'
      : item.kind === 'ADJUSTMENT'
        ? 'Penyesuaian saldo'
        : (item.category ?? 'Tanpa kategori');

  const icon =
    item.kind === 'TRANSFER' ? 'transfer' : item.kind === 'ADJUSTMENT' ? 'adjustment' : item.icon;

  const subtitle =
    item.kind === 'TRANSFER' ? `${item.account} → ${item.toAccount ?? '?'}` : item.account;

  return (
    <Link
      href={`/history?tx=${item.tx_id}`}
      className="flex items-center gap-3 border-b border-line px-1 py-3 last:border-b-0 active:bg-chip/40"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${item.color ?? '#6B7280'}22` }}
      >
        <CatIcon icon={icon} color={item.color ?? '#9CA3AF'} size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-[11px] text-dim">
          {subtitle}
          {item.note ? ` · ${item.note}` : ''}
        </span>
      </span>

      <span className={`num shrink-0 text-sm font-semibold ${color}`}>
        {sign}
        {rp(item.amount)}
      </span>
    </Link>
  );
}
