# Finance Tracker

Aplikasi pencatatan keuangan pribadi. Saldo **selalu** dihitung dari mutasi (`initial_balance + SUM(amount)`), tidak pernah disimpan — jadi edit/hapus/transfer tidak bisa membuat saldo selisih.

## Stack

- Next.js 15 (App Router) + Tailwind + TypeScript
- SQLite via `node:sqlite` (bawaan Node 22) — file `data/finance.db`
- Tes: `node --test` (tanpa jest/vitest)

## Jalan lokal

```bash
npm install
node scripts/init.ts        # bikin 3 dompet (Tunai, BCA, DANA) saldo 0 — idempotent
npm run dev                 # http://localhost:3000
npm test                    # 8 tes ledger
```

Data demo untuk uji chart (hanya DB lokal, ditolak kalau NODE_ENV=production):

```bash
NODE_ENV=development node scripts/demo.ts
```

## Produksi (VPS ini)

- Service: `systemctl --user status finance` (port **3300**, `~/.config/systemd/user/finance.service`)
- Reverse proxy: nginx `/etc/nginx/sites-available/finance` → `127.0.0.1:3300`, basic auth `areif` di `/etc/nginx/.htpasswd-finance`
- Backup harian 02:00 WIB: `finance-backup.timer` → `/data/backups/finance-YYYY-MM-DD.db` (retensi 30 hari)
- Domain: **https://duit.darklabs.tech** — A record langsung ke `129.146.2.31` (DNS-only), TLS Let's Encrypt via certbot (`--nginx`), redirect 80→443 otomatis, renew lewat `certbot.timer`
- **Login aplikasi** (bukan basic auth): form POST `/login` → `/api/login`, cookie `fin_session` HttpOnly+Secure+SameSite=Lax berisi `v1.<exp>.<hmac>` (HMAC-SHA256, stateless — tidak ada tabel sesi). Proteksi semua route di `src/middleware.ts`. "Ingat saya" = 30 hari, tanpa itu = cookie sesi. Rate limit 5 percobaan / 5 menit per IP (in-memory). Logout: tombol di Pengaturan → `POST /api/logout`.
- Kredensial ada di `.env.production` (chmod 600, git-ignored): `FINANCE_AUTH_USER`, `FINANCE_AUTH_HASH` (`scrypt:<saltHex>:<hashHex>` — **pakai ':'**, systemd EnvironmentFile memakan `$`), `FINANCE_AUTH_SECRET`. Ganti password: lihat komentar di bawah.
- basic auth nginx masih ada di file tapi dikomentari (lapisan cadangan kalau perlu).
- Catatan infra: VPS ini 10.0.0.28 di belakang NAT OCI; port 80/443 dibuka di Security List `ocid1.securitylist...dhaeqq` (backup aturan lama: `/data/backups/oci-seclist-before.json`)

Deploy ulang setelah ubah kode:

```bash
cd /home/ubuntu/projects/finance && npm run build && systemctl --user restart finance
```

## Tema (2 pilihan)

Semua warna lewat CSS variable (`--c-*` di `src/app/globals.css`), Tailwind memetakan ke `rgb(var(--c-x) / <alpha-value>)`. Tema ditukar dengan `data-theme` di `<html>`:

- `data-theme` kosong / `dark` → hitam + gold (`#08090B` / `#E5A93C`).
- `data-theme="vanilla"` → light: krem `#F6F1E7`, kartu putih susu `#FFFDF8`, teks coklat `#3A332B`, aksen apricot `#E09A5A`, sage `#4F8F63`, dusty rose `#C0524F`. Ada wash pastel lembut (peach kiri-atas, biru kanan-bawah) + shadow kartu halus.

- Tema lama `glass` otomatis dimigrasi ke `vanilla` oleh inline script di layout (localStorage lama tetap kebaca).
- Toggle ada di **Pengaturan → Tema** (`src/components/ThemeToggle.tsx`), disimpan di `localStorage('fin.theme')`, dan diterapkan sebelum paint oleh inline script di `src/app/layout.tsx` supaya tidak ada flash. Kartu memakai satu class `.surface` yang render-nya beda per tema — jangan tulis `border bg-card` manual di komponen baru, pakai `surface`.

## Aturan yang tidak boleh dilanggar

1. `amount` integer rupiah bertanda (`+` masuk, `−` keluar), tanpa desimal.
2. `TRANSFER` = tepat 2 leg, total 0, dompet beda, tanpa kategori; tidak masuk grafik pemasukan/pengeluaran.
3. `INCOME`/`EXPENSE` = 1 leg, wajib kategori, tanda harus sesuai.
4. Koreksi saldo **hanya** lewat `adjustBalance` → baris `ADJUSTMENT`. Dilarang `UPDATE accounts SET initial_balance`.
5. Semua tulis dibungkus satu transaksi DB (`BEGIN IMMEDIATE`).
6. Tanggal transaksi `YYYY-MM-DD` WIB — jangan `toISOString()`.

## Struktur

```
src/lib/schema.sql   tabel accounts, categories, entries (+10 kategori seed)
src/lib/ledger.ts    assertValidTx, createTx/replaceTx/deleteTx, balances, monthSummary, listHistory, getTx, categorySpend, cashflowByMonth, budgetRows
src/lib/ledger.test.ts  8 tes invariant
src/app/actions.ts   server actions
src/app/page.tsx     dashboard
src/app/history      riwayat + filter + edit/hapus
src/app/insights     donut + tren 6 bulan
src/app/budget       anggaran + ambang warna
src/app/settings     dompet (tambah/rename/arsip/koreksi saldo)
src/components/      Keypad, QuickAdd, NetWorthCard, TxRow, BottomNav, LimitForm, AccountsEditor
PRD.md design.md prototypes/   dokumen + 5 screen Stitch
```

## Ganti password login

```bash
node -e "
const {randomBytes,scryptSync}=require('node:crypto');const fs=require('node:fs');
const salt=randomBytes(16);const hash=scryptSync(process.argv[1],salt,64);
let env=fs.readFileSync('.env.production','utf8').split('\n').filter(l=>l&&!l.startsWith('FINANCE_AUTH_HASH'));
env.push('FINANCE_AUTH_HASH=scrypt:'+salt.toString('hex')+':'+hash.toString('hex'));
fs.writeFileSync('.env.production',env.join('\n')+'\n',{mode:0o600});
" 'PASSWORD_BARU'
systemctl --user restart finance
```
