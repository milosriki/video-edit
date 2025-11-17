# Firebase Functions

This directory contains the Firebase Cloud Functions for the PTD Fitness Demo application.

## Overview

The backend has been migrated from a local Express server using better-sqlite3 to Firebase Functions with Firestore for persistence.

## Structure

```
functions/
├── src/
│   ├── index.ts                 # Main Firebase Functions entry point
│   ├── services/
│   │   └── geminiService.ts     # AI service using Google Gemini API
│   └── ai/
│       └── knowledge/
│           ├── avatars.json     # Customer avatar definitions
│           └── copyDatabase.json # Copy templates for ads
├── package.json                 # Dependencies
└── tsconfig.json               # TypeScript configuration
```

## API Endpoints

All endpoints are exposed through the `api` Firebase Function and are accessible via `/api/*` routes.

### AI Endpoints

- `GET /api/avatars` - Get list of customer avatars
- `POST /api/analyze` - Analyze video content and generate strategy
- `POST /api/creatives` - Generate ad creative blueprints
- `POST /api/creatives/rank` - Rank creatives by predicted ROI

### Performance Dashboard Endpoints (Firestore-based)

- `GET /api/health` - Health check
- `GET /api/overview` - Get aggregated metrics for a time range
- `GET /api/creatives` - Get creative performance data
- `GET /api/timeseries` - Get timeseries data for a specific creative
- `POST /api/events` - Ingest new metrics events

## Firestore Collections

### `creatives`
Stores creative metadata:
- `id` (string) - Creative ID
- `name` (string) - Creative name
- `platform` (string) - Platform (reels, tiktok, shorts)
- `campaign` (string) - Campaign name
- `created_at` (number) - Creation timestamp

### `metrics`
Stores performance metrics:
- `creative_id` (string) - Reference to creative
- `ts` (number) - Timestamp
- `impressions` (number)
- `clicks` (number)
- `conversions` (number)
- `spend` (number)
- `revenue` (number)

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

4. View logs:
   ```bash
   npm run logs
   ```

## Environment Variables

Required environment variables (set in Firebase Functions config):
- `GEMINI_API_KEY` - Google Gemini API key

To set environment variables:
```bash
firebase functions:config:set gemini.api_key="YOUR_API_KEY"
```

## Notes

- The SSE streaming endpoint (`/api/stream`) from the old server has not been implemented as it's not suitable for serverless functions. Consider using Firestore real-time listeners on the client side instead.
- All database operations now use Firestore instead of SQLite.
- CORS is enabled for all origins in the Firebase Function.
