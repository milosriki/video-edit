# 🚀 Vercel Deployment Guide

This project is configured for deployment on **Vercel**, supporting both the React Frontend and the Python FastAPI Backend.

## 📋 Prerequisites

1.  **Vercel Account**: [Sign up here](https://vercel.com/signup).
2.  **Vercel CLI** (Optional but recommended): `npm i -g vercel`

## ⚙️ Configuration

The project uses `vercel.json` to configure routing:
- Frontend routes (SPA) -> `index.html`
- Backend routes (`/api/*`) -> `api/index.py`

## 🚀 How to Deploy

### Option 1: Vercel CLI (Fastest)

1.  **Login**:
    ```bash
    vercel login
    ```

2.  **Deploy**:
    Run this command in the project root:
    ```bash
    vercel
    ```
    - Set up and deploy? **Yes**
    - Which scope? **(Select your account)**
    - Link to existing project? **No**
    - Project name? **video-edit** (or your choice)
    - In which directory is your code located? **./** (default)
    - Want to modify these settings? **No**

3.  **Environment Variables**:
    Go to the Vercel Dashboard for your project > **Settings** > **Environment Variables**.
    Add the following:
    - `GOOGLE_CLOUD_PROJECT`: Your Google Cloud Project ID
    - `GOOGLE_API_KEY`: Your Gemini API Key
    - `VITE_API_BASE_URL`: Set this to `/api` (so frontend calls the backend on the same domain)

4.  **Production Deploy**:
    ```bash
    vercel --prod
    ```

### Option 2: Git Integration

1.  Push your code to GitHub/GitLab/Bitbucket.
2.  Import the project in Vercel Dashboard.
3.  Vercel will detect Vite and Python.
4.  Add the Environment Variables (as above).
5.  Deploy.

## 🔧 Backend Details

- The Python backend entry point is `api/index.py`.
- It imports the FastAPI app from `backend_core/main.py`.
- Dependencies are listed in `requirements.txt` in the root.

## ⚠️ Important Notes

- **Cold Starts**: Serverless functions may have a slight delay on the first request.
- **Timeouts**: Vercel functions have a timeout (usually 10s on free tier). Long-running video generation might need a different strategy (like background jobs or Cloud Run) if it exceeds this limit.
- **Python Version**: Vercel supports Python 3.9, 3.10, 3.11, 3.12. It should pick up the version automatically or you can specify it in `runtime.txt` (optional).

## 🧪 Testing Locally with Vercel

You can simulate the Vercel environment locally:

```bash
vercel dev
```
This will start a local server (usually port 3000) that handles both frontend and backend routing exactly like production.
