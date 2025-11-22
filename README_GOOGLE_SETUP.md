# Google Drive Integration Setup Guide

To enable the "Direct Integration" with Google Drive, you need to configure your Google Cloud Project and add the API keys to your local environment.

## Step 1: Google Cloud Console Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (or create a new one).
3.  **Enable APIs:**
    *   Go to **APIs & Services > Library**.
    *   Search for **"Google Drive API"** and enable it.
4.  **Configure OAuth Consent Screen:**
    *   Go to **APIs & Services > OAuth consent screen**.
    *   Select **External** (or Internal if you have a Workspace organization).
    *   Fill in the required fields (App name, User support email).
    *   Add the scope: `.../auth/drive.readonly`.
    *   Add your email as a **Test User**.
5.  **Create Credentials:**
    *   Go to **APIs & Services > Credentials**.
    *   **Create API Key:**
        *   Click **Create Credentials > API Key**.
        *   Copy this key. This is your `VITE_GOOGLE_API_KEY`.
    *   **Create OAuth Client ID:**
        *   Click **Create Credentials > OAuth client ID**.
        *   Application type: **Web application**.
        *   **Authorized JavaScript origins:**
            *   `http://localhost:5173` (for local development)
            *   `https://ptd-fitness-demo.web.app` (your production URL)
        *   **Authorized redirect URIs:**
            *   `http://localhost:5173`
            *   `https://ptd-fitness-demo.web.app`
        *   Copy the **Client ID**. This is your `VITE_GOOGLE_CLIENT_ID`.

## Step 2: Update Environment Variables

1.  Open the `.env.local` file in your project root.
2.  Add the following lines (replace with your actual keys):

```env
VITE_GOOGLE_API_KEY=your_api_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

## Step 3: Restart Development Server

Stop and restart your development server to load the new environment variables:

```bash
npm run dev
```

## Usage

1.  Open the **Ad Workflow** in the app.
2.  Click **"Connect Google Drive"**.
3.  Sign in with your Google Account.
4.  Select your video files or use **"Smart Scan"**.
