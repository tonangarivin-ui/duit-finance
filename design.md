# Design — Finance Tracker

Sumber: prototipe Stitch `projects/6045349927146128127`, design system **Precision Fintech**.
Screenshot referensi: `prototypes/1-dashboard.png` … `5-anggaran.png`.

## Token warna

| Token | Hex | Pakai untuk |
|---|---|---|
| `bg` | `#08090B` | latar halaman |
| `card` | `#121315` | kartu, sheet |
| `chip` | `#1B1C20` | tombol keypad, chip, input |
| `line` | `#2D2F3D` | border 1px, divider |
| `ink` | `#F5F5F7` | teks utama |
| `dim` | `#9CA3AF` | teks sekunder |
| `gold` | `#E5A93C` | aksi utama, net worth, FAB, tab aktif |
| `income` | `#22C55E` | pemasukan, budget aman |
| `amberish` | `#F59E0B` | budget mendekati batas |
| `expense` | `#EF4444` | pengeluaran, overbudget, hapus |

Semua ada di `tailwind.config.ts` (`bg`, `card`, `chip`, `line`, `ink`, `dim`, `gold`, `income`, `expense`, `amberish`).

## Tipografi

- Font: Inter (sans). Nominal uang: `font-mono` + `tabular-nums` agar digit tidak bergeser saat angka berubah.
- Skala: judul halaman 26px/600 · net worth 40px/700 gold · nominal keypad 44px/700 · label 12px/500 · body 14px/400.

## Bentuk & jarak

- Radius: kartu 12px, chip/pill 999px, tombol 12px.
- Padding halaman 16px, jarak antar kartu 12px, baris transaksi tinggi 56px dengan divider 1px `line`.
- Tanpa gradient. Shadow hanya di FAB.

## Layar

1. **Dashboard** — kicker `TOTAL SALDO` + eye toggle; angka gold; pill dompet; kartu bulan (bar masuk/keluar + chip surplus); `Transaksi Terakhir` 10 baris; bottom nav + FAB.
2. **Quick Add (sheet)** — tab Keluar/Masuk/Transfer; nominal besar; chip kategori (wrap); picker dompet (2 picker saat Transfer); catatan + tanggal; keypad 4×4 (`7 8 9 ⌫ / 4 5 6 + / 1 2 3 − / 000 0 = Simpan`).
3. **Riwayat** — search; chip rentang (Hari ini/Minggu ini/Bulan ini/Custom); 2 dropdown; grup tanggal + subtotal harian; baris transfer netral.
4. **Insight** — donut 5 segmen + legenda; progress list kategori; bar chart 6 bulan + garis rata-rata; kartu callout.
5. **Anggaran** — kartu total + bar; baris budget (hijau/amber/merah) + badge Overbudget; kartu dashed tambah anggaran.

## Catatan implementasi (koreksi dari mock)

- Chip jangan horizontal-scroll (mock terpotong) → `flex-wrap`.
- Tab Transfer wajib 2 picker dompet (asal + tujuan); mock hanya satu.
- Tanpa status bar iOS palsu (mock ada dekorasi HP).
- Warna aktif bottom nav = gold (mock hijau di Dashboard).
