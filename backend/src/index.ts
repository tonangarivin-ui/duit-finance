import 'dotenv/config';
import express, { type RequestHandler } from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.ts';
import { api, requireSession } from './routes.ts';
import { pool } from './db/index.ts';

const app = express();
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  }),
);

// Better Auth HARUS sebelum express.json() — body diparse olehnya.
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json({ limit: '256kb' }));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true, db: 'up' });
  } catch {
    res.status(503).json({ ok: false, db: 'down' });
  }
});

/** Instance demo: data contoh, dan pengunjung tidak boleh mengubah/menghapusnya. */
const readOnlyDemo: RequestHandler = (req, res, next) => {
  if (process.env.DEMO_READ_ONLY === '1' && req.method !== 'GET') {
    res.status(403).json({ error: 'mode demo: hanya baca' });
    return;
  }
  next();
};

app.use('/api', requireSession, readOnlyDemo, api);

app.use((_req, res) => res.status(404).json({ error: 'not found' }));

const port = Number(process.env.PORT ?? 3301);
app.listen(port, '127.0.0.1', () => console.log(`finance-api listening on 127.0.0.1:${port}`));
