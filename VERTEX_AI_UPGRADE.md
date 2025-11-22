# 🚀 Moving to Google Cloud Vertex AI

You have successfully deployed your backend to **Google Cloud Run**. To continue upgrading and scaling your application using **Vertex AI**, follow these steps.

## 1. Access Your Project
Go to the Google Cloud Console for your project:
👉 **[Google Cloud Console: ptd-fitness-demo](https://console.cloud.google.com/welcome?project=ptd-fitness-demo)**

## 2. Key Services to Use

### 🧠 Vertex AI Studio (For Prompt Engineering)
Use this to test and improve your prompts ("Andromeda AI", "Creative Dominator") before updating your code.
1.  Search for **"Vertex AI"** in the search bar.
2.  Go to **Vertex AI Studio** > **Language**.
3.  Test your prompts with **Gemini 1.5 Pro** directly in the browser.

### 🏃 Cloud Run (Your Backend)
Your backend API is running here. You can increase memory, CPU, or concurrency here.
1.  Search for **"Cloud Run"**.
2.  Click on **`ptd-fitness-backend`**.
3.  Go to **Logs** to see real-time server logs.
4.  Go to **Revisions** to manage deployments.

### 🗄️ Firestore (Your Database)
View your analytics data and user inputs.
1.  Search for **"Firestore"**.
2.  Go to **Data** to browse your collections (`metrics`, `creatives`, etc.).

## 3. Upgrading to the Vertex AI SDK (Enterprise)
Currently, your app uses the `Google AI SDK` (API Key). To unlock enterprise features (higher quotas, private data, VPC security), you should switch to the **Vertex AI SDK**.

**Step 1: Install the SDK**
```bash
npm install @google-cloud/vertexai
```

**Step 2: Update `geminiService.ts`**
Instead of `GoogleGenAI` with an API Key, use `VertexAI` with your project ID:

```typescript
import { VertexAI } from '@google-cloud/vertexai';

const vertex_ai = new VertexAI({project: 'ptd-fitness-demo', location: 'us-central1'});
const model = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-1.5-pro-preview-0409'
});
```

## 4. Developing in the Cloud (Vertex AI Workbench)
If you want to code directly in the cloud (like Colab but more powerful):
1.  Go to **Vertex AI** > **Workbench**.
2.  Create a **User-Managed Notebook**.
3.  Clone your repo there:
    ```bash
    git clone https://github.com/milosriki/video-edit.git
    ```
