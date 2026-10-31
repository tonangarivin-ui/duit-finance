import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, allSchema } from './db/index.ts';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  database: drizzleAdapter(db, { provider: 'pg', schema: allSchema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
});
