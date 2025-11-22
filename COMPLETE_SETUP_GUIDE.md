# Complete Setup, Usage & Fine-Tuning Guide

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [Full Setup Instructions](#full-setup-instructions)
3. [Pros & Cons](#pros--cons)
4. [Capabilities](#capabilities)
5. [How to Use the Web App](#how-to-use-the-web-app)
6. [Fine-Tuning & Advanced Configuration](#fine-tuning--advanced-configuration)
7. [Backend Addons & Extensions](#backend-addons--extensions)
8. [Troubleshooting](#troubleshooting)

---

## System Architecture

Your system is built on **three core components**:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                     │
│              Firebase Hosting (Static Site)                  │
│         • VideoEditor, AudioSuite, ImageSuite                │
│         • StoryboardStudio, PerformanceDashboard             │
│         • Real-time video processing UI                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         (HTTPS API Calls via services/apiClient.ts)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                BACKEND (Google Cloud Run)                    │
│           Node.js 22 Container (Express.js)                 │
│    Base URL: https://ptd-fitness-backend-489769736562...    │
│    • Gemini API integration (AI analysis)                    │
│    • Video processing via Google Cloud Vision                │
│    • Audio analysis with speech-to-text                      │
│    • Real-time processing & streaming responses              │
└────────────────────────┬────────────────────────────────────┘
                         │
      (Calls to Google APIs & Gemini)
                         │
┌────────────────────────▼────────────────────────────────────┐
│         VERTEX AI WORKBENCH (Manual Processing)              │
│              Jupyter Notebook Environment                    │
│    • Vertex_AI_Ad_Generator.ipynb                            │
│    • Advanced video analysis & AI reasoning                  │
│    • Custom model fine-tuning capabilities                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Full Setup Instructions

### Prerequisites
- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Firebase CLI** installed: `npm install -g firebase-tools`
- **Google Cloud Account** with billing enabled
- **Gemini API Key** (free tier available)
- **Service Account JSON** for Google Cloud (for backend deployment)

### Step 1: Local Development Setup

```bash
# 1. Clone/navigate to project
cd /Users/milosvukovic/Documents/video-edit

# 2. Install dependencies
npm install

# 3. Install backend dependencies
cd functions
npm install
cd ..

# 4. Create .env.local file (at root)
cat > .env.local << 'EOF'
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
EOF

# 5. Start dev server
npm run dev
# Frontend runs on http://localhost:5173
```

### Step 2: Backend Cloud Run Deployment

```bash
# 1. Build and push Docker image
cd functions
docker build -t gcr.io/your-project-id/ptd-backend:latest .
docker push gcr.io/your-project-id/ptd-backend:latest

# 2. Deploy to Cloud Run
gcloud run deploy ptd-backend \
  --image gcr.io/your-project-id/ptd-backend:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your_gemini_key

# 3. Update apiClient.ts with the returned URL
# services/apiClient.ts -> API_BASE_URL
```

### Step 3: Frontend Deployment

```bash
# 1. Build React app
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting

# 3. Your app is live at: https://your-project.web.app
```

### Step 4: Vertex AI Workbench Setup

```bash
# 1. Go to Google Cloud Console → Vertex AI → Workbench
# 2. Create a new user-managed notebook
#    - Name: ad-generator-workbench
#    - Machine type: n1-standard-4 (4 vCPU, 15GB RAM)
#    - Framework: Python 3.11 (with Jupyter)

# 3. Once running, click "Open Jupyter Lab"
# 4. Upload Vertex_AI_Ad_Generator.ipynb to the file browser
# 5. Create a video.mp4 file in the same directory
# 6. Run cells in order
```

---

## Pros & Cons

### ✅ Pros

| Feature | Benefit |
|---------|---------|
| **Cloud Run** | Auto-scaling, pay-per-use, handles traffic spikes |
| **Vertex AI** | Enterprise-grade ML infrastructure, low latency |
| **Gemini API** | State-of-the-art multimodal AI, video understanding |
| **React/Vite** | Fast UI, modern development, excellent DX |
| **Containerized** | Reproducible deployments, easy CI/CD integration |
| **No Server Management** | Google handles scaling, backups, security patches |
| **Real-time Processing** | Streaming responses from Gemini reduce latency |
| **Cost Efficient** | Pay only for what you use (Cloud Run model) |

### ⚠️ Cons

| Issue | Mitigation |
|-------|-----------|
| **Cold starts** on Cloud Run (2-5s) | Use minimum instances: `--min-instances=1` |
| **Gemini API costs** can scale | Implement request caching, rate limiting |
| **Vertex Workbench costs** when idle | Use auto-shutdown after 30 mins of inactivity |
| **Firebase has higher ops costs** | Stick to Cloud Run for backend instead |
| **Learning curve** for GCP/Vertex | Provided notebooks handle most complexity |
| **Regional latency** if user is far from us-central1 | Deploy to closer region (e.g., europe-west1) |

---

## Capabilities

### 🎥 Video Processing
- **Resolution Analysis**: Extract 4K, 1080p, 720p capabilities
- **Frame Rate Detection**: 24fps, 30fps, 60fps optimization
- **Duration Parsing**: Automatic length detection & segment creation
- **Codec Support**: H.264, H.265, VP9 video codecs
- **Audio Extraction**: Separate audio stream from video

### 🤖 AI Analysis (Gemini)
- **Scene Understanding**: Identify key moments, transitions, effects
- **Emotional Tone Detection**: Happy, sad, energetic, calm classification
- **Visual Composition**: Analyze lighting, framing, rule-of-thirds
- **Copy Generation**: AI-written headlines, CTAs, body copy
- **Strategic Recommendations**: Best ad format, avatar targeting

### 🎨 Creative Tools
- **Storyboard Generation**: Scene-by-scene breakdown with visuals
- **Audio Editing**: Cut, splice, apply effects, sync to video
- **Image Enhancements**: Contrast, saturation, color grading
- **Text Overlays**: Dynamic text positioning & animations
- **Template Library**: Pre-built ad structures (Pattern Interrupt, Us vs Them)

### 📊 Analytics Dashboard
- **Performance Metrics**: Views, engagement, conversion tracking
- **Avatar Performance**: Which avatars drive highest ROI
- **A/B Testing Framework**: Compare variations automatically
- **Historical Data**: Track trends over time

---

## How to Use the Software in the Web App

### 1. **Video Editor** (Main Dashboard)

**Location**: Click "Advanced Editor" or "Video Editor" tab

**Workflow**:
```
1. Upload Video → 2. Analyze → 3. Edit → 4. Export → 5. Deploy
```

**Step-by-Step**:
- **Upload**: Drag & drop or click upload button
- **Preview**: Watch in embedded player (left panel)
- **Timeline**: Scroll through frames (bottom panel)
- **Trim**: Click timestamps to set start/end points
- **Effects**: Add text, filters, transitions (right panel)
- **Export**: Choose resolution (480p, 720p, 1080p, 4K)
- **Deploy**: Send to YouTube, Instagram, TikTok

### 2. **Audio Suite** (Audio Processing)

**Location**: Click "Audio Suite" tab

**Capabilities**:
- **Waveform View**: Visual representation of audio levels
- **Cutting**: Remove silence, delete unwanted segments
- **Mixing**: Layer multiple audio tracks
- **Effects**:
  - Normalization (even out volume)
  - Compression (reduce dynamic range)
  - EQ (adjust bass, mids, treble)
  - Reverb (add space/dimension)
  - Fade in/out

**Quick Start**:
```
1. Click "Audio Suite"
2. Click "Upload Audio" or "Extract from Video"
3. Drag waveform edges to trim
4. Adjust sliders for effects
5. Download or "Apply to Video"
```

### 3. **Image Suite** (Image Editing)

**Location**: Click "Image Suite" tab

**Features**:
- **Crop & Resize**: Change dimensions for different platforms
- **Color Adjustments**: Brightness, contrast, saturation, hue
- **Filters**: Black & white, sepia, vintage, vibrant
- **Text Overlay**: Add watermarks or captions
- **Batch Processing**: Edit multiple images at once

### 4. **Storyboard Studio** (Visual Planning)

**Location**: Click "Storyboard Studio" tab

**Purpose**: Plan your video before editing

**How to Use**:
1. Upload video or import scenes
2. AI auto-generates scene breakdown
3. Edit captions for each scene
4. Set transition timing
5. Export as PDF or motion storyboard
6. Share with team for feedback

### 5. **Performance Dashboard** (Analytics)

**Location**: Click "Performance Dashboard" tab

**Metrics Displayed**:
- **Total Views**: Cumulative audience
- **Engagement Rate**: (Likes + Comments + Shares) / Views
- **Conversion Rate**: Clicks / Impressions
- **Audience Demographics**: Age, location, gender
- **Best Performing Avatar**: Which character resonates most
- **Optimal Post Time**: When audience is most active

**How to Use**:
```
1. Select date range (last 7 days, 30 days, custom)
2. Choose metric (Views, Engagement, Conversion)
3. Filter by Avatar (Dubai Men, Women 40+, etc.)
4. Export data as CSV for further analysis
5. Set up alerts for threshold breaches
```

### 6. **Video Generator** (AI-Powered Creation)

**Location**: Click "Video Generator" tab

**How It Works**:
1. **Input**: Describe your video concept
   - "Generate a 30-second fitness ad targeting UAE men 40+, high energy, with before/after transformation"
2. **Avatar Selection**: Choose target persona
3. **Style**: Pick template (Pattern Interrupt, Social Proof, etc.)
4. **AI Processing**: 
   - Gemini generates script & visual descriptions
   - Cloud Run renders video segments
   - Audio synthesis creates voiceover
5. **Output**: Download finished 30-60 second ad

**Fine-Tuning Options** (in Video Generator):
- **Pacing**: Fast (action-packed) vs. Slow (emotional)
- **Music Style**: Upbeat, dramatic, ambient, motivational
- **Color Grade**: Warm, cool, cinematic, vibrant
- **Text Style**: Bold sans-serif, elegant serif, modern futuristic

### 7. **Assistant** (AI Chat)

**Location**: Click "Assistant" tab (bottom right)

**Features**:
- **Context-Aware Help**: Suggests edits based on current project
- **Copy Suggestions**: Generate multiple headline variations
- **Technical Support**: Troubleshoots issues
- **Best Practices**: Explains why certain edits work better

**Example Queries**:
```
"What's the best CTA for fitness ads in UAE?"
→ Assistant: "For your avatar (men 40+), use action verbs: 
   'Reclaim Your Strength' or 'Beat Time to the Gym'"

"Why isn't my video getting engagement?"
→ Assistant analyzes metrics and suggests: "Your audio 
   is 3dB too quiet. Try normalizing it and re-upload."
```

---

## Fine-Tuning & Advanced Configuration

### 1. **Backend Configuration** (functions/src/index.ts)

**Modify API Behavior**:

```typescript
// functions/src/index.ts

// ✏️ Change timeout for video analysis
const ANALYSIS_TIMEOUT = 120000; // 2 minutes (default: 60000)

// ✏️ Adjust Gemini model (more powerful = more expensive)
const MODEL = "gemini-1.5-pro"; // Options: gemini-1.5-flash, gemini-2.0-flash

// ✏️ Set max video file size
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB (default: 100MB)

// ✏️ Enable/disable features
const FEATURES = {
  videoAnalysis: true,
  audioExtraction: true,
  imageEnhancement: true,
  realTimeStreaming: true,
  caching: true
};

// ✏️ Rate limiting
const RATE_LIMIT = {
  requests_per_minute: 60,
  requests_per_hour: 1000,
  daily_tokens: 1000000
};
```

### 2. **Frontend Configuration** (services/apiClient.ts)

**Change API Endpoints**:

```typescript
// services/apiClient.ts

// ✏️ Switch between backend environments
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ptd-fitness-backend-489769736562.us-central1.run.app'
  : 'http://localhost:3000';

// ✏️ Adjust request timeout
const REQUEST_TIMEOUT = 90000; // 90 seconds

// ✏️ Enable request caching to reduce API calls
const ENABLE_CACHE = true;
const CACHE_TTL = 3600; // 1 hour

// ✏️ Retry configuration for failed requests
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000 // ms
};
```

### 3. **Vertex AI Notebook Customization**

**In Vertex_AI_Ad_Generator.ipynb**:

```python
# Change Avatar Targeting
SELECTED_AVATAR_KEY = "dubai_women_40"  # Options: dubai_men_40, abu_dhabi_women_50

# Adjust Product/Offer
PRODUCT_NAME = "Your Custom Program Name"
OFFER = "Custom Offer (e.g., 50% off, Free Trial)"

# Modify Neuro Hooks (what captures attention)
NEURO_HOOKS = [
    "Eye Contact: Subject looks directly at camera",
    "Urgency Text: Red color flashing 'LIMITED TIME'",
    "Social Proof: '10,000+ transformations'",
    # Add your own hooks
]

# Change Analysis Model (speed vs. quality)
MODEL = "gemini-1.5-pro"  # More accurate but slower
# MODEL = "gemini-1.5-flash"  # Faster but less detailed

# Adjust output formats
OUTPUT_FORMATS = {
    "video": True,
    "storyboard": True,
    "copy": True,
    "social_media": True
}
```

### 4. **Video Editor Fine-Tuning**

**Component File**: `components/VideoEditor.tsx`

**Customizable Settings**:

```typescript
// components/VideoEditor.tsx

const VIDEO_SETTINGS = {
  // Quality settings
  maxResolution: "4K",
  defaultResolution: "1080p",
  
  // Performance
  previewQuality: "480p", // Lower = faster preview
  enableHardwareAcceleration: true,
  
  // Effects
  availableFilters: ["grayscale", "sepia", "vibrant", "cinematic"],
  enableTransitions: true,
  
  // Export
  defaultFormat: "mp4",
  supportedFormats: ["mp4", "webm", "mov"],
  
  // Timeline
  snapToGridSize: 250, // milliseconds
  autoSave: true,
  autoSaveInterval: 30000 // 30 seconds
};
```

### 5. **Gemini API Fine-Tuning**

**Prompt Customization** (in functions/src/geminiService.ts):

```typescript
// functions/src/geminiService.ts

const SYSTEM_PROMPT = `
You are an elite video strategy analyst specializing in fitness & wellness ads for UAE market.

CONSTRAINTS:
- Cultural sensitivity: Respect Islamic values, family-oriented messaging
- Language: Use Arabic terms naturally (e.g., "Alhamdulillah")
- Avoid: Alcohol references, women's specific body criticism
- Emphasize: Status, family, health, spirituality

TONE GUIDELINES:
- Confident but not arrogant
- Aspirational but achievable
- Respectful of traditions
- Forward-thinking

ANALYSIS FRAMEWORK:
1. Emotional hooks (What makes viewer feel?)
2. Logical reasons (Why should they act?)
3. Social proof (Who else succeeded?)
4. Call-to-action (What's next?)
`;

const TEMPERATURE = 0.7; // 0.1 = deterministic, 1.0 = creative
const MAX_TOKENS = 2000;
const TOP_P = 0.95; // Diversity of responses
```

---

## Backend Addons & Extensions

### 1. **Add a New Analytics Endpoint**

**File**: `functions/src/index.ts`

```typescript
// Add this endpoint to get user analytics
app.get('/api/analytics/:userId', async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;
  
  try {
    // Query your database
    const analytics = await db.collection('analytics')
      .where('userId', '==', userId)
      .where('date', '>=', new Date(startDate))
      .where('date', '<=', new Date(endDate))
      .get();
    
    const data = analytics.docs.map(doc => doc.data());
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. **Add Real-Time Streaming Response**

**File**: `functions/src/index.ts`

```typescript
// Streaming endpoint for live analysis
app.post('/api/analyze-stream', async (req, res) => {
  const { videoUrl } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    const stream = await gemini.generateContentStream({
      contents: [{
        role: 'user',
        parts: [{ text: `Analyze this video: ${videoUrl}` }]
      }]
    });
    
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});
```

### 3. **Add Webhook for External Services**

**File**: `functions/src/index.ts`

```typescript
// Webhook to send completed videos to external services
app.post('/api/webhooks/video-complete', async (req, res) => {
  const { videoId, status, output } = req.body;
  
  try {
    // Send to Slack
    await fetch('https://hooks.slack.com/services/YOUR_WEBHOOK_URL', {
      method: 'POST',
      body: JSON.stringify({
        text: `✅ Video ${videoId} completed: ${status}`,
        attachments: [{
          image_url: output.thumbnail,
          title_link: output.url
        }]
      })
    });
    
    // Send to external webhook (e.g., Zapier, Make.com)
    await fetch(process.env.EXTERNAL_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ videoId, status, output })
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. **Add Caching Layer (Redis)**

**File**: `functions/src/services/cacheService.ts`

```typescript
import redis from 'redis';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: 6379
});

export const getCachedAnalysis = async (videoHash: string) => {
  const cached = await redisClient.get(`analysis:${videoHash}`);
  return cached ? JSON.parse(cached) : null;
};

export const cacheAnalysis = async (videoHash: string, data: any, ttl = 3600) => {
  await redisClient.setex(`analysis:${videoHash}`, ttl, JSON.stringify(data));
};
```

### 5. **Add Email Notifications**

**File**: `functions/src/index.ts`

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

app.post('/api/send-notification', async (req, res) => {
  const { userEmail, videoTitle, downloadUrl } = req.body;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Your video "${videoTitle}" is ready! 🎉`,
      html: `
        <h2>Your video is complete</h2>
        <p>Download it here: <a href="${downloadUrl}">Download Video</a></p>
        <p>Valid for 7 days.</p>
      `
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Troubleshooting

### Issue: "Cold Start Delay" on Cloud Run

**Problem**: First request takes 5-10 seconds

**Solutions**:
```bash
# 1. Set minimum instances to keep container warm
gcloud run services update ptd-backend \
  --min-instances=1 \
  --region us-central1

# 2. Or add a scheduled warmer job
# Create functions/warmer.ts
export const keepWarm = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    await fetch('https://ptd-backend-....run.app/health');
  });
```

### Issue: "Gemini API Quota Exceeded"

**Problem**: Rate limit error from Gemini API

**Solutions**:
```typescript
// 1. Implement caching (prevent duplicate requests)
// 2. Use gemini-1.5-flash (cheaper) instead of gemini-1.5-pro
// 3. Batch requests together
// 4. Increase quota in Google Cloud Console → APIs & Services → Quotas
```

### Issue: "Video Upload Fails"

**Problem**: File size too large or timeout

**Solutions**:
```bash
# 1. Increase Cloud Run timeout
gcloud run services update ptd-backend \
  --timeout=3600 \
  --region us-central1

# 2. Compress video before upload
ffmpeg -i input.mp4 -c:v libx265 -crf 23 output.mp4

# 3. Use chunked upload (for files >100MB)
# In frontend: services/apiClient.ts
const uploadLargeFile = async (file) => {
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks
  for (let i = 0; i < file.size; i += chunkSize) {
    const chunk = file.slice(i, i + chunkSize);
    await uploadChunk(chunk, i / chunkSize);
  }
};
```

### Issue: "Vertex Workbench Notebook Error"

**Problem**: Cell execution fails

**Solutions**:
```python
# 1. Reinstall dependencies
!pip install --upgrade google-generativeai

# 2. Check API key is valid
import google.generativeai as genai
genai.configure(api_key="YOUR_KEY")
print(genai.__version__)

# 3. Restart kernel (Kernel → Restart in Jupyter)
```

### Issue: "Frontend Can't Connect to Backend"

**Problem**: CORS error or blank screen

**Solutions**:
```typescript
// 1. Check API_BASE_URL is correct
// services/apiClient.ts
console.log('API_BASE_URL:', process.env.VITE_API_BASE_URL);

// 2. Ensure backend is running
// curl https://your-backend-url/health

// 3. Update CORS in backend
// functions/src/index.ts
app.use(cors({
  origin: ['https://your-app.web.app', 'http://localhost:5173'],
  credentials: true
}));
```

---

## Next Steps

1. **Deploy Full Stack**: Follow the setup instructions above
2. **Test Each Module**: Try VideoEditor, AudioSuite, StoryboardStudio
3. **Fine-Tune for Your Market**: Customize avatars, offers, neuro-hooks
4. **Set Up Analytics**: Connect to Firebase Analytics or Google Analytics
5. **Add Addons**: Integrate webhooks, email notifications, external services
6. **Monitor Performance**: Use Cloud Run logs & Vertex AI metrics

**Questions?** Check the Assistant in the web app or refer to Google Cloud documentation.
