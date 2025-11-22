# Quick Start & Testing Guide

## 🚀 Get Started in 5 Minutes

### 1. Run the Setup Script
```bash
chmod +x setup_and_test.sh
./setup_and_test.sh
```

This will:
- ✅ Check Node.js & npm are installed
- ✅ Install all dependencies (frontend + backend)
- ✅ Build the application
- ✅ Run type checks
- ✅ Verify all component files exist
- ✅ Display ready-to-use commands

### 2. Start Development Server
```bash
npm run dev
```
Then open: **http://localhost:5173**

### 3. Test Each Feature

---

## 📋 Feature Testing Checklist

### ✅ Test 1: Video Editor
**Location**: Click "Advanced Editor" tab

**What to Test**:
1. Upload a test video (any .mp4 file)
2. Play video in preview panel
3. Drag timeline to seek through video
4. Click "Trim" button - verify start/end markers appear
5. Try adding a text overlay
6. Export in different resolutions (480p, 720p, 1080p)
7. Download exported video

**Expected Result**: Video processes without errors, exports successfully

---

### ✅ Test 2: Audio Suite
**Location**: Click "Audio Suite" tab

**What to Test**:
1. Upload an audio file (.mp3, .wav)
2. View waveform display
3. Use slider to adjust volume
4. Apply effects (normalization, EQ, reverb)
5. Trim beginning/end of audio
6. Export audio file

**Expected Result**: Audio displays correctly, effects apply smoothly

---

### ✅ Test 3: Image Suite
**Location**: Click "Image Suite" tab

**What to Test**:
1. Upload an image (.jpg, .png)
2. Crop image to different aspect ratios (1:1, 16:9, 9:16)
3. Adjust brightness, contrast, saturation
4. Apply a filter (grayscale, sepia, vibrant)
5. Add text watermark
6. Export image

**Expected Result**: Image edits display in real-time, export works

---

### ✅ Test 4: Storyboard Studio
**Location**: Click "Storyboard Studio" tab

**What to Test**:
1. Upload or import video
2. Wait for AI to auto-generate scenes
3. Edit captions for each scene
4. Adjust timing between scenes
5. Export as PDF or image sequence
6. Share storyboard (if available)

**Expected Result**: Scenes detected, AI generates meaningful descriptions

---

### ✅ Test 5: Performance Dashboard
**Location**: Click "Performance Dashboard" tab

**What to Test**:
1. Select date range (last 7 days)
2. Choose metric (Views, Engagement, Conversion)
3. Filter by Avatar (Dubai Men, Women 40+, etc.)
4. Verify charts load and display data
5. Export data as CSV

**Expected Result**: Dashboard loads, displays metrics correctly

---

### ✅ Test 6: Video Generator (AI)
**Location**: Click "Video Generator" tab

**What to Test**:
1. Enter video description: *"Generate a 30-second fitness ad for men 40+, high energy"*
2. Select avatar: "DIFC Daniel"
3. Choose style: "Pattern Interrupt"
4. Set parameters (pacing, music, color grade)
5. Click "Generate"
6. Wait for AI to create video (~2-5 minutes)
7. Preview and download

**Expected Result**: AI generates 30-60 second video, downloads successfully

**Note**: Requires Gemini API key in .env.local

---

### ✅ Test 7: Assistant (AI Chat)
**Location**: Bottom-right corner - "Chat" icon

**What to Test**:
1. Ask: *"What's the best CTA for fitness ads?"*
2. Ask: *"How do I improve my video engagement?"*
3. Ask: *"Which avatar should I target?"*
4. Ask: *"Fix my audio quality issues"*

**Expected Result**: Chat responds with helpful suggestions

---

## 🔧 Backend Testing

### Test Backend API Locally

```bash
# In one terminal window, start the backend
cd functions
npm run serve

# In another terminal, test endpoints
curl http://localhost:5001/YOUR_PROJECT/us-central1/api/avatars
```

**Expected Response**:
```json
{
  "success": true,
  "avatars": [
    {
      "id": "dubai_men_40",
      "name": "DIFC Daniel",
      "pain_points": "...",
      "desires": "..."
    }
  ]
}
```

### Test Video Analysis Endpoint

```bash
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "avatarId": "dubai_men_40"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "analysis": {
    "scenes": [...],
    "emotions": [...],
    "recommendations": [...]
  }
}
```

---

## 🧪 Full Integration Test

### Test Complete Workflow

```bash
# 1. Start frontend dev server
npm run dev

# 2. In another terminal, start backend
cd functions && npm run serve

# 3. Test in browser at http://localhost:5173
```

**Workflow**:
```
1. Upload video → VideoEditor
   ↓
2. Extract audio → AudioSuite
   ↓
3. Create storyboard → StoryboardStudio
   ↓
4. Generate AI script → Assistant
   ↓
5. Create video → VideoGenerator
   ↓
6. Export & share → Done! 🎉
```

---

## ⚡ Deployment Testing

### Before Deploying to Production

```bash
# 1. Test build
npm run build

# Check dist/ folder was created with files
ls -la dist/

# 2. Test build locally
npm run preview
# Open http://localhost:4173

# 3. Deploy to Firebase Hosting (staging)
firebase deploy --only hosting

# 4. Verify at https://your-project.web.app
```

### Test Cloud Run Deployment

```bash
# 1. Build and push container
cd functions
docker build -t gcr.io/your-project/backend:latest .
docker push gcr.io/your-project/backend:latest

# 2. Deploy to Cloud Run
gcloud run deploy backend \
  --image gcr.io/your-project/backend:latest \
  --platform managed \
  --region us-central1

# 3. Test the endpoint
curl https://your-backend-url/health

# 4. Update frontend API_BASE_URL to point to it
# services/apiClient.ts → API_BASE_URL
```

---

## 🐛 Troubleshooting Tests

### Frontend Won't Start
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### TypeScript Errors
```bash
# Type check
npx tsc --noEmit

# Fix common errors
# 1. Update tsconfig.json
# 2. Install missing @types packages
npm install --save-dev @types/react @types/react-dom
```

### API Connection Failed
```bash
# Test backend is running
curl http://localhost:5001/YOUR_PROJECT/us-central1/api/health

# Test API URL in .env.local
echo $VITE_API_BASE_URL

# Check CORS settings in functions/src/index.ts
```

### Video Upload Too Slow
```bash
# Compress video first
ffmpeg -i input.mp4 -c:v libx265 -crf 23 output.mp4

# Or use smaller test video (< 50MB)
```

### Gemini API Errors
```bash
# Verify API key in .env.local
# Check API is enabled in Google Cloud Console
# Verify quota hasn't been exceeded
# Try with gemini-1.5-flash (cheaper/faster) first
```

---

## 📊 Performance Testing

### Check Frontend Performance

```bash
# 1. Build production version
npm run build

# 2. Analyze bundle size
npm install -g webpack-bundle-analyzer
# Then configure in vite.config.ts

# 3. Run Lighthouse audit
# In browser: DevTools → Lighthouse → Analyze page load
```

### Check Backend Performance

```bash
# Load test the API
npm install -g artillery

# Create test scenario (test.yml)
cat > test.yml << 'EOF'
config:
  target: "http://localhost:5001/YOUR_PROJECT/us-central1/api"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Test API"
    flow:
      - get:
          url: "/avatars"
EOF

# Run test
artillery run test.yml
```

---

## ✅ Final Verification Checklist

Before considering setup complete:

- [ ] `npm run dev` starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] All feature tabs visible and clickable
- [ ] Can upload files (video, audio, image)
- [ ] Video preview plays smoothly
- [ ] TypeScript has no errors (`npx tsc --noEmit`)
- [ ] Firebase config loads (check DevTools Console)
- [ ] Backend API responds at health endpoint
- [ ] Gemini API key configured in .env.local
- [ ] Can run `npm run build` successfully
- [ ] `firebase deploy` works (staging/preview)
- [ ] App loads on Firebase Hosting

---

## 🎯 Ready to Go!

Once all tests pass, you can:

1. **Customize** the system (see COMPLETE_SETUP_GUIDE.md)
2. **Add users** and connect to Firebase Auth
3. **Deploy to production** (firebase deploy)
4. **Monitor performance** (Cloud Run logs, Analytics)
5. **Scale up** (enable Vertex AI features, add more avatars)

**Questions?** Check `COMPLETE_SETUP_GUIDE.md` or refer to individual component README files.

---

## 📞 Support Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Vite Docs**: https://vitejs.dev/
- **Gemini API**: https://ai.google.dev/
- **Google Cloud**: https://cloud.google.com/docs
- **Vertex AI**: https://cloud.google.com/vertex-ai/docs

Happy building! 🚀
