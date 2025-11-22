# Ready-Made Commands Reference

Use these commands to set up, test, and deploy your application. Copy & paste them into your terminal.

---

## 🚀 QUICK START (5 minutes)

### 1. Install Dependencies
```bash
npm install && cd functions && npm install && cd ..
```
**What it does**: Installs all frontend and backend packages

---

### 2. Start Development Server
```bash
npm run dev
```
**What it does**: Starts Vite dev server on http://localhost:5173
**Expected output**: 
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

### 3. Run Tests to Verify Everything
```bash
node tests/run_tests.js
```
**What it does**: Checks all files exist, dependencies installed, config valid
**Expected output**:
```
✅ Passed: 45
❌ Failed: 0
🎉 All tests passed!
```

---

## 🧪 TESTING & VALIDATION

### Run File Structure Tests
```bash
node tests/run_tests.js
```

### Build Production Version
```bash
npm run build
```
**Expected**: Creates `dist/` folder with optimized files

### Preview Production Build Locally
```bash
npm run preview
```
**Opens**: http://localhost:4173 (production build preview)

---

## 🔧 BACKEND SETUP (Cloud Run)

### 1. Build Docker Image
```bash
cd functions && docker build -t gcr.io/YOUR_PROJECT_ID/ptd-backend:latest . && cd ..
```
**Replace**: `YOUR_PROJECT_ID` with your Google Cloud project ID

### 2. Push to Google Cloud Registry
```bash
docker push gcr.io/YOUR_PROJECT_ID/ptd-backend:latest
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy ptd-backend \
  --image gcr.io/YOUR_PROJECT_ID/ptd-backend:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your_gemini_key_here \
  --allow-unauthenticated
```
**Result**: Get URL like `https://ptd-backend-xxxxx.us-central1.run.app`

### 4. Update Frontend with Backend URL
```bash
# Edit .env.local or services/apiClient.ts
VITE_API_BASE_URL=https://ptd-backend-xxxxx.us-central1.run.app
```

---

## 🚀 FIREBASE DEPLOYMENT

### 1. Login to Firebase
```bash
firebase login
```

### 2. Initialize Firebase (if needed)
```bash
firebase init
```
**Select**: 
- Hosting
- Functions
- Firestore

### 3. Deploy Everything
```bash
firebase deploy
```

### 4. Deploy Only Frontend
```bash
firebase deploy --only hosting
```

### 5. Deploy Only Backend Functions
```bash
firebase deploy --only functions
```

### 6. View Deployment Logs
```bash
firebase functions:log
```

---

## 📊 VERTEX AI WORKBENCH

### 1. Create Workbench Instance (via Google Cloud Console)
```bash
# Go to: Vertex AI → Workbench → Create User-Managed Notebook
# Config:
#   - Machine type: n1-standard-4
#   - Framework: Python 3.11 with Jupyter
#   - Name: ad-generator-workbench
```

### 2. Upload Notebook to Workbench
```bash
# In Workbench file browser, click Upload
# Select: Vertex_AI_Ad_Generator.ipynb
# Upload video file: video.mp4
```

### 3. Run Notebook
```python
# Cell 1: Install dependencies
!pip install -q -U google-generativeai

# Cell 2: Configure Gemini API
import google.generativeai as genai
genai.configure(api_key="your_gemini_key")

# Run remaining cells in order
```

---

## 📝 CONFIGURATION

### Update .env.local File
```bash
cat > .env.local << 'EOF'
# Firebase
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_key

# Backend URL (after Cloud Run deployment)
VITE_API_BASE_URL=https://ptd-backend-xxxxx.us-central1.run.app
EOF
```

### Enable Firebase Emulator Locally
```bash
firebase emulators:start
```
**Runs locally**: Firestore, Functions, Hosting emulators

---

## 🧹 CLEANUP & MAINTENANCE

### Clear Node Modules (if having issues)
```bash
rm -rf node_modules package-lock.json
npm install
```

### Clear Build Cache
```bash
rm -rf dist/
npm run build
```

### Clear Firebase Cache
```bash
rm -rf .firebase/
firebase login --reauth
```

### Remove Docker Image
```bash
docker rmi gcr.io/YOUR_PROJECT_ID/ptd-backend:latest
```

---

## 🔍 DEBUGGING & LOGS

### View Frontend Logs (DevTools)
```javascript
// In browser console
console.log('Checking API connection...');
fetch('https://YOUR_BACKEND_URL/health')
  .then(r => r.json())
  .then(d => console.log('Backend OK:', d))
  .catch(e => console.error('Backend Error:', e));
```

### View Backend Cloud Run Logs
```bash
gcloud run services describe ptd-backend --region us-central1
gcloud run services logs read ptd-backend --region us-central1 --limit 50
```

### View Firebase Function Logs
```bash
firebase functions:log
```

### Test API Endpoint
```bash
# Check if backend is running
curl https://YOUR_BACKEND_URL/health

# Test avatars endpoint
curl https://YOUR_BACKEND_URL/api/avatars

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_BACKEND_URL/api/analyze
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Analyze Bundle Size
```bash
npm run build
npm install -g webpack-bundle-analyzer
# Then add to vite.config.ts and rebuild
```

### Compress Videos (before upload)
```bash
# Install ffmpeg first: brew install ffmpeg
ffmpeg -i input.mp4 -c:v libx265 -crf 23 output.mp4
```

### Enable Gzip Compression
```bash
# In vite.config.ts
import compression from 'vite-plugin-compression';

export default {
  plugins: [compression()],
  // ...
};
```

---

## 🔐 SECURITY

### Set Up Firebase Rules
```bash
# Deploy firestore.rules
firebase deploy --only firestore:rules
```

### Enable Cloud Run Security
```bash
# Require authentication
gcloud run services update ptd-backend \
  --no-allow-unauthenticated \
  --region us-central1

# Or with identity-based access
gcloud run services add-iam-policy-binding ptd-backend \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT \
  --role=roles/run.invoker
```

### Rotate API Keys
```bash
# In Google Cloud Console:
# APIs & Services → Credentials → Rotate keys
```

---

## 📈 MONITORING & ALERTS

### View Cloud Run Metrics
```bash
gcloud run services describe ptd-backend --region us-central1
gcloud monitoring dashboards list
```

### Set Up Error Alert
```bash
# In Google Cloud Console:
# Monitoring → Create Alert Policy
# Condition: Function error rate > 5%
# Notification: Email
```

### View Firebase Analytics
```bash
# In Firebase Console:
# Analytics → Events → View real-time data
```

---

## 🌐 DOMAIN & SSL

### Set Custom Domain (Firebase)
```bash
firebase hosting:channel:deploy main --channel live
# Then connect custom domain in Firebase Console
```

### Get SSL Certificate Status
```bash
# Firebase automatically provides SSL
# Check: https://your-domain.web.app
curl -I https://your-domain.web.app
```

---

## 💾 BACKUP & RECOVERY

### Backup Firestore Database
```bash
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

### Restore Firestore Database
```bash
gcloud firestore import gs://your-bucket/backup-2024xxxx
```

### Backup Cloud Storage
```bash
gsutil -m cp -r gs://your-bucket /local/backup/
```

---

## 🚄 ADVANCED DEPLOYMENT

### Blue-Green Deployment
```bash
# Deploy new version
gcloud run deploy ptd-backend-v2 --image gcr.io/YOUR_PROJECT/ptd-backend:v2

# Switch traffic gradually
gcloud run services update-traffic ptd-backend-v2 \
  --to-revisions ptd-backend-v1=50,ptd-backend-v2=50
```

### Multi-Region Deployment
```bash
# Deploy to multiple regions
for region in us-central1 europe-west1 asia-northeast1; do
  gcloud run deploy ptd-backend \
    --image gcr.io/YOUR_PROJECT/ptd-backend:latest \
    --region $region
done
```

### Load Balancer Setup
```bash
gcloud compute backend-services create ptd-backend-lb \
  --global \
  --protocol HTTPS \
  --port-name https
```

---

## 🔗 USEFUL LINKS

- **Firebase Console**: https://console.firebase.google.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Vertex AI Console**: https://console.cloud.google.com/vertex-ai
- **Gemini API Docs**: https://ai.google.dev
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs/

---

## 📞 QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| **Port 5173 in use** | `lsof -i :5173` then `kill -9 PID` |
| **Firebase auth fails** | `firebase login --reauth` |
| **Gemini API 429 error** | Rate limit exceeded, wait 60s or upgrade quota |
| **CORS error** | Check backend CORS settings in functions/src/index.ts |
| **Build fails** | `npm run build -- --watch` to see errors |
| **Docker build fails** | Check Dockerfile uses correct Node version |

---

## ✅ VERIFICATION CHECKLIST

Before going live:

```bash
# 1. Run tests
node tests/run_tests.js

# 2. Build production
npm run build

# 3. Check bundle size
du -sh dist/

# 4. Test backend
curl https://YOUR_BACKEND_URL/health

# 5. Test frontend
npm run preview  # Visit http://localhost:4173

# 6. Check all features work
# - Upload video
# - Extract audio
# - Generate storyboard
# - Test AI features

# 7. Verify deployment
firebase deploy --dry-run

# 8. Deploy!
firebase deploy
```

---

**Need help?** Check `COMPLETE_SETUP_GUIDE.md` or `QUICK_START_TESTING.md`
