# Google Credential Guide

We are currently stuck between two different integration methods. Here is how to fix it.

## Option A: "I want to scan MY personal Google Drive" (Recommended)
This allows the app to log in as YOU and see your files.
**Required Credential:** OAuth 2.0 Client ID.

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
2. Look under **OAuth 2.0 Client IDs**.
3. Find the entry (likely named "Web client 1" or similar).
4. Copy the **Client ID**.
   - It looks like: `208288753973-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Current Status:** We only have the first part (`208288753973-o6pd...`). We need the full string.

## Option B: "I want a Robot to scan a specific shared folder"
This uses a Service Account. The robot cannot see your files unless you share them with `video-production-service@gen-lang-client-0427673522.iam.gserviceaccount.com`.
**Required Credential:** Service Account JSON Key.

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts).
2. Click on `video-production-service@...`.
3. Go to the **Keys** tab.
4. Click **Add Key** > **Create new key**.
5. Select **JSON** (Not HMAC).
6. This will download a `.json` file to your computer.
7. Paste the contents of that file here.

### ❌ What was provided
You provided an **HMAC Key** (`0e6effdc...`).
- This is for **Cloud Storage** (S3 compatibility).
- It **cannot** be used to access Google Drive.
