import 'dotenv/config';
// FIX: Removed explicit Request/Response imports to let Express infer handler types
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// FIX: Import all necessary functions from geminiService
import { 
  analyzeVideoContent, 
  generateAdCreatives, 
  rankCreatives, 
  CampaignBrief,
  getAvatars // This was missing in your guide's version
} from './services/geminiService.js';
import * as avatars from './ai/knowledge/avatars.json' with { type: 'json' };

const app = express();
app.use(cors());
// FIX: Cast to any to resolve a middleware type overload issue.
app.use(express.json({ limit: '50mb' }) as any);

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

// Seed database with mock data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM creatives').get() as { count: number };
if (count.count === 0) {
  console.log('Database is empty. Seeding with mock data...');
  const creativesToInsert = [
    { id: 'creative-01', name: 'Summer Sale Video', platform: 'reels', campaign: 'Q3-Summer-Promo' },
    { id: 'creative-02', name: 'Testimonial Showcase', platform: 'tiktok', campaign: 'Q3-Summer-Promo' },
    { id: 'creative-03', name: 'Product Demo B-Roll', platform: 'shorts', campaign: 'Q3-Branding-Push' },
    { id: 'creative-04', name: 'Influencer Collab', platform: 'reels', campaign: 'Q3-Branding-Push' },
  ];
  const insertCreative = db.prepare('INSERT INTO creatives (id, name, platform, campaign, created_at) VALUES (?, ?, ?, ?, ?)');
  const insertMetric = db.prepare('INSERT INTO metrics (creative_id, ts, impressions, clicks, conversions, spend, revenue) VALUES (?, ?, ?, ?, ?, ?, ?)');

  const now = Date.now();
  const tx = db.transaction(() => {
    for (const creative of creativesToInsert) {
      insertCreative.run(creative.id, creative.name, creative.platform, creative.campaign, now);
      for (let i = 0; i < 30; i++) {
        const ts = now - i * 24 * 60 * 60 * 1000;
        const impressions = 5000 + Math.random() * 5000;
        const clicks = impressions * (0.02 + Math.random() * 0.03);
        const conversions = clicks * (0.05 + Math.random() * 0.1);
        const spend = impressions / 1000 * (5 + Math.random() * 10);
        const revenue = conversions * (20 + Math.random() * 30);
        insertMetric.run(creative.id, ts, Math.round(impressions), Math.round(clicks), Math.round(conversions), spend, revenue);
      }
    }
  });
  tx();
  console.log('Mock data seeded.');
}


// --- NEW AI ENDPOINTS ---

// FIX: Remove explicit types from req, res to allow for type inference
app.get('/api/avatars', (_req, res) => {
  try {
    // FIX: Use the getAvatars function from the service
    const avatarList = getAvatars();
    res.json(avatarList);
  } catch (error) {
     console.error('--- CRITICAL ERROR in /api/avatars ---', error);
     res.status(500).json({ error: 'Failed to load customer avatars.' });
  }
});

// FIX: Remove explicit types from req, res to allow for type inference
app.post('/api/analyze', async (req, res) => {
  try {
    const { allVideoData } = req.body;
    if (!allVideoData || !Array.isArray(allVideoData) || allVideoData.length === 0) {
      return res.status(400).json({ error: 'Invalid request: "allVideoData" must be a non-empty array.' });
    }
    const strategy = await analyzeVideoContent(allVideoData);
    res.json(strategy);
  } catch (error) {
    console.error('--- CRITICAL ERROR in /api/analyze ---', error);
    res.status(500).json({ error: 'Failed to analyze video content due to an internal server error.' });
  }
});

// FIX: Remove explicit types from req, res to allow for type inference
app.post('/api/creatives', async (req, res) => {
  try {
    const { brief, avatarKey, strategy } = req.body as { 
      brief: CampaignBrief, 
      avatarKey: string, 
      strategy: any 
    };
    if (!brief || !avatarKey || !strategy) {
      return res.status(400).json({ error: 'Invalid request: "brief", "avatarKey", and "strategy" are required.' });
    }
    // FIX: Access the default export for the JSON module and correct the check.
    if (!Object.keys((avatars as any).default).includes(avatarKey)) {
        return res.status(400).json({ error: `Invalid avatarKey specified: ${avatarKey}` });
    }

    const creatives = await generateAdCreatives(brief, avatarKey, strategy);
    res.json(creatives);
  } catch (error: any) {
    console.error('--- CRITICAL ERROR in /api/creatives ---', error);
    res.status(500).json({ error: 'Failed to generate ad creatives due to an internal server error.' });
  }
});

// FIX: Remove explicit types from req, res to allow for type inference
app.post('/api/creatives/rank', async (req, res) => {
  try {
    const { creatives, avatarKey, brief } = req.body || {};
    if (!Array.isArray(creatives) || !avatarKey || !brief) {
      return res.status(400).json({ error: 'Missing creatives, avatarKey, or brief' });
    }
    const ranked = await rankCreatives(brief, avatarKey, creatives);
    res.json(ranked);
  } catch (e: any) {
    console.error('--- CRITICAL ERROR in /api/creatives/rank ---', e);
    res.status(500).json({ error: e?.message ?? 'Failed to rank creatives' });
  }
});


// --- PERFORMANCE DASHBOARD ENDPOINTS ---
type SSEClient = { id: number; res: any };
let clients: SSEClient[] = [];
let nextClientId = 1;

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/overview', (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "Missing 'from' or 'to' query parameters." });

    const stmt = db.prepare(`
        SELECT
            SUM(impressions) as impressions,
            SUM(clicks) as clicks,
            SUM(conversions) as conversions,
            SUM(spend) as spend,
            SUM(revenue) as revenue
        FROM metrics
        WHERE ts >= ? AND ts <= ?
    `);
    const totals = stmt.get(from, to) as any;
    if (!totals || !totals.impressions) {
        return res.json({ totals: { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0, ctr: 0, cvr: 0, cpa: 0, roas: 0 } });
    }

    const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
    const cvr = totals.clicks > 0 ? totals.conversions / totals.clicks : 0;
    const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
    const roas = totals.spend > 0 ? (totals.revenue - totals.spend) / totals.spend : 0;

    res.json({ totals: { ...totals, ctr, cvr, cpa, roas } });
});

app.get('/api/creatives', (req, res) => {
    const { from, to, sort = 'roas', order = 'desc', limit = 50 } = req.query;
    if (!from || !to) return res.status(400).json({ error: "Missing 'from' or 'to' query parameters." });

    const validSortColumns = ['roas', 'revenue', 'spend', 'conversions', 'clicks', 'impressions', 'ctr', 'cvr', 'cpa'];
    const safeSort = validSortColumns.includes(sort as string) ? sort : 'roas';
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';
    const safeLimit = Math.min(100, Number(limit));

    const stmt = db.prepare(`
        SELECT
            c.id as creativeId,
            c.name,
            c.platform,
            c.campaign,
            SUM(m.impressions) as impressions,
            SUM(m.clicks) as clicks,
            SUM(m.conversions) as conversions,
            SUM(m.spend) as spend,
            SUM(m.revenue) as revenue
        FROM creatives c
        JOIN metrics m ON c.id = m.creative_id
        WHERE m.ts >= ? AND m.ts <= ?
        GROUP BY c.id, c.name, c.platform, c.campaign
    `);

    const results = (stmt.all(from, to) as any[]).map(r => {
        const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
        const cvr = r.clicks > 0 ? r.conversions / r.clicks : 0;
        const cpa = r.conversions > 0 ? r.spend / r.conversions : 0;
        const roas = r.spend > 0 ? (r.revenue - r.spend) / r.spend : 0;
        return { ...r, ctr, cvr, cpa, roas };
    });

    results.sort((a, b) => {
        const valA = a[safeSort as keyof typeof a];
        const valB = b[safeSort as keyof typeof b];
        return safeOrder === 'ASC' ? valA - valB : valB - valA;
    });

    res.json(results.slice(0, safeLimit));
});

app.get('/api/timeseries', (req, res) => {
    const { from, to, creativeId, metric = 'revenue' } = req.query;
    if (!from || !to || !creativeId) return res.status(400).json({ error: "Missing 'from', 'to', or 'creativeId' query parameters." });
    
    const validMetrics = ['impressions', 'clicks', 'conversions', 'spend', 'revenue'];
    if (!validMetrics.includes(metric as string)) {
        return res.status(400).json({ error: 'Invalid metric specified.' });
    }

    const dayInMillis = 24 * 60 * 60 * 1000;
    const tsGroup = `CAST(ts / ${dayInMillis} AS INTEGER) * ${dayInMillis}`;

    const stmt = db.prepare(`
        SELECT
            ${tsGroup} as ts,
            SUM(${metric}) as value
        FROM metrics
        WHERE ts >= ? AND ts <= ? AND creative_id = ?
        GROUP BY 1
        ORDER BY 1
    `);

    const results = stmt.all(from, to, creativeId);
    res.json(results);
});


app.post('/api/events', (req, res) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];
  const insert = db.prepare('INSERT INTO metrics (creative_id, ts, impressions, clicks, conversions, spend, revenue) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const tx = db.transaction((batch: any[]) => {
    for (const event of batch) {
        insert.run(event.creative_id, event.ts, event.impressions, event.clicks, event.conversions, event.spend, event.revenue);
    }
  });
  tx(events);
  const payload = `data: ${JSON.stringify({ t: Date.now(), type: 'events_ingested' })}\n\n`;
  for (const c of clients) c.res.write(payload);
  res.json({ ok: true, ingested: events.length });
});

app.get('/api/stream', (req: any, res: any) => {
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
  console.log(`🚀 Unified AI Server listening on http://localhost:${PORT}`);
});