# Service Account vs. OAuth: Which one do you need?

You asked about using a **Service Account** and if you can use keys from **another project**. Here is the definitive guide for your setup.

## 1. Can I use keys from another project?
**YES. This is the easiest way.**
If you have an existing Google Cloud Project (where you were building before) that already has "Vertex AI" or "Generative AI" enabled:
1.  **Do NOT** create a new project.
2.  Go to that **Existing Project** in Google Cloud Console.
3.  Copy the **API Key** and **OAuth Client ID** from there.
4.  Paste them into your `.env.local` file in this workspace.
5.  **Crucial:** In that existing project's "Credentials" settings, add `http://localhost:5173` to the **Authorized Origins**.

## 2. "What is my Service Account?" & "What changed?"
You might be confused because backend apps often use a "Service Account" (a file like `credentials.json`).

**What we changed:**
*   **Before:** The app was using "Mock Data" (fake video files). It didn't need any keys.
*   **Now:** We enabled **Real Google Drive Integration**.

**Why we are NOT using a Service Account:**
*   A Service Account is a "Robot" with its own empty Google Drive. It cannot see **YOUR** files unless you share them one by one.
*   To "Scan your Drive" (as you requested), we must use **OAuth Client ID**. This allows you to log in as *yourself* and let the app see *your* files instantly.

**So, you do not need a Service Account email or JSON file for this feature.** You just need the **Client ID** to let the app log you in.

## 3. Enabling Vertex AI & Vision
If you use the **API Key** from your main project, you automatically get access to the models enabled in that project.
*   **Gemini Pro** (which we use) handles "Vision" (understanding video/images). You don't need the separate legacy "Cloud Vision API".
*   **Vertex AI:** If you want to use specific Vertex features, ensure the **Vertex AI API** is enabled in your Google Cloud Console for the project where the API Key was created.

## Summary Checklist
1.  Open `.env.local`.
2.  Paste the `VITE_GOOGLE_API_KEY` and `VITE_GOOGLE_CLIENT_ID` from your **Main AI Project**.
3.  Go to Google Cloud Console > Credentials > OAuth Client.
4.  Add `http://localhost:5173` and your Firebase URL to **Authorized Origins**.
5.  Restart the app.
