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

/** Golden rules ditegakkan di satu tempat. Semua jalur tulis lewat sini. */
export function assertValidTx(tx: TxInput): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) throw new Error('date harus YYYY-MM-DD');
  if (!Array.isArray(tx.entries) || tx.entries.length === 0) throw new Error('entries kosong');

  for (const e of tx.entries) {
    if (!Number.isInteger(e.amount) || e.amount === 0)
      throw new Error('amount integer rupiah, bukan 0');
    if (!Number.isInteger(e.account_id)) throw new Error('account_id wajib');
  }

  if (tx.kind === 'TRANSFER') {
    if (tx.entries.length !== 2) throw new Error('TRANSFER wajib 2 leg');
    const [out, inn] = tx.entries;
    if (out.account_id === inn.account_id) throw new Error('TRANSFER harus beda dompet');
    if (out.amount >= 0) throw new Error('leg pertama TRANSFER harus negatif');
    if (inn.amount <= 0) throw new Error('leg kedua TRANSFER harus positif');
    if (out.amount + inn.amount !== 0) throw new Error('TRANSFER harus balance ke 0');
    if (tx.entries.some((e) => e.category_id)) throw new Error('TRANSFER tidak pakai kategori');
    return;
  }

  if (tx.entries.length !== 1) throw new Error(`${tx.kind} wajib 1 leg`);
  const e = tx.entries[0];
  if (tx.kind === 'INCOME' && e.amount <= 0) throw new Error('INCOME harus positif');
  if (tx.kind === 'EXPENSE' && e.amount >= 0) throw new Error('EXPENSE harus negatif');
  if ((tx.kind === 'INCOME' || tx.kind === 'EXPENSE') && !e.category_id)
    throw new Error('kategori wajib untuk INCOME/EXPENSE');
  if (tx.kind === 'ADJUSTMENT' && e.category_id) throw new Error('ADJUSTMENT tanpa kategori');
}

if (process.argv[1]?.endsWith('validators.ts')) {
  // ponytail: self-check, jalankan `npx tsx src/lib/validators.ts`
  const ok = { kind: 'EXPENSE' as const, date: '2026-10-29', entries: [{ account_id: 1, amount: -1000, category_id: 2 }] };
  assertValidTx(ok);
  assertValidTx({ kind: 'TRANSFER', date: '2026-10-29', entries: [{ account_id: 1, amount: -500 }, { account_id: 2, amount: 500 }] });
  const bad: Array<[string, TxInput]> = [
    ['expense positif', { kind: 'EXPENSE', date: '2026-10-29', entries: [{ account_id: 1, amount: 1000, category_id: 2 }] }],
    ['tanpa kategori', { kind: 'EXPENSE', date: '2026-10-29', entries: [{ account_id: 1, amount: -1000 }] }],
    ['transfer tak balance', { kind: 'TRANSFER', date: '2026-10-29', entries: [{ account_id: 1, amount: -500 }, { account_id: 2, amount: 400 }] }],
    ['tanggal salah', { kind: 'ADJUSTMENT', date: '29-10-2026', entries: [{ account_id: 1, amount: 5 }] }],
  ];
  for (const [label, tx] of bad) {
    let threw = false;
    try { assertValidTx(tx); } catch { threw = true; }
    if (!threw) throw new Error(`gagal menolak: ${label}`);
  }
  console.log('validators OK');
}
