# PRD — Finance Tracker (Ledger)

**Versi:** 1.0 · 29 Okt 2026
**Target:** 1 user (pemilik), input 3–5 transaksi/hari dari HP
**Host:** `finance.vunk.my.id`

## Masalah

Aplikasi catatan keuangan gagal karena dua hal: (a) input terlalu panjang sehingga user malas mencatat, (b) saldo mulai selisih setelah transaksi diedit/dihapus sehingga user berhenti percaya angka.

## Tujuan

1. Input transaksi selesai < 5 detik dari tekan `+`.
2. Saldo **tidak mungkin** selisih: saldo selalu hasil mutasi, bukan angka tersimpan.
3. Laporan bulanan (pemasukan, pengeluaran, surplus/defisit, per kategori) otomatis benar tanpa hitung manual.

## Non-goals (MVP)

- Multi-user / sharing / login aplikasi (proteksi via nginx basic auth).
- Recurring transaction, multi-currency, OCR struk, sinkronisasi offline/service worker.
- Anggaran historis per bulan (satu angka per kategori, berlaku tiap bulan).

## Fitur & Acceptance Criteria

| # | Fitur | AC (diverifikasi manual) |
|---|---|---|
| F1 | Quick Add | Tekan `+` → sheet muncul dengan keypad aktif → isi nominal, kategori, dompet → Simpan → sheet tutup, saldo berubah, total waktu < 5 detik |
| F2 | Tiga tipe transaksi | Transfer mengurangi dompet asal + menambah tujuan, **net worth tidak berubah**, dan **tidak masuk** hitungan pemasukan/pengeluaran bulanan |
| F3 | Edit transaksi | Ubah nominal 35.000 → 50.000: saldo = saldo_awal − 50.000 (bukan − 85.000), jumlah baris mutasi tetap 1 |
| F4 | Hapus transaksi | Hapus → saldo kembali tepat ke nilai sebelum transaksi, baris mutasi hilang |
| F5 | Koreksi saldo | Ubah saldo ke angka manual → tersimpan sebagai baris `ADJUSTMENT` sebesar selisih, **bukan** update `initial_balance` |
| F6 | Dashboard | Net worth = Σ saldo dompet; eye toggle menyembunyikan nominal; ringkasan bulan ini menampilkan masuk/keluar/surplus-defisit |
| F7 | Riwayat | Daftar per tanggal + subtotal pengeluaran harian; filter rentang waktu, dompet, kategori, dan pencarian catatan |
| F8 | Insight | Donut porsi pengeluaran per kategori + tren 6 bulan (masuk vs keluar) |
| F9 | Anggaran | Set limit per kategori; bar hijau <75%, kuning 75–99%, merah ≥100% + label Overbudget |
| F10 | Manajemen dompet | Tambah dompet (nama, tipe, saldo awal), ganti nama, arsip; dompet arsip hilang dari pilihan & net worth |

## Aturan bisnis (tidak boleh dilanggar)

1. `amount` = integer rupiah, bertanda (`+` masuk, `−` keluar). Tidak ada desimal.
2. Transaksi `TRANSFER` = tepat 2 leg, jumlah = 0, dompet berbeda, tanpa kategori.
3. `INCOME`/`EXPENSE` = tepat 1 leg, wajib kategori, tanda harus sesuai tipe.
4. `ADJUSTMENT` = 1 leg, tanpa kategori, hanya dibuat lewat fungsi koreksi saldo.
5. Semua tulis (create/replace/delete) dibungkus satu transaksi DB.
6. Tanggal transaksi = `YYYY-MM-DD` zona Asia/Jakarta. Dilarang pakai `toISOString()`.

## Metrik sukses

- Waktu input median < 5 detik (diukur stopwatch 3×).
- Selisih `SUM(entries.amount)` vs perubahan saldo yang dilihat user = 0 setelah 20 aksi campur (create/edit/delete/transfer).
