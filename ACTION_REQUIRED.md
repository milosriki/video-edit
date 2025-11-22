# Action Required: Get Full Client ID

Great! I have configured the app with your **API Key** (`AIzaSyBbHpPCMl...`). This will enable the AI features (Gemini, Vision).

However, for the **Google Drive Integration** to work, I need the **Full OAuth Client ID**.

You provided: `208288753973-o6pd...`
This is cut off.

## How to get the full ID:
1.  Go to the **Google Cloud Console** > **Credentials**.
2.  Look for the row **"Web client 101"**.
3.  On the right side, click the **Copy icon** (or the Pencil icon to view details).
4.  The full ID will look something like this:
    `208288753973-o6pdm489...randomletters...apps.googleusercontent.com`

## Once you have it:
1.  Open the `.env.local` file in this workspace.
2.  Find the line: `VITE_GOOGLE_CLIENT_ID=208288753973-o6pd...`
3.  Replace it with the full string.
4.  Restart the app (`npm run dev`).

**Note on Service Account:**
You provided a Service Account (`video-production-service@...`). We do **not** need this for the frontend Drive scanner. The Client ID is the correct and fastest way to let you scan your own files.
