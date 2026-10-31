import { scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Verifikasi password lama (era SQLite): `scrypt:<saltHex>:<hashHex>` di env.
 * Hanya dipakai sekali per user — jalur provisioning di /api/login:
 * login pertama yang cocok dengan hash lama otomatis bikin akun Better Auth
 * dengan password yang sama. Setelah itu jalur ini tidak pernah kena lagi.
 */
export function verifyLegacyPassword(input: string): boolean {
  const stored = process.env.FINANCE_AUTH_HASH;
  if (!stored) return false;

  const [algo, saltHex, hashHex] = stored.split(':');
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false;

  const want = Buffer.from(hashHex, 'hex');
  const got = scryptSync(input, Buffer.from(saltHex, 'hex'), want.length);
  return got.length === want.length && timingSafeEqual(got, want);
}
