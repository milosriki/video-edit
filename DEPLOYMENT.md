# Firebase Deployment Guide for PTD Fitness Demo

## Migration Complete ✅

The application has been successfully migrated from a local Express server with better-sqlite3 to Firebase Functions with Firestore.

## What Changed

### Removed
- ❌ `/server` folder (old Express server with SQLite)
- ❌ Local database file (`analyst.db`)
- ❌ `better-sqlite3` dependency

### Added
- ✅ `/functions` folder with Firebase Cloud Functions
- ✅ Firebase configuration files (`.firebaserc`, `firebase.json`)
- ✅ Firestore database integration
- ✅ Updated API routing through Firebase Functions

## Pre-Deployment Checklist

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Functions Dependencies
```bash
cd functions
npm install
cd ..
```

### 4. Set Environment Variables

You need to configure the Gemini API key for Firebase Functions:

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY_HERE"
```

To verify the configuration:
```bash
firebase functions:config:get
```

### 5. Build the Frontend
```bash
npm run build
```

This will create a `dist` folder that Firebase Hosting will serve.

## Deployment Steps

### Deploy Everything (Recommended for First Deploy)
```bash
firebase deploy
```

This deploys both hosting and functions.

### Deploy Only Functions
```bash
firebase deploy --only functions
```

### Deploy Only Hosting
```bash
firebase deploy --only hosting
```

## Local Testing with Firebase Emulators

### 1. Start the Emulators
```bash
firebase emulators:start
```

This will start:
- Functions emulator on `http://localhost:5001`
- Hosting emulator on `http://localhost:5000`
- Firestore emulator on `http://localhost:8080`

### 2. Test with Vite Dev Server
In a separate terminal:
```bash
npm run dev
```

The Vite dev server (port 3000) is configured to proxy API requests to the Firebase Functions emulator.

## Firestore Database Setup

### Initial Data Seeding (Optional)

If you need to seed the Firestore database with mock data for testing, you can use the Firebase Console or create a script.

Example seed data structure:

#### Collection: `creatives`
```json
{
  "id": "creative-01",
  "name": "Summer Sale Video",
  "platform": "reels",
  "campaign": "Q3-Summer-Promo",
  "created_at": 1699999999999
}
```

#### Collection: `metrics`
```json
{
  "creative_id": "creative-01",
  "ts": 1699999999999,
  "impressions": 5000,
  "clicks": 150,
  "conversions": 15,
  "spend": 50.00,
  "revenue": 450.00
}
```

### Firestore Indexes

The following composite indexes may be needed for queries:

1. **metrics collection**
   - Fields: `ts` (Ascending), `creative_id` (Ascending)
   - Query scope: Collection

Firebase will prompt you to create these indexes automatically when you first run queries that need them.

## API Endpoints

All endpoints are now served through the `api` Cloud Function at: `https://YOUR_PROJECT_ID.web.app/api/*`

### Available Endpoints

#### AI Endpoints
- `GET /api/avatars` - List customer avatars
- `POST /api/analyze` - Analyze video content
- `POST /api/creatives` - Generate ad creatives
- `POST /api/creatives/rank` - Rank creatives

#### Performance Dashboard
- `GET /api/health` - Health check
- `GET /api/overview?from=TIMESTAMP&to=TIMESTAMP` - Overview metrics
- `GET /api/creatives?from=TIMESTAMP&to=TIMESTAMP` - Creative performance
- `GET /api/timeseries?from=TIMESTAMP&to=TIMESTAMP&creativeId=ID&metric=METRIC` - Time series data
- `POST /api/events` - Ingest metrics events

## Monitoring and Logs

### View Function Logs
```bash
firebase functions:log
```

### View Logs in Firebase Console
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `ptd-fitness-demo`
3. Navigate to Functions → Logs

## Troubleshooting

### Issue: "Function not found" error
**Solution**: Make sure you've deployed the functions:
```bash
firebase deploy --only functions
```

### Issue: Firestore permission denied
**Solution**: Check Firestore security rules in the Firebase Console. For development, you can use:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // WARNING: Only for development!
    }
  }
}
```

For production, implement proper security rules.

### Issue: CORS errors
**Solution**: The Firebase Function is configured with `cors({ origin: true })` which allows all origins. Adjust if needed.

### Issue: Cold start delays
**Solution**: Firebase Functions have cold starts. Consider:
- Using minimum instances (paid feature)
- Implementing proper loading states in the UI
- Using Firebase's function scheduling to keep functions warm

## Cost Considerations

### Free Tier Limits (Spark Plan)
- Functions: 125K invocations/month, 40K GB-seconds, 40K CPU-seconds
- Hosting: 10 GB storage, 360 MB/day transfer
- Firestore: 1 GiB storage, 50K reads/day, 20K writes/day

### Upgrading to Blaze Plan
For production use with the investor demo, you may need to upgrade to the Blaze (pay-as-you-go) plan to ensure:
- No function invocation limits
- Higher Firestore quotas
- Better performance with minimum instances

## Post-Deployment Verification

1. ✅ Visit your deployed site: `https://ptd-fitness-demo.web.app`
2. ✅ Test the AI endpoints through the UI
3. ✅ Check that the Performance Dashboard loads
4. ✅ Verify Firestore data is being written (Firebase Console)
5. ✅ Review function logs for any errors

## Support

For issues with:
- **Firebase**: https://firebase.google.com/support
- **Gemini API**: https://ai.google.dev/docs
- **This Application**: Check the GitHub issues or contact the development team

---

**Last Updated**: 2025-11-17  
**Migration Version**: 1.0  
**Firebase Project**: ptd-fitness-demo
