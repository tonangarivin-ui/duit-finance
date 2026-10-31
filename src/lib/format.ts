export const rp = (n: number) => 'Rp ' + Math.abs(n).toLocaleString('id-ID');
export const rpSigned = (n: number) => (n < 0 ? '− ' : '+ ') + rp(n);
export const rpPlain = (n: number) => n.toLocaleString('id-ID');

/** Tanggal WIB 'YYYY-MM-DD' — jangan pakai toISOString() (geser 7 jam). */
export const todayWib = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
export const monthWib = () => todayWib().slice(0, 7);

/** Aritmetika tanggal aman: parse sebagai UTC, geser, ambil bagian tanggal. */
export function addDays(d: string, n: number): string {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** Senin minggu berjalan. */
export function weekStart(d = todayWib()): string {
  const dow = new Date(`${d}T00:00:00Z`).getUTCDay(); // 0 = Minggu
  return addDays(d, -((dow + 6) % 7));
}

export const monthStart = (d = todayWib()) => `${d.slice(0, 8)}01`;

/** 'Hari ini' / 'Kemarin' / '29 Okt 2026'. */
export function dayLabel(d: string): string {
  const t = todayWib();
  if (d === t) return 'Hari ini';
  if (d === addDays(t, -1)) return 'Kemarin';
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
