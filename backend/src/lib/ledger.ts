import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { accounts, categories, entries } from '../db/schema.ts';
import { assertValidTx, type Kind, type TxInput } from './validators.ts';

// Semua agregat di-cast ::float8 karena pg mengembalikan bigint sebagai string.
// Aman: nilai rupiah jauh di bawah 2^53.

export type AccountBalance = {
  id: number;
  name: string;
  type: string;
  initial_balance: number;
  balance: number;
};

/** Saldo = hasil mutasi. Tidak ada angka tersimpan yang bisa basi. */
export async function balances(): Promise<AccountBalance[]> {
  const res = await db.execute(sql`
    SELECT a.id, a.name, a.type, a.initial_balance::float8 AS initial_balance,
           (a.initial_balance + COALESCE(SUM(e.amount), 0))::float8 AS balance
      FROM accounts a
      LEFT JOIN entries e ON e.account_id = a.id
     WHERE a.archived = false
     GROUP BY a.id
     ORDER BY a.sort, a.id`);
  return res.rows as AccountBalance[];
}

export async function netWorth(): Promise<number> {
  return (await balances()).reduce((s, a) => s + a.balance, 0);
}

export type MonthSummary = { income: number; expense: number; net: number };

export async function monthSummary(month: string): Promise<MonthSummary> {
  const res = await db.execute(sql`
    SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount END), 0)::float8  AS income,
           COALESCE(-SUM(CASE WHEN amount < 0 THEN amount END), 0)::float8 AS expense
      FROM entries
     WHERE date LIKE ${`${month}%`} AND kind IN ('INCOME','EXPENSE')`);
  const row = res.rows[0] as { income: number; expense: number };
  return { income: row.income, expense: row.expense, net: row.income - row.expense };
}

export type Category = {
  id: number;
  name: string;
  kind: 'INCOME' | 'EXPENSE';
  icon: string | null;
  color: string | null;
  budget_limit: number | null;
};

export async function listCategories(): Promise<Category[]> {
  return (await db.execute(sql`
    SELECT id, name, kind, icon, color, budget_limit::float8 AS budget_limit
      FROM categories ORDER BY kind DESC, id`)).rows as Category[];
}

export type HistoryItem = {
  tx_id: string;
  kind: Kind;
  date: string;
  note: string | null;
  amount: number; // selalu positif
  signed: number; // 0 untuk transfer
  account: string;
  toAccount: string | null;
  category: string | null;
  color: string | null;
  icon: string | null;
};

export type HistoryFilter = {
  from?: string;
  to?: string;
  accountId?: number;
  categoryId?: number;
  q?: string;
  limit?: number;
};

export async function listHistory(f: HistoryFilter = {}): Promise<HistoryItem[]> {
  const conds = [];
  if (f.from) conds.push(sql`e.date >= ${f.from}`);
  if (f.to) conds.push(sql`e.date <= ${f.to}`);
  if (f.accountId) conds.push(sql`e.account_id = ${f.accountId}`);
  if (f.categoryId) conds.push(sql`e.category_id = ${f.categoryId}`);
  if (f.q) conds.push(sql`e.note ILIKE ${`%${f.q}%`}`);
  const where = conds.length ? sql`WHERE ${sql.join(conds, sql` AND `)}` : sql``;

  const res = await db.execute(sql`
    SELECT e.tx_id, e.kind, e.date, e.note, e.amount::float8 AS amount,
           e.account_id, a.name AS account, c.name AS category, c.color, c.icon
      FROM entries e
      JOIN accounts a ON a.id = e.account_id
      LEFT JOIN categories c ON c.id = e.category_id
     ${where}
     ORDER BY e.date DESC, e.id DESC`);

  const groups = new Map<string, HistoryItem>();
  for (const r of res.rows as Array<Record<string, any>>) {
    let g = groups.get(r.tx_id);
    if (!g) {
      g = {
        tx_id: r.tx_id,
        kind: r.kind,
        date: r.date,
        note: r.note,
        amount: Math.abs(r.amount),
        signed: r.kind === 'TRANSFER' ? 0 : r.amount,
        account: r.account,
        toAccount: null,
        category: r.category,
        color: r.color,
        icon: r.icon ?? null,
      };
      groups.set(r.tx_id, g);
    }
    if (r.kind === 'TRANSFER') {
      if (r.amount < 0) g.account = r.account;
      else g.toAccount = r.account;
    }
  }

  const out = [...groups.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return f.limit ? out.slice(0, f.limit) : out;
}

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

export async function getTx(txId: string): Promise<TxDetail | null> {
  const res = await db.execute(sql`
    SELECT kind, date, note, amount::float8 AS amount, account_id, category_id
      FROM entries WHERE tx_id = ${txId} ORDER BY amount`);
  const rows = res.rows as Array<{
    kind: Kind;
    date: string;
    note: string | null;
    amount: number;
    account_id: number;
    category_id: number | null;
  }>;
  if (rows.length === 0) return null;
  const outLeg = rows[0];
  const inLeg = rows.find((r) => r.amount > 0);
  return {
    tx_id: txId,
    kind: outLeg.kind,
    date: outLeg.date,
    note: outLeg.note,
    amount: Math.abs(outLeg.amount),
    accountId: outLeg.account_id,
    toAccountId: outLeg.kind === 'TRANSFER' ? (inLeg?.account_id ?? null) : null,
    categoryId: outLeg.category_id ?? null,
  };
}

function legRows(txId: string, tx: TxInput) {
  return tx.entries.map((e) => ({
    txId,
    kind: tx.kind,
    accountId: e.account_id,
    categoryId: e.category_id ?? null,
    amount: e.amount,
    date: tx.date,
    note: tx.note ?? null,
  }));
}

export async function createTx(tx: TxInput): Promise<string> {
  assertValidTx(tx);
  const txId = randomUUID();
  await db.transaction(async (t) => {
    await t.insert(entries).values(legRows(txId, tx));
  });
  return txId;
}

/** Edit = buang seluruh grup lama, tulis grup baru. Saldo ikut benar sendiri. */
export async function replaceTx(txId: string, tx: TxInput): Promise<void> {
  assertValidTx(tx);
  await db.transaction(async (t) => {
    await t.delete(entries).where(eq(entries.txId, txId));
    await t.insert(entries).values(legRows(txId, tx));
  });
}

export async function deleteTx(txId: string): Promise<void> {
  await db.delete(entries).where(eq(entries.txId, txId));
}

export type CatSpend = {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  spent: number;
  limit: number | null;
};

/** Pengeluaran per kategori pada bulan tertentu ('YYYY-MM'). */
export async function categorySpend(month: string): Promise<CatSpend[]> {
  return (await db.execute(sql`
    SELECT c.id, c.name, c.color, c.icon,
           COALESCE(-SUM(e.amount), 0)::float8 AS spent,
           c.budget_limit::float8 AS "limit"
      FROM categories c
      JOIN entries e ON e.category_id = c.id
     WHERE e.date LIKE ${`${month}%`} AND e.kind = 'EXPENSE'
     GROUP BY c.id
    HAVING COALESCE(-SUM(e.amount), 0) > 0
     ORDER BY spent DESC`)).rows as CatSpend[];
}

export async function budgetRows(month: string): Promise<CatSpend[]> {
  const spent = new Map((await categorySpend(month)).map((c) => [c.id, c.spent]));
  const cats = (await db.execute(sql`
    SELECT id, name, color, icon, budget_limit::float8 AS "limit"
      FROM categories WHERE budget_limit IS NOT NULL ORDER BY id`)).rows as Array<Omit<CatSpend, 'spent'>>;
  return cats.map((c) => ({ ...c, spent: spent.get(c.id) ?? 0 }));
}

export type MonthFlow = { month: string; income: number; expense: number };

export async function cashflowByMonth(months = 6): Promise<MonthFlow[]> {
  const res = await db.execute(sql`
    SELECT substr(date, 1, 7) AS month,
           COALESCE(SUM(CASE WHEN amount > 0 THEN amount END), 0)::float8 AS income,
           COALESCE(-SUM(CASE WHEN amount < 0 THEN amount END), 0)::float8 AS expense
      FROM entries WHERE kind IN ('INCOME','EXPENSE')
     GROUP BY month ORDER BY month DESC LIMIT ${months}`);
  return (res.rows as MonthFlow[]).reverse();
}

/** Sesuaikan saldo dompet → selalu jadi baris ADJUSTMENT, bukan update balance. */
export async function adjustBalance(accountId: number, targetBalance: number, date: string): Promise<void> {
  const current = (await balances()).find((a) => a.id === accountId);
  if (!current) throw new Error('akun tidak ditemukan');
  const delta = targetBalance - current.balance;
  if (delta === 0) return; // ponytail: no-op, jangan tulis baris kosong
  await createTx({
    kind: 'ADJUSTMENT',
    date,
    note: 'Penyesuaian saldo',
    entries: [{ account_id: accountId, amount: delta }],
  });
}

// ---- CRUD master data (dipakai routes) ----

export async function listAccounts() {
  return (await db.execute(sql`
    SELECT id, name, type, initial_balance::float8 AS initial_balance, archived, sort
      FROM accounts ORDER BY archived, sort, id`)).rows;
}

export async function createAccount(input: { name: string; type: 'CASH' | 'BANK' | 'EWALLET'; initial_balance?: number; sort?: number }) {
  const [row] = await db
    .insert(accounts)
    .values({
      name: input.name,
      type: input.type,
      initialBalance: input.initial_balance ?? 0,
      sort: input.sort ?? 0,
    })
    .returning();
  return row;
}

export async function updateAccount(id: number, patch: Partial<{ name: string; type: 'CASH' | 'BANK' | 'EWALLET'; initial_balance: number; archived: boolean; sort: number }>) {
  const [row] = await db
    .update(accounts)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.type !== undefined && { type: patch.type }),
      ...(patch.initial_balance !== undefined && { initialBalance: patch.initial_balance }),
      ...(patch.archived !== undefined && { archived: patch.archived }),
      ...(patch.sort !== undefined && { sort: patch.sort }),
    })
    .where(eq(accounts.id, id))
    .returning();
  return row ?? null;
}

/** Dompet dihapus permanen hanya kalau belum punya mutasi. */
export async function deleteAccount(id: number): Promise<'deleted' | 'archived' | 'missing'> {
  const acc = (await db.select().from(accounts).where(eq(accounts.id, id))).at(0);
  if (!acc) return 'missing';
  const used = (await db.execute(sql`SELECT 1 FROM entries WHERE account_id = ${id} LIMIT 1`)).rows.length > 0;
  if (used) {
    await db.update(accounts).set({ archived: true }).where(eq(accounts.id, id));
    return 'archived';
  }
  await db.delete(accounts).where(eq(accounts.id, id));
  return 'deleted';
}

export async function createCategory(input: { name: string; kind: 'INCOME' | 'EXPENSE'; icon?: string | null; color?: string | null; budget_limit?: number | null }) {
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      kind: input.kind,
      icon: input.icon ?? null,
      color: input.color ?? null,
      budgetLimit: input.budget_limit ?? null,
    })
    .returning();
  return row;
}

export async function updateCategory(id: number, patch: Partial<{ name: string; kind: 'INCOME' | 'EXPENSE'; icon: string | null; color: string | null; budget_limit: number | null }>) {
  const [row] = await db
    .update(categories)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.kind !== undefined && { kind: patch.kind }),
      ...(patch.icon !== undefined && { icon: patch.icon }),
      ...(patch.color !== undefined && { color: patch.color }),
      ...(patch.budget_limit !== undefined && { budgetLimit: patch.budget_limit }),
    })
    .where(eq(categories.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCategory(id: number): Promise<boolean> {
  // entries.category_id ON DELETE SET NULL, jadi mutasi lama tetap aman
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
  return deleted.length > 0;
}

export async function categoryById(id: number) {
  return (await db.select().from(categories).where(and(eq(categories.id, id)))).at(0) ?? null;
}
