PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  type            TEXT    NOT NULL CHECK (type IN ('CASH','BANK','EWALLET')),
  initial_balance INTEGER NOT NULL DEFAULT 0,
  archived        INTEGER NOT NULL DEFAULT 0,
  sort            INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  kind         TEXT    NOT NULL CHECK (kind IN ('INCOME','EXPENSE')),
  icon         TEXT,
  color        TEXT,
  budget_limit INTEGER
);

CREATE TABLE IF NOT EXISTS entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_id       TEXT    NOT NULL,
  kind        TEXT    NOT NULL CHECK (kind IN ('INCOME','EXPENSE','TRANSFER','ADJUSTMENT')),
  account_id  INTEGER NOT NULL REFERENCES accounts(id),
  category_id INTEGER REFERENCES categories(id),
  amount      INTEGER NOT NULL,
  date        TEXT    NOT NULL,
  note        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS entries_tx   ON entries(tx_id);
CREATE INDEX IF NOT EXISTS entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS entries_acc  ON entries(account_id);

INSERT INTO categories (id, name, kind, icon, color, budget_limit) VALUES
  (1,'Makan & Minum','EXPENSE','utensils','#EF4444',NULL),
  (2,'Transportasi','EXPENSE','car','#F59E0B',NULL),
  (3,'Tagihan','EXPENSE','receipt','#8B5CF6',NULL),
  (4,'Belanja','EXPENSE','shopping-bag','#EC4899',NULL),
  (5,'Kopi & Nongkrong','EXPENSE','coffee','#E5A93C',NULL),
  (6,'Kesehatan','EXPENSE','heart-pulse','#22C55E',NULL),
  (7,'Lain-lain','EXPENSE','circle-ellipsis','#6B7280',NULL),
  (8,'Gaji','INCOME','wallet','#22C55E',NULL),
  (9,'Bonus','INCOME','gift','#3B82F6',NULL),
  (10,'Lain-lain','INCOME','circle-plus','#6B7280',NULL)
ON CONFLICT(id) DO NOTHING;
