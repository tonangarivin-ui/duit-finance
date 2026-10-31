import { pgTable, serial, text, integer, bigint, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

const money = (name: string) => bigint(name, { mode: 'number' });

export const accounts = pgTable(
  'accounts',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type', { enum: ['CASH', 'BANK', 'EWALLET'] }).notNull(),
    initialBalance: money('initial_balance').notNull().default(0),
    archived: boolean('archived').notNull().default(false),
    sort: integer('sort').notNull().default(0),
  },
  (t) => [uniqueIndex('accounts_name_uq').on(t.name)],
);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['INCOME', 'EXPENSE'] }).notNull(),
  icon: text('icon'),
  color: text('color'),
  budgetLimit: money('budget_limit'),
});

export const entries = pgTable(
  'entries',
  {
    id: serial('id').primaryKey(),
    txId: text('tx_id').notNull(),
    kind: text('kind', { enum: ['INCOME', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT'] }).notNull(),
    accountId: integer('account_id')
      .notNull()
      .references(() => accounts.id),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    amount: money('amount').notNull(), // signed: + masuk, − keluar
    date: text('date').notNull(), // YYYY-MM-DD, sama seperti SQLite lama (string, bukan Date)
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('entries_tx').on(t.txId), index('entries_date').on(t.date), index('entries_acc').on(t.accountId)],
);
