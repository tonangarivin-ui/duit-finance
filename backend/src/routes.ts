import { Router, type RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.ts';
import {
  adjustBalance, balances, budgetRows, cashflowByMonth, categoryById, categorySpend,
  createAccount, createCategory, createTx, deleteAccount, deleteCategory, deleteTx,
  getTx, listAccounts, listCategories, listHistory, monthSummary, netWorth,
  replaceTx, updateAccount, updateCategory,
} from './lib/ledger.ts';
import type { TxInput } from './lib/validators.ts';

/** Semua route di bawah ini wajib session Better Auth. */
export const requireSession: RequestHandler = async (req, res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.locals.session = session;
  next();
};

const wrap = (fn: (...a: any[]) => Promise<any>) => async (req: any, res: any) => {
  try {
    const out = await fn(req, res);
    if (!res.headersSent) res.json(out ?? { ok: true });
  } catch (err: any) {
    // drizzle membungkus error pg di err.cause — jangan bocorkan SQL ke client
    const pgErr = err?.cause ?? err;
    const code: string | undefined = pgErr?.code;
    if (code === '23505') return void res.status(409).json({ error: 'data sudah ada (duplikat)' });
    if (code === '23503') return void res.status(400).json({ error: 'relasi tidak ditemukan (dompet/kategori)' });
    const msg = code ? `db error ${code}` : (pgErr?.message ?? 'error');
    res.status(400).json({ error: msg });
  }
};

const id = (req: any) => Number(req.params.id);

export const api = Router();

api.get('/me', wrap(async (_req, res) => ({ user: res.locals.session.user })));

// ---- ringkasan ----
api.get('/summary', wrap(async (req) => {
  const month = String(req.query.month ?? new Date().toISOString().slice(0, 7));
  return {
    month,
    accounts: await balances(),
    total: await netWorth(),
    summary: await monthSummary(month),
    recent: await listHistory({ limit: 10 }),
  };
}));

api.get('/insights', wrap(async (req) => {
  const month = String(req.query.month ?? new Date().toISOString().slice(0, 7));
  return { month, cashflow: await cashflowByMonth(6), byCategory: await categorySpend(month) };
}));

api.get('/budget', wrap(async (req) => {
  const month = String(req.query.month ?? new Date().toISOString().slice(0, 7));
  return { month, rows: await budgetRows(month) };
}));

// ---- dompet ----
api.get('/accounts', wrap(async () => listAccounts()));
api.get('/accounts/balances', wrap(async () => balances()));
api.post('/accounts', wrap(async (req) => createAccount(req.body)));
api.patch('/accounts/:id', wrap(async (req) => {
  const row = await updateAccount(id(req), req.body);
  if (!row) throw new Error('akun tidak ditemukan');
  return row;
}));
api.delete('/accounts/:id', wrap(async (req) => ({ result: await deleteAccount(id(req)) })));
api.post('/accounts/:id/adjust', wrap(async (req) => {
  await adjustBalance(id(req), Number(req.body.target_balance), String(req.body.date));
  return { ok: true };
}));

// ---- kategori ----
api.get('/categories', wrap(async () => listCategories()));
api.get('/categories/:id', wrap(async (req) => {
  const row = await categoryById(id(req));
  if (!row) throw new Error('kategori tidak ditemukan');
  return row;
}));
api.post('/categories', wrap(async (req) => createCategory(req.body)));
api.patch('/categories/:id', wrap(async (req) => {
  const row = await updateCategory(id(req), req.body);
  if (!row) throw new Error('kategori tidak ditemukan');
  return row;
}));
api.delete('/categories/:id', wrap(async (req) => ({ result: (await deleteCategory(id(req))) ? 'deleted' : 'missing' })));

// ---- transaksi (grup entries) ----
api.get('/entries', wrap(async (req) => {
  const q = req.query;
  return listHistory({
    from: q.from ? String(q.from) : undefined,
    to: q.to ? String(q.to) : undefined,
    accountId: q.accountId ? Number(q.accountId) : undefined,
    categoryId: q.categoryId ? Number(q.categoryId) : undefined,
    q: q.q ? String(q.q) : undefined,
    limit: q.limit ? Number(q.limit) : undefined,
  });
}));
api.get('/entries/:txId', wrap(async (req) => {
  const tx = await getTx(req.params.txId);
  if (!tx) throw new Error('transaksi tidak ditemukan');
  return tx;
}));
api.post('/entries', wrap(async (req) => ({ tx_id: await createTx(req.body as TxInput) })));
api.put('/entries/:txId', wrap(async (req) => {
  await replaceTx(req.params.txId, req.body as TxInput);
  return { ok: true };
}));
api.delete('/entries/:txId', wrap(async (req) => {
  await deleteTx(req.params.txId);
  return { ok: true };
}));
