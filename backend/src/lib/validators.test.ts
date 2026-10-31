import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assertValidTx, type TxInput } from './validators.ts';

const ok = (tx: TxInput) => assert.doesNotThrow(() => assertValidTx(tx));
const rejects = (tx: TxInput, why: RegExp) => assert.throws(() => assertValidTx(tx), why);

test('expense: satu leg negatif dengan kategori', () => {
  ok({ kind: 'EXPENSE', date: '2026-10-29', entries: [{ account_id: 1, amount: -25000, category_id: 2 }] });
});

test('income: satu leg positif dengan kategori', () => {
  ok({ kind: 'INCOME', date: '2026-10-25', entries: [{ account_id: 2, amount: 8500000, category_id: 7 }] });
});

test('transfer: dua leg, beda dompet, jumlah nol, tanpa kategori', () => {
  ok({
    kind: 'TRANSFER',
    date: '2026-10-29',
    entries: [
      { account_id: 1, amount: -500000 },
      { account_id: 2, amount: 500000 },
    ],
  });
  rejects(
    {
      kind: 'TRANSFER',
      date: '2026-10-29',
      entries: [
        { account_id: 1, amount: -500000 },
        { account_id: 2, amount: 400000 },
      ],
    },
    /balance ke 0/,
  );
  rejects(
    {
      kind: 'TRANSFER',
      date: '2026-10-29',
      entries: [
        { account_id: 1, amount: -500000 },
        { account_id: 1, amount: 500000 },
      ],
    },
    /beda dompet/,
  );
});

test('menolak nominal nol, pecahan, dan tanggal salah format', () => {
  rejects({ kind: 'EXPENSE', date: '2026-10-29', entries: [{ account_id: 1, amount: 0, category_id: 2 }] }, /bukan 0/);
  rejects({ kind: 'EXPENSE', date: '2026-10-29', entries: [{ account_id: 1, amount: -10.5, category_id: 2 }] }, /integer/);
  rejects({ kind: 'ADJUSTMENT', date: '29-10-2026', entries: [{ account_id: 1, amount: 5 }] }, /YYYY-MM-DD/);
});

test('menolak kategori yang tidak sesuai jenis transaksi', () => {
  rejects({ kind: 'EXPENSE', date: '2026-10-29', entries: [{ account_id: 1, amount: -1000 }] }, /kategori wajib/);
  rejects({ kind: 'ADJUSTMENT', date: '2026-10-29', entries: [{ account_id: 1, amount: 1000, category_id: 3 }] }, /tanpa kategori/);
});

test('menolak daftar entries kosong', () => {
  rejects({ kind: 'EXPENSE', date: '2026-10-29', entries: [] }, /entries kosong/);
});
