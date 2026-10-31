'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveTx, updateTx, removeTx, type SaveTxInput } from '@/app/actions';
import { todayWib } from '@/lib/format';
import Keypad from './Keypad';
import CatIcon from './CatIcon';

type Account = { id: number; name: string; balance: number };
type Category = { id: number; name: string; kind: string; color: string | null; icon: string | null };

/** Diisi kalau sheet dibuka untuk edit (dari /history?tx=<id>). */
export type EditedTx = {
  tx_id: string;
  kind: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  accountId: number;
  toAccountId: number | null;
  categoryId: number | null;
  date: string;
  note: string | null;
};

export default function QuickAdd({
  accounts,
  categories,
  open,
  onClose,
  initial,
}: {
  accounts: Account[];
  categories: Category[];
  open: boolean;
  onClose: () => void;
  initial?: EditedTx | null;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>(initial?.kind ?? 'EXPENSE');
  const [raw, setRaw] = useState(initial ? String(initial.amount) : '');
  const [accountId, setAccountId] = useState<number>(initial?.accountId ?? accounts[0]?.id ?? 0);
  const [toAccountId, setToAccountId] = useState<number>(initial?.toAccountId ?? accounts[1]?.id ?? 0);
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial?.date ?? todayWib());
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [armed, setArmed] = useState(false); // konfirmasi 2 ketuk, bukan dialog native

  useEffect(() => {
    if (initial) return; // mode edit: jangan ditimpa dompet terakhir
    const last = Number(localStorage.getItem('lastAccount'));
    if (last) setAccountId(last);
  }, [initial]);

  useEffect(() => {
    if (open && !initial) {
      setRaw('');
      setNote('');
      setCategoryId(null);
      setKind('EXPENSE');
      setDate(todayWib());
      setErr(null);
    }
  }, [open, initial]);

  const amount = Number(raw || 0);
  const visibleCats = categories.filter((c) => c.kind === kind);
  const valid =
    amount > 0 &&
    accountId > 0 &&
    (kind === 'TRANSFER'
      ? toAccountId > 0 && toAccountId !== accountId
      : categoryId != null);

  const submit = () => {
    if (!valid) return;
    setErr(null);
    const payload = {
      kind,
      amount,
      accountId,
      toAccountId,
      categoryId,
      date,
      note,
    } as SaveTxInput;

    start(async () => {
      try {
        if (initial) await updateTx(initial.tx_id, payload);
        else await saveTx(payload);
        localStorage.setItem('lastAccount', String(accountId));
        onClose();
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'gagal simpan');
      }
    });
  };

  const hapus = () => {
    if (!initial) return;
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    start(async () => {
      try {
        await removeTx(initial.tx_id);
        onClose();
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'gagal hapus');
      }
    });
  };

  if (!open) return null;

  const color =
    kind === 'EXPENSE' ? 'text-expense' : kind === 'INCOME' ? 'text-income' : 'text-gold';

  return (
    <div className="fixed inset-0 z-50 bg-bg/70" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 surface rounded-t-2xl p-4 pb-5 lg:inset-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-[430px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded bg-line" />

        <div className="mb-3 grid grid-cols-3 gap-2">
          {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setCategoryId(null);
              }}
              className={`rounded-xl py-2 text-sm font-semibold ${
                kind === k ? 'bg-gold text-onaccent' : 'bg-chip text-dim'
              }`}
            >
              {k === 'EXPENSE' ? 'Keluar' : k === 'INCOME' ? 'Masuk' : 'Transfer'}
            </button>
          ))}
        </div>

        <div className={`num mb-0.5 text-right text-4xl font-bold ${color}`}>
          {amount > 0 ? amount.toLocaleString('id-ID') : '0'}
        </div>
        <div className="num mb-3 text-right text-xs text-dim">
          {amount > 0 ? `Rp ${amount.toLocaleString('id-ID')}` : 'ketuk angka di bawah'}
        </div>

        {kind === 'TRANSFER' ? (
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(Number(e.target.value))}
            aria-label="dompet tujuan"
            className="mb-3 w-full rounded-xl bg-chip p-3 text-sm text-ink outline-none"
          >
            {accounts
              .filter((a) => a.id !== accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  Ke: {a.name}
                </option>
              ))}
          </select>
        ) : (
          <div className="mb-3 flex flex-wrap gap-2">
            {visibleCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  categoryId === c.id ? 'bg-gold text-onaccent' : 'bg-chip text-dim'
                }`}
              >
                <CatIcon
                  icon={c.icon}
                  color={categoryId === c.id ? '#08090B' : (c.color ?? '#9CA3AF')}
                  size={13}
                />
                {c.name}
              </button>
            ))}
          </div>
        )}

        <select
          value={accountId}
          onChange={(e) => setAccountId(Number(e.target.value))}
          aria-label="dompet"
          className="mb-3 w-full rounded-xl bg-chip p-3 text-sm text-ink outline-none"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · Rp {a.balance.toLocaleString('id-ID')}
            </option>
          ))}
        </select>

        <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)"
            className="w-full rounded-xl bg-chip p-3 text-sm text-ink outline-none placeholder:text-dim"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="tanggal"
            className="num rounded-xl bg-chip p-3 text-xs text-dim outline-none"
          />
        </div>

        {err && <p className="mb-2 text-xs text-expense">{err}</p>}

        <Keypad value={raw} onChange={setRaw} onSubmit={submit} disabled={!valid || pending} />

        {initial && (
          <button
            type="button"
            onClick={hapus}
            disabled={pending}
            className={`mt-2 w-full rounded-xl border py-2.5 text-sm font-semibold disabled:opacity-50 ${
              armed
                ? 'border-expense bg-expense text-white'
                : 'border-expense/40 text-expense'
            }`}
          >
            {armed ? 'Ketuk lagi untuk hapus' : 'Hapus transaksi'}
          </button>
        )}
      </div>
    </div>
  );
}
