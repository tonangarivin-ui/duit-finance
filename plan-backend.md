# Plan — Backend Finance (Express + Drizzle + Postgres + Better Auth)

Status: in progress
Target: `duit.darklabs.tech` backend terpisah dari Next.js, data pindah dari SQLite → Postgres.

## Keputusan arsitektur

| Hal | Pilihan | Alasan |
|---|---|---|
| Layout | `finance/backend/` (package.json sendiri) | Next.js tetap jalan & live selama migrasi, zero downtime |
| Runtime | Node 22 + TypeScript + `tsx` (dev) / `tsc` (prod) | sama dengan stack yang sudah ada |
| Framework | Express 5 | diminta |
| ORM | Drizzle + `pg` Pool | diminta |
| DB | Postgres 16 lokal, db `finance` | sudah terpasang & running |
| Auth | Better Auth (email+password, session cookie) | diminta; tabel digenerate via CLI, bukan ditulis tangan |
| Port | 3301 (Next.js di 3300) | tidak bentrok |
| Uang | `bigint` mode number (integer rupiah) | sama dengan SQLite: integer, bukan float |
| Multi-user | **Belum** — dataset tunggal, auth cuma gate akses | YAGNI; tambah `user_id` kalau benar-benar butuh >1 orang |

## Fase

**F1 — Skeleton backend (sekarang)**
1. Postgres: role `finance`, db `finance`.
2. `backend/`: Express + Drizzle schema (`accounts`, `categories`, `entries`) mirror 1:1 dari `src/lib/schema.sql`.
3. Better Auth: `/api/auth/*` (signup, signin, signout, session).
4. Routes bisnis (semua butuh session): `/api/accounts`, `/api/categories`, `/api/entries`, `/api/summary`.
5. Migrasi data: SQLite → Postgres lewat script sekali jalan, verifikasi saldo sama.
6. Verifikasi: curl end-to-end (signup → login → create tx → cek saldo).

**F2 — Ganti lapisan data Next.js** ✅ selesai

`src/lib/ledger.ts` sekarang thin client `fetch` ke backend (`src/lib/api.ts` meneruskan cookie session).
Halaman tetap Server Components; `node:sqlite`, `lib/db.ts`, dan script seed lama dihapus dari src
(dipindah ke `/tmp/finance-legacy`).

- `db.ts` / `ledger` SQLite / `auth-node.ts` / `scripts/{demo,init,seed}.ts` → dipensiunkan.
- Login: form lama (password saja) di-proxy ke Better Auth; password lama (scrypt) diverifikasi sekali
  untuk provisioning user Better Auth pertama, lalu semua pakai session Better Auth.
- Beranda cukup 1 request (`/api/summary`), bukan 4.
- Terverifikasi: `/`, `/history`, `/insights`, `/budget`, `/settings` render 200 dengan data asli
  lewat API; anonim diarahkan ke `/login`; password salah → `?e=1`, benar → session cookie dipasang.

**F3 — Deploy** ✅ selesai

- DNS: `A api.duit.darklabs.tech → 129.146.2.31` (Cloudflare, unproxied — sama pola dengan `duit`).
- nginx: `/etc/nginx/sites-enabled/api-duit` → proxy `127.0.0.1:3301`, TLS Let's Encrypt
  (`certbot --nginx`, auto-renew, expiry 27 Jan 2027). HTTP → HTTPS redirect otomatis.
- Backend env: `BETTER_AUTH_URL=https://api.duit.darklabs.tech`, `CORS_ORIGINS` = duit + api + localhost.
- Cookie sekarang `__Secure-better-auth.session_token` (otomatis karena baseURL https). Middleware
  Next menerima nama lama & baru; logout hapus keduanya.
- Next tetap bicara ke backend lewat loopback (`FINANCE_API_URL=http://127.0.0.1:3301`) — publik
  hanya untuk client lain nanti (mobile), tidak dipakai frontend.
- Login Next.js lama (`fin_session` HMAC) resmi pensiun.

Belum: rate limit per-IP di level nginx/backend, dan `drizzle-kit generate` (file migrasi) sebelum
ada perubahan skema berikutnya.

## Golden rules yang dipertahankan (dari `src/lib/ledger.ts`)

- Saldo **tidak pernah disimpan**; selalu dihitung dari mutasi (`initial_balance + SUM(entries.amount)`).
- Transaksi = grup baris `entries` dengan `tx_id` sama. Transfer = 2 leg, jumlah 0, tanpa kategori.
- INCOME wajib +, EXPENSE wajib −, ADJUSTMENT tanpa kategori.
- Edit = hapus grup lama, tulis grup baru (bukan update baris).
- Semua validasi di satu fungsi (`assertValidTx`) yang dipakai semua jalur tulis.

## Definition of done F1

- [x] `curl /api/auth/sign-up/email` → 200 + cookie session
- [x] `curl /api/accounts` tanpa cookie → 401
- [x] POST transaksi transfer → 2 baris entries, saldo 2 dompet berubah benar
- [x] Saldo hasil migrasi Postgres == saldo SQLite (angka identik: 3 dompet, 10 kategori, 4 entries, mismatch 0)

## Catatan eksekusi

- Service: `finance-api.service` (systemd user), `127.0.0.1:3301`, log via journalctl.
- Skema auth digenerate `@better-auth/cli` → `src/db/auth-schema.ts` (tabel `user/session/account/verification`).
- User pertama: `owner@example.com` (password dipegang user, tidak disimpan di repo).
- Skema DB di-push pakai `drizzle-kit push` (belum pakai file migrasi — bikin `drizzle-kit generate` sebelum F3).
- `.env` berisi DATABASE_URL (password role `finance`), BETTER_AUTH_SECRET, CORS_ORIGINS.
