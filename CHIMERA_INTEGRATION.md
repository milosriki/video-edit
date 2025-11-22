# How to Connect "Project Chimera" (Fastest Setup)

You want to use the powerful AI/NLP/RAG capabilities from your **Chimera** project while keeping the logs in **PTD Fitness Demo**. Here is the fastest way to do it.

## 1. Can I use Service Account keys from Chimera?
**For Google Drive Scanning:** **NO.**
*   **Why:** A Service Account is "blind" to your personal Drive folders. It would require you to share every folder with the bot's email.
*   **Better Way:** Use the **OAuth Client ID** from Chimera. This lets you log in as *yourself* and instantly scan *your* files.

**For AI / NLP / RAG:** **YES.**
*   You can use the **API Key** from Chimera to power the "Brain" of this app.

## 2. The "Hybrid" Setup (Best of Both Worlds)

You will use **Chimera's Brain** (AI) inside the **PTD Fitness** app.

### Step 1: Get Keys from Project Chimera
Go to the Google Cloud Console for **Project Chimera**:
1.  **API Key:** Copy the API Key. (This enables Gemini, Vision, NLP).
2.  **OAuth Client ID:** Copy the Client ID. (This enables Drive access).
    *   *Important:* Add `https://ptd-fitness-demo.web.app` to the **Authorized Origins** in Chimera's Client ID settings.

### Step 2: Update Your Environment
Update the `.env.local` file in this workspace:

```env
# Use Chimera's Client ID to scan YOUR Drive
VITE_GOOGLE_CLIENT_ID=your_chimera_client_id

# Use Chimera's API Key for the AI/NLP power
VITE_GOOGLE_API_KEY=your_chimera_api_key
VITE_GEMINI_API_KEY=your_chimera_api_key
```

### Step 3: Update the Backend (Cloud Functions)
Since the heavy AI processing happens in the cloud, you need to update the secret there too.

1.  Run this command in your terminal to set the secret for the backend:
    ```bash
    firebase functions:secrets:set GEMINI_API_KEY
    ```
2.  Paste your **Chimera API Key** when prompted.
3.  Redeploy the functions:
    ```bash
    firebase deploy --only functions
    ```

## Summary
*   **Drive Scanning:** Uses Chimera's Client ID (Log in as you).
*   **AI Analysis:** Uses Chimera's API Key (Access to Vertex/NLP).
*   **Logs:** Will still appear in PTD Fitness Demo (because that's where the app is hosted).

This gives you the **speed and power of Chimera** without needing to migrate the hosting.
