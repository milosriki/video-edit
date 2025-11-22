#!/bin/bash
# One-Line Commands to Get Started
# Copy and paste each command individually into your terminal

# ============================================================================
# 🚀 QUICK START - PICK ONE
# ============================================================================

# OPTION 1: Automated Setup (Recommended - 2-3 min)
./setup_and_test.sh

# OPTION 2: Quick Manual Setup (1-2 min)
npm install && cd functions && npm install && cd .. && npm run dev

# ============================================================================
# 💻 DEVELOPMENT - Run These After Setup
# ============================================================================

# Start development server (opens http://localhost:5173)
npm run dev

# Run tests to verify everything works
node tests/run_tests.js

# Build for production
npm run build

# Preview production build locally (http://localhost:4173)
npm run preview

# ============================================================================
# 🐛 DEBUGGING - For When Things Don't Work
# ============================================================================

# Check if port 5173 is in use
lsof -i :5173

# Clear cache and reinstall (if you have issues)
rm -rf node_modules package-lock.json && npm install

# Check TypeScript for errors
npx tsc --noEmit

# ============================================================================
# 🚀 DEPLOYMENT - Firebase Hosting
# ============================================================================

# Login to Firebase
firebase login

# Deploy everything to Firebase
firebase deploy

# Deploy only frontend to Firebase
firebase deploy --only hosting

# Deploy only backend functions
firebase deploy --only functions

# View deployment logs
firebase functions:log

# ============================================================================
# 🐳 DEPLOYMENT - Google Cloud Run (Backend)
# ============================================================================

# Set your project ID
export PROJECT_ID=your-project-id

# Build Docker image
cd functions && docker build -t gcr.io/$PROJECT_ID/backend:latest . && cd ..

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/backend:latest

# Deploy to Cloud Run
gcloud run deploy backend \
  --image gcr.io/$PROJECT_ID/backend:latest \
  --region us-central1 \
  --platform managed \
  --set-env-vars GEMINI_API_KEY=your_key_here

# Test the deployed backend
curl https://your-backend-xxxxx.run.app/health

# View Cloud Run logs
gcloud run services logs read backend --region us-central1 --limit 50

# ============================================================================
# 🧠 VERTEX AI - Notebook Processing
# ============================================================================

# Open Google Cloud Console and go to:
# Vertex AI → Workbench → Create New Notebook
# Config: n1-standard-4 machine, Python 3.11 with Jupyter

# Then upload Vertex_AI_Ad_Generator.ipynb and run cells

# ============================================================================
# 📊 MONITORING & LOGS
# ============================================================================

# View Firebase logs
firebase functions:log

# View Cloud Run metrics
gcloud run services describe backend --region us-central1

# View all Cloud Run revisions
gcloud run services list

# ============================================================================
# 🧹 CLEANUP - Remove Things
# ============================================================================

# Remove Docker image
docker rmi gcr.io/$PROJECT_ID/backend:latest

# Clear Firebase cache
rm -rf .firebase/

# Clear build folder
rm -rf dist/

# Delete all node_modules (and reinstall after)
rm -rf node_modules

# ============================================================================
# 🔐 CONFIGURATION - Environment Variables
# ============================================================================

# Create .env.local file with your API keys
cat > .env.local << 'EOF'
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
VITE_API_BASE_URL=http://localhost:3000
EOF

# Show current environment variables
cat .env.local

# ============================================================================
# 🔗 GIT COMMANDS
# ============================================================================

# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to main branch
git push origin main

# ============================================================================
# 🧪 COMPLETE TEST WORKFLOW
# ============================================================================

# Run everything in sequence
npm install && \
cd functions && npm install && cd .. && \
node tests/run_tests.js && \
npm run build && \
echo "✅ All checks passed!"

# ============================================================================
# 📞 QUICK LINKS
# ============================================================================

# Firebase Console
# https://console.firebase.google.com

# Google Cloud Console
# https://console.cloud.google.com

# Vertex AI Console
# https://console.cloud.google.com/vertex-ai

# Gemini API Docs
# https://ai.google.dev

# ============================================================================
# 🎯 NEXT STEPS CHECKLIST
# ============================================================================

# After running setup:
# [ ] Run: npm run dev
# [ ] Open: http://localhost:5173
# [ ] Test Video Editor feature
# [ ] Test Audio Suite feature
# [ ] Test Image Suite feature
# [ ] Test Storyboard Studio
# [ ] Test Performance Dashboard
# [ ] Test Video Generator (AI)
# [ ] Test Assistant (Chat)
# [ ] Run: npm run build
# [ ] Deploy: firebase deploy
# [ ] Verify: https://your-project.web.app

# ============================================================================
# 💡 COMMON ISSUES & FIXES
# ============================================================================

# Issue: "Port 5173 already in use"
# Fix: lsof -i :5173 && kill -9 <PID>

# Issue: "VITE_API_BASE_URL is undefined"
# Fix: Create .env.local file (see CONFIGURATION section above)

# Issue: "Firebase auth fails"
# Fix: firebase login --reauth

# Issue: "Gemini API rate limit"
# Fix: Wait 60 seconds or upgrade your quota

# Issue: "TypeScript errors in build"
# Fix: npx tsc --noEmit && check errors

# Issue: "Backend doesn't respond"
# Fix: Check Cloud Run is running: gcloud run services list

# ============================================================================
# 📚 DOCUMENTATION FILES
# ============================================================================

# Main setup guide (read this first!)
# START_HERE.md

# Quick testing guide with feature checklist
# QUICK_START_TESTING.md

# Comprehensive setup and fine-tuning
# COMPLETE_SETUP_GUIDE.md

# All ready-to-use commands
# READY_COMMANDS.md

# Deployment guide
# DEPLOYMENT.md

# ============================================================================
# 🎉 YOU'RE READY TO START!
# ============================================================================

# Last Updated: November 22, 2025
# Status: ✅ Production Ready

# Run this to get started:
# ./setup_and_test.sh

# Or manually:
# npm run dev

# Then open: http://localhost:5173

# Happy coding! 🚀
