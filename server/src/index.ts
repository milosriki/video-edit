
import 'dotenv/config';
// Fix: Changed import to default express import to allow for namespaced types.
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'analyst.db');

const fs = await import('node:fs/promises');
await fs.mkdir(dataDir, { recursive: true });

const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS creatives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    campaign TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creative_id TEXT NOT NULL,
    ts INTEGER NOT NULL,
    impressions INTEGER NOT NULL,
    clicks INTEGER NOT NULL,
    conversions INTEGER NOT NULL,
    spend REAL NOT NULL,
    revenue REAL NOT NULL,
    FOREIGN KEY (creative_id) REFERENCES creatives(id)
  );
`);

const creativeCount = db.prepare('SELECT COUNT(*) as c FROM creatives').get() as any;
if (creativeCount.c === 0) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const creatives = [
    { id: 'cr_1', name: 'Hook-UGC-01', platform: 'Meta', campaign: 'Q4 Prospecting' },
    { id: 'cr_2', name: 'Explainer-15s', platform: 'TikTok', campaign: 'Holiday Promo' },
    { id: 'cr_3', name: 'Testimonial-A', platform: 'YouTube', campaign: 'Always-On' }
  ];

  const insertCreative = db.prepare('INSERT INTO creatives (id, name, platform, campaign, created_at) VALUES (?, ?, ?, ?, ?)');
  creatives.forEach(c => insertCreative.run(c.id, c.name, c.platform, c.campaign, now - 35 * day));

  const insertMetric = db.prepare(`
    INSERT INTO metrics (creative_id, ts, impressions, clicks, conversions, spend, revenue)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of creatives) {
    for (let i = 30; i >= 0; i--) {
      const ts = now - i * day;
      const impr = Math.floor(800 + Math.random() * 6000);
      const clicks = Math.floor(impr * (0.01 + Math.random() * 0.03));
      const conv = Math.floor(clicks * (0.03 + Math.random() * 0.08));
      const spend = +(impr * (0.001 + Math.random() * 0.004)).toFixed(2);
      const revenue = +(conv * (10 + Math.random() * 60)).toFixed(2);
      insertMetric.run(c.id, ts, impr, clicks, conv, spend, revenue);
    }
  }
  console.log('Seeded analyst.db with demo data');
}

// SSE clients
// Fix: Use namespaced express.Response type.
type SSEClient = { id: number; res: express.Response };
let clients: SSEClient[] = [];
let nextClientId = 1;

// Fix: Use namespaced express types for request and response.
app.get('/api/health', (_req: express.Request, res: express.Response) => res.json({ ok: true }));

// Fix: Use namespaced express types for request and response.
app.get('/api/overview', (req: express.Request, res: express.Response) => {
  const from = Number(req.query.from || 0);
  const to = Number(req.query.to || Date.now());
  const row = db.prepare(`
    SELECT
      SUM(impressions) as impressions,
      SUM(clicks) as clicks,
      SUM(conversions) as conversions,
      SUM(spend) as spend,
      SUM(revenue) as revenue
    FROM metrics
    WHERE ts BETWEEN ? AND ?
  `).get(from, to) as any;

  const impressions = row.impressions || 0;
  const clicks = row.clicks || 0;
  const conversions = row.conversions || 0;
  const spend = +(row.spend || 0);
  const revenue = +(row.revenue || 0);

  const ctr = impressions > 0 ? clicks / impressions : 0;
  const cvr = clicks > 0 ? conversions / clicks : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = spend > 0 ? revenue / spend : 0;

  res.json({ totals: { impressions, clicks, conversions, spend, revenue, ctr, cvr, cpa, roas } });
});

// Fix: Use namespaced express types for request and response.
app.get('/api/creatives', (req: express.Request, res: express.Response) => {
  const from = Number(req.query.from || 0);
  const to = Number(req.query.to || Date.now());
  const sort = String(req.query.sort || 'roas');
  const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const limit = Math.min(Number(req.query.limit || 50), 200);

  const rows = db.prepare(`
    SELECT c.id as creativeId, c.name, c.platform, c.campaign,
      SUM(m.impressions) as impressions,
      SUM(m.clicks) as clicks,
      SUM(m.conversions) as conversions,
      SUM(m.spend) as spend,
      SUM(m.revenue) as revenue
    FROM creatives c
    JOIN metrics m ON m.creative_id = c.id
    WHERE m.ts BETWEEN ? AND ?
    GROUP BY c.id
  `).all(from, to) as any[];

  const withDerived = rows.map(r => {
    const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
    const cvr = r.clicks > 0 ? r.conversions / r.clicks : 0;
    const cpa = r.conversions > 0 ? r.spend / r.conversions : 0;
    const roas = r.spend > 0 ? r.revenue / r.spend : 0;
    return { ...r, ctr, cvr, cpa, roas };
  });

  withDerived.sort((a, b) => {
    const aVal = a[sort] ?? 0;
    const bVal = b[sort] ?? 0;
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  res.json(withDerived.slice(0, limit));
});

// Fix: Use namespaced express types for request and response.
app.get('/api/timeseries', (req: express.Request, res: express.Response) => {
  const creativeId = String(req.query.creativeId || '');
  const metric = String(req.query.metric || 'revenue');
  const from = Number(req.query.from || 0);
  const to = Number(req.query.to || Date.now());

  if (!creativeId) return res.status(400).json({ error: 'creativeId required' });

  const rows = db.prepare(`
    SELECT
      ts / 86400000 * 86400000 as dayTs,
      SUM(${metric}) as value
    FROM metrics
    WHERE creative_id = ? AND ts BETWEEN ? AND ?
    GROUP BY dayTs
    ORDER BY dayTs ASC
  `).all(creativeId, from, to) as any[];

  res.json(rows.map(r => ({ ts: Number(r.dayTs), value: Number(r.value) })));
});

// Fix: Use namespaced express types for request and response.
app.post('/api/events', (req: express.Request, res: express.Response) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];
  const insert = db.prepare(`
    INSERT INTO metrics (creative_id, ts, impressions, clicks, conversions, spend, revenue)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction((batch: any[]) => {
    for (const e of batch) {
      insert.run(
        String(e.creativeId),
        Number(e.ts || Date.now()),
        Number(e.impressions || 0),
        Number(e.clicks || 0),
        Number(e.conversions || 0),
        Number(e.spend || 0),
        Number(e.revenue || 0)
      );
    }
  });
  tx(events);

  const payload = `data: ${JSON.stringify({ t: Date.now(), type: 'events_ingested' })}\n\n`;
  for (const c of clients) c.res.write(payload);

  res.json({ ok: true, ingested: events.length });
});

// Fix: Use namespaced express types for request and response.
app.get('/api/stream', (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const id = nextClientId++;
  const client: SSEClient = { id, res };
  clients.push(client);

  res.write(`data: ${JSON.stringify({ t: Date.now(), type: 'connected', id })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== id);
  });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`Analyst server listening on http://localhost:${PORT}`);
});
