<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PTD Elite Dashboard

AI-powered video ad analysis, prediction, and generation platform. Built with React + TypeScript frontend and Python FastAPI backend with an 11-engine AI ensemble for ad performance prediction.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Google Cloud account (for Gemini API)
- Supabase account (for database)

### Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (Titan Engine)
uvicorn backend_core.main:app --reload --port 8080
```

## 📁 Project Structure

```
├── App.tsx                 # Main React app with home dashboard
├── components/             # React UI components
│   ├── AdWorkflow.tsx      # Video analysis workflow
│   ├── AnalysisHistory.tsx # Past analyses view
│   ├── CreatorDashboard.tsx # AI tools dashboard
│   └── PerformanceDashboard.tsx # Metrics view
├── services/               # Frontend API clients
├── backend_core/           # Python FastAPI backend
│   ├── main.py             # API endpoints
│   ├── engines/            # 11 AI prediction engines
│   │   ├── ensemble.py     # Ensemble predictor
│   │   └── deep_ctr.py     # DeepCTR model
│   ├── services/           # Backend services
│   ├── scripts/            # Data extraction scripts
│   ├── training/           # Model training scripts
│   └── models/             # Trained model files
└── api/                    # Vercel serverless entry point
```

## 🧠 AI Engine Architecture

The platform uses an 11-engine ensemble for ad performance prediction:

1. **DeepCTR** - Click-through rate prediction (trainable)
2. **Claude** - Anthropic's Claude for creative analysis
3. **GPT** - OpenAI's GPT for copywriting evaluation
4. **LLaMA** - Meta's LLaMA for alternative perspectives
5. **VideoAgent** - Video structure analysis
6. **VertexVision** - Google Cloud Vision for visual elements
7. **GoogleAds** - Historical performance patterns
8. **GA4** - Analytics-based predictions
9. **FitnessForm** - Domain-specific (fitness) optimization
10. **Transformation** - Before/after content analysis
11. **ROAS** - Return on ad spend modeling

## 🏋️ Training DeepCTR on Your Data

To train the prediction model on your historical ad data:

```bash
# 1. Extract historical data
python -m backend_core.scripts.extract_historical_data

# 2. Engineer features
python -m backend_core.training.feature_engineering

# 3. Train the model
python -m backend_core.training.train_deepctr
```

The trained model will be saved to `backend_core/models/deepfm_v2_trained.json`.

## 🌐 Deployment

### Vercel (Frontend + Serverless Backend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GOOGLE_CLOUD_PROJECT`
3. Deploy!

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

### Railway (Python Backend)

For heavy processing, deploy the FastAPI backend to Railway:

1. Connect your repository to Railway
2. Set the root directory to `/`
3. Configure environment variables
4. Set start command: `uvicorn backend_core.main:app --host 0.0.0.0 --port $PORT`

## 🔧 Environment Variables

See `.env.example` for all required environment variables.

### Frontend (VITE_)
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_API_BASE_URL` - Backend API URL (default: `/api`)

### Backend
- `GOOGLE_CLOUD_PROJECT` - Google Cloud project ID
- `GOOGLE_API_KEY` - Gemini API key (server-side)
- `ANTHROPIC_API_KEY` - Claude API key (optional)
- `OPENAI_API_KEY` - OpenAI API key (optional)

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and service status |
| `/` | GET | API information |
| `/analyze` | POST | Analyze video for winning patterns |
| `/predict` | POST | Get virality prediction from ensemble |
| `/generate` | POST | Generate new ad variations |
| `/metrics` | GET | Get performance metrics |
| `/avatars` | GET | Get target audience avatars |

## 🧪 Testing

```bash
# Run frontend build
npm run build

# Run backend tests (if available)
cd backend_core && python -m pytest
```

## Features

- AI-powered video content analysis
- Customer avatar targeting
- Ad creative generation and ranking
- Performance dashboard with real-time metrics
- Video editing and storyboard studio
- Analysis history with predicted vs actual ROAS tracking
- Trainable DeepCTR model for custom predictions

## 📝 License

Private - PTD Fitness
