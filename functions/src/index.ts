import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { 
  analyzeVideoContent, 
  generateAdCreatives, 
  rankCreatives, 
  CampaignBrief,
  getAvatars
} from './services/geminiService.js';
import * as avatars from './ai/knowledge/avatars.json' with { type: 'json' };

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }) as any);

// --- AI ENDPOINTS ---

app.get('/avatars', (_req, res) => {
  try {
    const avatarList = getAvatars();
    res.json(avatarList);
  } catch (error) {
     console.error('--- CRITICAL ERROR in /avatars ---', error);
     res.status(500).json({ error: 'Failed to load customer avatars.' });
  }
});

app.post('/analyze', async (req, res) => {
  try {
    const { allVideoData } = req.body;
    if (!allVideoData || !Array.isArray(allVideoData) || allVideoData.length === 0) {
      return res.status(400).json({ error: 'Invalid request: "allVideoData" must be a non-empty array.' });
    }
    const strategy = await analyzeVideoContent(allVideoData);
    res.json(strategy);
  } catch (error) {
    console.error('--- CRITICAL ERROR in /analyze ---', error);
    res.status(500).json({ error: 'Failed to analyze video content due to an internal server error.' });
  }
});

app.post('/creatives', async (req, res) => {
  try {
    const { brief, avatarKey, strategy } = req.body as { 
      brief: CampaignBrief, 
      avatarKey: string, 
      strategy: any 
    };
    if (!brief || !avatarKey || !strategy) {
      return res.status(400).json({ error: 'Invalid request: "brief", "avatarKey", and "strategy" are required.' });
    }
    if (!Object.keys((avatars as any).default).includes(avatarKey)) {
        return res.status(400).json({ error: `Invalid avatarKey specified: ${avatarKey}` });
    }

    const creatives = await generateAdCreatives(brief, avatarKey, strategy);
    res.json(creatives);
  } catch (error: any) {
    console.error('--- CRITICAL ERROR in /creatives ---', error);
    res.status(500).json({ error: 'Failed to generate ad creatives due to an internal server error.' });
  }
});

app.post('/creatives/rank', async (req, res) => {
  try {
    const { creatives, avatarKey, brief } = req.body || {};
    if (!Array.isArray(creatives) || !avatarKey || !brief) {
      return res.status(400).json({ error: 'Missing creatives, avatarKey, or brief' });
    }
    const ranked = await rankCreatives(brief, avatarKey, creatives);
    res.json(ranked);
  } catch (e: any) {
    console.error('--- CRITICAL ERROR in /creatives/rank ---', e);
    res.status(500).json({ error: e?.message ?? 'Failed to rank creatives' });
  }
});

// --- PERFORMANCE DASHBOARD ENDPOINTS (Firestore-based) ---

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/overview', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "Missing 'from' or 'to' query parameters." });

    const fromTs = Number(from);
    const toTs = Number(to);

    const metricsSnapshot = await db.collection('metrics')
      .where('ts', '>=', fromTs)
      .where('ts', '<=', toTs)
      .get();

    let impressions = 0, clicks = 0, conversions = 0, spend = 0, revenue = 0;
    
    metricsSnapshot.forEach(doc => {
      const data = doc.data();
      impressions += data.impressions || 0;
      clicks += data.clicks || 0;
      conversions += data.conversions || 0;
      spend += data.spend || 0;
      revenue += data.revenue || 0;
    });

    const ctr = impressions > 0 ? clicks / impressions : 0;
    const cvr = clicks > 0 ? conversions / clicks : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roas = spend > 0 ? (revenue - spend) / spend : 0;

    res.json({ totals: { impressions, clicks, conversions, spend, revenue, ctr, cvr, cpa, roas } });
  } catch (error) {
    console.error('--- ERROR in /overview ---', error);
    res.status(500).json({ error: 'Failed to fetch overview data.' });
  }
});

app.get('/creatives', async (req, res) => {
  try {
    const { from, to, sort = 'roas', order = 'desc', limit = 50 } = req.query;
    if (!from || !to) return res.status(400).json({ error: "Missing 'from' or 'to' query parameters." });

    const fromTs = Number(from);
    const toTs = Number(to);
    const safeLimit = Math.min(100, Number(limit));

    const metricsSnapshot = await db.collection('metrics')
      .where('ts', '>=', fromTs)
      .where('ts', '<=', toTs)
      .get();

    const creativesMap = new Map<string, any>();

    for (const doc of metricsSnapshot.docs) {
      const data = doc.data();
      const creativeId = data.creative_id;

      if (!creativesMap.has(creativeId)) {
        const creativeDoc = await db.collection('creatives').doc(creativeId).get();
        const creativeData = creativeDoc.data();
        
        creativesMap.set(creativeId, {
          creativeId,
          name: creativeData?.name || 'Unknown',
          platform: creativeData?.platform || 'Unknown',
          campaign: creativeData?.campaign || 'Unknown',
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0
        });
      }

      const creative = creativesMap.get(creativeId);
      creative.impressions += data.impressions || 0;
      creative.clicks += data.clicks || 0;
      creative.conversions += data.conversions || 0;
      creative.spend += data.spend || 0;
      creative.revenue += data.revenue || 0;
    }

    const results = Array.from(creativesMap.values()).map(r => {
      const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
      const cvr = r.clicks > 0 ? r.conversions / r.clicks : 0;
      const cpa = r.conversions > 0 ? r.spend / r.conversions : 0;
      const roas = r.spend > 0 ? (r.revenue - r.spend) / r.spend : 0;
      return { ...r, ctr, cvr, cpa, roas };
    });

    const validSortColumns = ['roas', 'revenue', 'spend', 'conversions', 'clicks', 'impressions', 'ctr', 'cvr', 'cpa'];
    const safeSort = validSortColumns.includes(sort as string) ? sort : 'roas';
    const safeOrder = order === 'asc' ? 1 : -1;

    results.sort((a, b) => {
      const valA = a[safeSort as keyof typeof a];
      const valB = b[safeSort as keyof typeof b];
      return (valB - valA) * safeOrder;
    });

    res.json(results.slice(0, safeLimit));
  } catch (error) {
    console.error('--- ERROR in /creatives ---', error);
    res.status(500).json({ error: 'Failed to fetch creatives data.' });
  }
});

app.get('/timeseries', async (req, res) => {
  try {
    const { from, to, creativeId, metric = 'revenue' } = req.query;
    if (!from || !to || !creativeId) return res.status(400).json({ error: "Missing 'from', 'to', or 'creativeId' query parameters." });
    
    const validMetrics = ['impressions', 'clicks', 'conversions', 'spend', 'revenue'];
    if (!validMetrics.includes(metric as string)) {
        return res.status(400).json({ error: 'Invalid metric specified.' });
    }

    const fromTs = Number(from);
    const toTs = Number(to);
    const dayInMillis = 24 * 60 * 60 * 1000;

    const metricsSnapshot = await db.collection('metrics')
      .where('creative_id', '==', creativeId)
      .where('ts', '>=', fromTs)
      .where('ts', '<=', toTs)
      .get();

    const timeseriesMap = new Map<number, number>();

    metricsSnapshot.forEach(doc => {
      const data = doc.data();
      const tsGroup = Math.floor(data.ts / dayInMillis) * dayInMillis;
      const currentValue = timeseriesMap.get(tsGroup) || 0;
      timeseriesMap.set(tsGroup, currentValue + (data[metric as string] || 0));
    });

    const results = Array.from(timeseriesMap.entries())
      .map(([ts, value]) => ({ ts, value }))
      .sort((a, b) => a.ts - b.ts);

    res.json(results);
  } catch (error) {
    console.error('--- ERROR in /timeseries ---', error);
    res.status(500).json({ error: 'Failed to fetch timeseries data.' });
  }
});

app.post('/events', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    
    const batch = db.batch();
    events.forEach(event => {
      const docRef = db.collection('metrics').doc();
      batch.set(docRef, {
        creative_id: event.creative_id,
        ts: event.ts,
        impressions: event.impressions,
        clicks: event.clicks,
        conversions: event.conversions,
        spend: event.spend,
        revenue: event.revenue
      });
    });

    await batch.commit();
    res.json({ ok: true, ingested: events.length });
  } catch (error) {
    console.error('--- ERROR in /events ---', error);
    res.status(500).json({ error: 'Failed to ingest events.' });
  }
});

// Note: SSE streaming endpoint (/stream) is not implemented in this version
// as it requires a persistent connection which is not ideal for serverless functions.
// Consider using Firebase Realtime Database or Firestore listeners on the client side instead.

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
