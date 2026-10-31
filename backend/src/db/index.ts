import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';
import * as authSchema from './auth-schema.ts';

export const allSchema = { ...schema, ...authSchema };

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema: allSchema });
