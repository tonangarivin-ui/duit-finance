import { api } from './api';

// Tipis di atas REST backend (../backend). Semua aturan bisnis ada di sana —
// file ini sengaja tidak menyimpan logika apa pun supaya tidak ada dua sumber kebenaran.

export type Kind = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';

export type EntryInput = {
  account_id: number;
  amount: number; // signed: + masuk, − keluar
  category_id?: number | null;
};

export type TxInput = {
  kind: Kind;
  date: string; // YYYY-MM-DD
  note?: string | null;
  entries: EntryInput[];
};

export type AccountBalance = {
  id: number;
  name: string;
  type: string;
  initial_balance: number;
  balance: number;
};

export type Category = {
  id: number;
  name: string;
  kind: 'INCOME' | 'EXPENSE';
  icon: string | null;
  color: string | null;
  budget_limit: number | null;
};

export type HistoryItem = {
  tx_id: string;
  kind: Kind;
  date: string;
  note: string | null;
  amount: number;
  signed: number;
  account: string;
  toAccount: string | null;
  category: string | null;
  color: string | null;
  icon: string | null;
};

export type TxDetail = {
  tx_id: string;
  kind: Kind;
  date: string;
  note: string | null;
  amount: number;
  accountId: number;
  toAccountId: number | null;
  categoryId: number | null;
};

export type CatSpend = {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  spent: number;
  limit: number | null;
};

export type MonthFlow = { month: string; income: number; expense: number };
export type MonthSummary = { income: number; expense: number; net: number };

export type HistoryFilter = {
  from?: string;
  to?: string;
  accountId?: number;
  categoryId?: number;
  q?: string;
  limit?: number;
};

const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

/** Satu request untuk beranda: saldo + ringkasan bulan + transaksi terakhir. */
export const getHome = (month: string) =>
  api<{
    month: string;
    accounts: AccountBalance[];
    total: number;
    summary: MonthSummary;
    recent: HistoryItem[];
  }>(`/api/summary${qs({ month })}`);

export const balances = () => api<AccountBalance[]>('/api/accounts/balances');
export const listCategories = () => api<Category[]>('/api/categories');
export const listHistory = (f: HistoryFilter = {}) =>
  api<HistoryItem[]>(`/api/entries${qs(f as Record<string, unknown>)}`);
export const getTx = (txId: string) => api<TxDetail>(`/api/entries/${encodeURIComponent(txId)}`);
export const categorySpend = async (month: string) =>
  (await api<{ byCategory: CatSpend[] }>(`/api/insights${qs({ month })}`)).byCategory;
export const cashflowByMonth = async () =>
  (await api<{ cashflow: MonthFlow[] }>('/api/insights')).cashflow;
export const budgetRows = async (month: string) =>
  (await api<{ rows: CatSpend[] }>(`/api/budget${qs({ month })}`)).rows;

export const netWorth = async () => (await balances()).reduce((s, a) => s + a.balance, 0);
export const monthSummary = async (month: string) => (await getHome(month)).summary;

export const createTx = async (tx: TxInput) =>
  (await api<{ tx_id: string }>('/api/entries', { json: tx })).tx_id;
export const replaceTx = (txId: string, tx: TxInput) =>
  api<{ ok: true }>(`/api/entries/${encodeURIComponent(txId)}`, { method: 'PUT', json: tx });
export const deleteTx = (txId: string) =>
  api<{ ok: true }>(`/api/entries/${encodeURIComponent(txId)}`, { method: 'DELETE' });

/** Koreksi saldo → backend mencatatnya sebagai baris ADJUSTMENT, bukan update balance. */
export const adjustBalance = (accountId: number, targetBalance: number, date: string) =>
  api<{ ok: true }>(`/api/accounts/${accountId}/adjust`, {
    json: { target_balance: targetBalance, date },
  });
