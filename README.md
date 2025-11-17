<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PTD Fitness Demo - AI Video Ad Generator

This is an AI-powered video advertising platform for PTD Fitness, deployed on Firebase.

View your app in AI Studio: https://ai.studio/apps/drive/1Nm2qVbh_UivmW6yOFPYo6X9k0CEChDV9

## Architecture

- **Frontend**: React + TypeScript + Vite (deployed to Firebase Hosting)
- **Backend**: Firebase Cloud Functions (Node.js + Express + Firestore)
- **AI**: Google Gemini API for video analysis and creative generation
- **Database**: Firestore (replacing better-sqlite3)

## Run Locally

**Prerequisites:**  Node.js, Firebase CLI (optional)

### Frontend Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```bash
   npm run dev
   ```

### Backend Development

1. Navigate to functions directory:
   ```bash
   cd functions
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build:
   ```bash
   npm run build
   ```

## Deploy to Firebase

**Prerequisites:** Firebase CLI installed (`npm install -g firebase-tools`)

1. Login to Firebase:
   ```bash
   firebase login
   ```

2. Deploy hosting and functions:
   ```bash
   firebase deploy
   ```

   Or deploy separately:
   ```bash
   firebase deploy --only hosting
   firebase deploy --only functions
   ```

3. Set environment variables for Cloud Functions:
   ```bash
   firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
   ```

## Project Structure

```
.
├── components/          # React components
├── services/           # Frontend services
├── utils/              # Utility functions
├── functions/          # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts           # Functions entry point
│   │   ├── services/          # Backend services (Gemini AI)
│   │   └── ai/knowledge/      # AI knowledge base
│   └── package.json
├── firebase.json       # Firebase configuration
├── .firebaserc        # Firebase project settings
└── package.json       # Frontend dependencies
```

## Features

- AI-powered video content analysis
- Customer avatar targeting
- Ad creative generation and ranking
- Performance dashboard with real-time metrics
- Video editing and storyboard studio

## Migration Notes

This project has been migrated from a local Express server with better-sqlite3 to Firebase Functions with Firestore. The old `/server` folder has been replaced by the `/functions` folder.

See [functions/README.md](functions/README.md) for more details on the backend architecture.
