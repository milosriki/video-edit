# AI Video Ad Generator - Team Quick Start Guide

## 🚀 Access the App

**Production URL:** https://ptd-fitness-demo.web.app

Just open this link in your browser - no installation needed!

---

## 📱 How to Use

### 1. **Ad Workflow (Main Tool)**
Create AI-powered video ads from existing content:

1. Click **"Ad Workflow"** in the sidebar
2. Upload your video files or paste video URLs
3. AI analyzes your videos and generates strategy
4. Review 10 AI-generated ad blueprints
5. Get top 3 ranked by predicted ROI
6. Download scripts and edit videos

### 2. **Storyboard Studio**
Generate visual storyboards from text:

1. Click **"Storyboard Studio"**
2. Enter your ad concept
3. AI generates scene-by-scene storyboard with images
4. Download and share with your team

### 3. **Video Studio**
Generate and analyze videos:

1. Upload videos for AI analysis
2. Get insights on hooks, messaging, and engagement
3. Generate new video concepts

### 4. **Image Studio**
Create and edit images for ads:

1. Generate images from prompts
2. Edit existing images
3. Analyze image effectiveness

### 5. **Audio Studio**
Create voiceovers and transcribe:

1. Generate AI voiceovers from text
2. Transcribe audio files
3. Edit and export audio

### 6. **AI Assistant**
Chat with AI strategist for:

- Ad strategy advice
- Creative ideas
- Performance optimization tips

---

## 🎯 Features

✅ **Batch Video Processing** - Analyze multiple videos at once
✅ **AI-Powered Analysis** - Gemini AI analyzes content and generates strategies
✅ **Customer Avatars** - Pre-loaded Dubai/Abu Dhabi customer profiles
✅ **ROI Ranking** - AI ranks ad concepts by predicted performance
✅ **Real-time Processing** - FFmpeg.wasm for client-side video editing
✅ **Cloud Storage** - All projects saved to Firebase
✅ **Performance Dashboard** - Track ad performance metrics

---

## 💾 Data & Storage

- **Projects:** Automatically saved to Firestore
- **Videos:** Stored in Firebase Storage
- **Analytics:** Performance data tracked in real-time

---

## 🛠️ For Developers/Admins

### Local Development
```bash
# Clone and install
git clone https://github.com/milosriki/video-edit.git
cd video-edit
npm install

# Start dev server
npm run dev
```

### Deploy Updates
```bash
npm run build
firebase deploy
```

### Environment Variables
All config is in `.env.local`:
- Firebase credentials
- API keys
- Service endpoints

---

## 🔐 Access & Permissions

**Current Setup:**
- Public access (no login required)
- All team members can use immediately

**To Add Authentication:**
1. Enable Firebase Authentication
2. Set up Google/Email sign-in
3. Add user management

---

## 📞 Support

**Issues or Questions:**
- Check browser console for errors
- Contact: milosriki
- Firebase Console: https://console.firebase.google.com/project/ptd-fitness-demo

---

## 🎬 Workflow Example

**Creating a Video Ad Campaign:**

1. **Upload Videos** → Upload 3-5 existing video ads
2. **AI Analysis** → System analyzes hooks, messaging, CTA
3. **Select Avatar** → Choose target customer (e.g., "Dubai Men 40")
4. **Generate Creatives** → AI creates 10 ad blueprints
5. **Review Rankings** → Get top 3 ranked by ROI potential
6. **Edit & Export** → Use Video Editor to create final ads
7. **Track Performance** → Monitor results in Performance Dashboard

---

## 📊 Current Integrations

✅ **Gemini AI** - Video analysis & content generation
✅ **Firebase** - Hosting, storage, database
✅ **FFmpeg.wasm** - Video processing
✅ **Tailwind CSS** - UI framework

🔄 **Coming Soon:**
- Google Drive integration for video uploads
- Team collaboration features
- Advanced analytics dashboard

---

**Ready to create amazing ads!** 🎥✨
