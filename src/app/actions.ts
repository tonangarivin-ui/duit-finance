'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { createTx, replaceTx, deleteTx, adjustBalance, type TxInput } from '@/lib/ledger';

export type SaveTxInput = {
  kind: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number; // selalu positif dari UI
  accountId: number;
  toAccountId?: number;
  categoryId?: number | null;
  date: string; // YYYY-MM-DD
  note?: string | null;
};

function toTxInput(i: SaveTxInput): TxInput {
  const amount = Math.abs(Math.round(i.amount));
  if (!Number.isFinite(amount) || amount === 0) throw new Error('nominal tidak valid');

  if (i.kind === 'TRANSFER') {
    if (!i.toAccountId) throw new Error('dompet tujuan wajib');
    return {
      kind: 'TRANSFER',
      date: i.date,
      note: i.note,
      entries: [
        { account_id: i.accountId, amount: -amount },
        { account_id: i.toAccountId, amount },
      ],
    };
  }

  return {
    kind: i.kind,
    date: i.date,
    note: i.note,
    entries: [
      {
        account_id: i.accountId,
        amount: i.kind === 'INCOME' ? amount : -amount,
        category_id: i.categoryId ?? null,
      },
    ],
  };
}

export async function saveTx(input: SaveTxInput) {
  const txId = await createTx(toTxInput(input));
  revalidatePath('/');
  revalidatePath('/history');
  return { ok: true as const, txId };
}

export async function updateTx(txId: string, input: SaveTxInput) {
  await replaceTx(txId, toTxInput(input));
  revalidatePath('/');
  revalidatePath('/history');
  return { ok: true as const };
}

export async function removeTx(txId: string) {
  await deleteTx(txId);
  revalidatePath('/');
  revalidatePath('/history');
  return { ok: true as const };
}

export async function setBudgetLimit(categoryId: number, limit: number | null) {
  await api(`/api/categories/${categoryId}`, {
    method: 'PATCH',
    json: { budget_limit: limit === null ? null : Math.round(limit) },
  });
  revalidatePath('/budget');
  revalidatePath('/');
  return { ok: true as const };
}

export async function addAccount(name: string, type: 'CASH' | 'BANK' | 'EWALLET', initial: number) {
  const clean = name.trim();
  if (!clean) throw new Error('nama dompet wajib');
  await api('/api/accounts', {
    json: { name: clean, type, initial_balance: Math.round(initial), sort: Date.now() % 100000 },
  });
  revalidatePath('/');
  revalidatePath('/settings');
  return { ok: true as const };
}

export async function renameAccount(id: number, name: string) {
  const clean = name.trim();
  if (!clean) throw new Error('nama dompet wajib');
  await api(`/api/accounts/${id}`, { method: 'PATCH', json: { name: clean } });
  revalidatePath('/');
  revalidatePath('/settings');
  return { ok: true as const };
}

export async function archiveAccount(id: number) {
  await api(`/api/accounts/${id}`, { method: 'PATCH', json: { archived: true } });
  revalidatePath('/');
  revalidatePath('/settings');
  return { ok: true as const };
}

/** Koreksi saldo → selalu jadi baris ADJUSTMENT, tidak pernah update initial_balance. */
export async function setAccountBalance(accountId: number, target: number, date: string) {
  await adjustBalance(accountId, Math.round(target), date);
  revalidatePath('/');
  revalidatePath('/settings');
  return { ok: true as const };
}
