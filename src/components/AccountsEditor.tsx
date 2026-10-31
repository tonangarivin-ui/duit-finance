'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAccount, archiveAccount, renameAccount, setAccountBalance } from '@/app/actions';
import { rp, todayWib } from '@/lib/format';

type Account = { id: number; name: string; type: string; balance: number };

export default function AccountsEditor({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState('');
  const [type, setType] = useState<'CASH' | 'BANK' | 'EWALLET'>('CASH');
  const [initial, setInitial] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setErr(null);
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'gagal');
      }
    });

  const create = () => {
    const n = Number(initial.replace(/\D/g, '')) || 0;
    run(async () => {
      await addAccount(name, type, n);
      setName('');
      setInitial('');
    });
  };

  return (
    <div className="space-y-4">
      {err && <p className="text-xs text-expense">{err}</p>}

      <section className="space-y-2">
        {accounts.map((a) => (
          <AccountRow key={a.id} account={a} run={run} pending={pending} />
        ))}
        {accounts.length === 0 && (
          <p className="surface p-4 text-xs text-dim">
            Belum ada dompet.
          </p>
        )}
      </section>

      <section className="surface border-dashed p-4">
        <h2 className="text-sm font-semibold">Tambah dompet</h2>
        <div className="mt-2 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama dompet (mis. BCA)"
            className="w-full rounded-xl bg-chip px-3 py-2.5 text-sm text-ink outline-none placeholder:text-dim"
          />
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'CASH' | 'BANK' | 'EWALLET')}
              aria-label="tipe dompet"
              className="w-full rounded-xl bg-chip px-3 py-2.5 text-sm text-dim outline-none"
            >
              <option value="CASH">Tunai</option>
              <option value="BANK">Bank</option>
              <option value="EWALLET">E-Wallet</option>
            </select>
            <input
              value={initial}
              onChange={(e) => setInitial(e.target.value.replace(/\D/g, ''))}
              placeholder="Saldo awal"
              inputMode="numeric"
              aria-label="saldo awal"
              className="num w-full rounded-xl bg-chip px-3 py-2.5 text-right text-sm text-ink outline-none placeholder:text-dim"
            />
          </div>
          <button
            type="button"
            onClick={create}
            disabled={pending || !name.trim()}
            className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-onaccent disabled:opacity-50"
          >
            Tambah
          </button>
        </div>
      </section>
    </div>
  );
}

function AccountRow({
  account,
  run,
  pending,
}: {
  account: Account;
  run: (fn: () => Promise<unknown>) => void;
  pending: boolean;
}) {
  const [name, setName] = useState(account.name);
  const [target, setTarget] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);

  return (
    <div className="surface p-3">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={`nama ${account.name}`}
          className="min-w-0 flex-1 rounded-lg bg-transparent text-sm font-semibold text-ink outline-none"
        />
        <span className="num text-sm text-gold">{rp(account.balance)}</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))}
          placeholder="Sesuaikan saldo jadi…"
          inputMode="numeric"
          aria-label={`saldo target ${account.name}`}
          className="num min-w-0 flex-1 rounded-lg bg-chip px-2 py-1.5 text-right text-xs text-ink outline-none placeholder:text-dim"
        />
        <button
          type="button"
          disabled={pending || !target}
          onClick={() => {
            const n = Number(target);
            run(async () => {
              await setAccountBalance(account.id, n, todayWib());
              setTarget('');
            });
          }}
          className="shrink-0 rounded-lg bg-chip px-2.5 py-1.5 text-[11px] font-semibold text-gold disabled:opacity-50"
        >
          Sesuaikan
        </button>
        {name !== account.name && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => renameAccount(account.id, name))}
            className="shrink-0 rounded-lg bg-gold px-2.5 py-1.5 text-[11px] font-semibold text-onaccent disabled:opacity-50"
          >
            Simpan nama
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirmArchive) {
              setConfirmArchive(true);
              setTimeout(() => setConfirmArchive(false), 4000);
              return;
            }
            run(() => archiveAccount(account.id));
          }}
          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-50 ${
            confirmArchive ? 'bg-expense text-white' : 'bg-chip text-dim'
          }`}
        >
          {confirmArchive ? 'Yakin?' : 'Arsip'}
        </button>
      </div>
    </div>
  );
}
