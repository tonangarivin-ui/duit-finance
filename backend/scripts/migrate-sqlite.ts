/**
 * Migrasi data SQLite (Next.js lama) → Postgres (backend baru).
 * Idempotent: pakai ON CONFLICT DO NOTHING, jadi boleh dijalankan ulang.
 * Jalankan: npx tsx scripts/migrate-sqlite.ts
 */
import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { pool } from '../src/db/index.ts';

const FILE = process.env.SQLITE_PATH ?? path.resolve(import.meta.dirname, '../../data/finance.db');
const sqlite = new DatabaseSync(FILE, { readOnly: true });

const q = (s: string) => sqlite.prepare(s).all() as Array<Record<string, any>>;

const accounts = q('SELECT id, name, type, initial_balance, archived, sort FROM accounts');
const categories = q('SELECT id, name, kind, icon, color, budget_limit FROM categories');
const entries = q('SELECT tx_id, kind, account_id, category_id, amount, date, note, created_at FROM entries');

const client = await pool.connect();
try {
  await client.query('BEGIN');

  for (const a of accounts) {
    await client.query(
      `INSERT INTO accounts (id, name, type, initial_balance, archived, sort)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [a.id, a.name, a.type, a.initial_balance, !!a.archived, a.sort],
    );
  }
  for (const c of categories) {
    await client.query(
      `INSERT INTO categories (id, name, kind, icon, color, budget_limit)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.kind, c.icon, c.color, c.budget_limit],
    );
  }
  for (const e of entries) {
    await client.query(
      `INSERT INTO entries (tx_id, kind, account_id, category_id, amount, date, note, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT DO NOTHING`,
      [e.tx_id, e.kind, e.account_id, e.category_id, e.amount, e.date, e.note, e.created_at],
    );
  }

  // serial sequences harus lewat id tertinggi, kalau tidak insert berikutnya tabrakan
  await client.query(`SELECT setval('accounts_id_seq', COALESCE((SELECT MAX(id) FROM accounts), 1))`);
  await client.query(`SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1))`);
  await client.query(`SELECT setval('entries_id_seq', COALESCE((SELECT MAX(id) FROM entries), 1))`);

  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}

// ---- verifikasi: saldo harus identik ----
const sqliteBal = new Map(
  (q(`SELECT a.id, a.initial_balance + COALESCE(SUM(e.amount),0) AS bal
        FROM accounts a LEFT JOIN entries e ON e.account_id = a.id GROUP BY a.id`) as any[]).map(
    (r) => [r.id, Number(r.bal)],
  ),
);
const pgRows = (await pool.query(
  `SELECT a.id, a.initial_balance + COALESCE(SUM(e.amount),0)::float8 AS bal
     FROM accounts a LEFT JOIN entries e ON e.account_id = a.id GROUP BY a.id`,
)).rows as Array<{ id: number; bal: number }>;

let mismatch = 0;
for (const r of pgRows) {
  if (sqliteBal.get(r.id) !== Number(r.bal)) {
    mismatch++;
    console.error(`MISMATCH akun ${r.id}: sqlite=${sqliteBal.get(r.id)} pg=${r.bal}`);
  }
}
const counts = (await pool.query('SELECT (SELECT count(*) FROM accounts) a, (SELECT count(*) FROM categories) c, (SELECT count(*) FROM entries) e')).rows[0];
console.log({ sqlite: { accounts: accounts.length, categories: categories.length, entries: entries.length }, postgres: counts, mismatch });
if (mismatch > 0) process.exit(1);
await pool.end();
