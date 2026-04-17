# Student Success Platform - Setup Guide

This guide walks you through setting up and running the AI-powered Student Success Platform.

## Prerequisites

- **Python 3.10+**
- **Node.js 16+** with npm
- **OpenAI API key** or **Ollama** (optional, for LLM-enhanced interventions)

---

## Quick Start

### 1. Clone and Setup Environment

```bash
cd ai-student-success

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default settings work out of the box. Key variables:

```env
API_TITLE=Student Success Platform API
API_VERSION=1.0.0
API_PREFIX=/api/v1
DEBUG=false

# LLM Provider: "openai" or "ollama"
LLM_PROVIDER=openai
LLM_TIMEOUT=30.0
LLM_ENABLED=true

# OpenAI Settings (if LLM_PROVIDER=openai)
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Ollama Settings (if LLM_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:1.5b
```

### 3. Start Backend Server

```bash
# From project root (ai-student-success/)
uvicorn src.api.main:app --reload --port 8000
```

Expected output:
```
[OK] Model loaded from models/catboost_baseline_production.pkl
[OK] SHAP explainer initialized
INFO: Uvicorn running on http://127.0.0.1:8000
```

API docs available at: http://localhost:8000/docs

### 4. Start Frontend Server

```bash
cd frontend-react
npm install
npm run dev
```

Expected output:
```
VITE v5.4.7 ready

  Local:   http://localhost:5173/
```

### 5. (Optional) Configure LLM for AI Features

The platform supports two LLM providers:

#### Option A: OpenAI API (Recommended)

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env` file:
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

#### Option B: Ollama (Local/Free)

```bash
# Install Ollama from https://ollama.ai
ollama pull deepseek-r1:1.5b
ollama serve
```

Then set in `.env`:
```env
LLM_PROVIDER=ollama
```

Without an LLM provider, the system uses rule-based interventions only.

---

## Project Structure

```
ai-student-success/
├── src/                     # Backend (Python/FastAPI)
│   ├── api/
│   │   ├── main.py         # FastAPI entry point
│   │   ├── routes/         # API endpoints
│   │   └── schemas/        # Pydantic models
│   ├── models/             # ML model loaders
│   ├── agent/              # Intervention system
│   └── etl/                # Data pipeline
│
├── frontend-react/         # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── api/            # API hooks
│   │   ├── components/     # React components
│   │   └── pages/          # Tab pages
│   └── vite.config.ts      # Vite config with API proxy
│
├── models/                 # Pre-trained ML models
│   ├── catboost_baseline_production.pkl  ← production model
│   └── catboost_full_tuned.pkl           ← tuned variant (reference)
│
├── data/                   # Data files
│   ├── processed/          # Ready-to-use features
│   └── uploads/            # User uploads
│
└── requirements.txt        # Python dependencies
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/dashboard/stats` | Dashboard statistics |
| GET | `/api/v1/students` | List students |
| GET | `/api/v1/students/{id}` | Get student details |
| GET | `/api/v1/students/{id}/predict` | Get student prediction |
| POST | `/api/v1/predict` | Predict on input data |
| POST | `/api/v1/predict/batch` | Run batch predictions |
| POST | `/api/v1/intervention` | Generate interventions |
| POST | `/api/v1/upload` | Upload student data |

---

## Frontend Features

### Prediction Tab
- Dashboard stats (total students, risk counts)
- Risk distribution donut chart
- Student lookup with search
- Batch prediction trigger

### Students Tab
- Filterable student table
- Individual student modal with risk details
- SHAP factor visualization

### Intervention Tab
- Generate interventions for at-risk students
- Rule-based and LLM-enhanced recommendations

### Chat Tab
- AI assistant for intervention guidance
- Context-aware recommendations

### Data Tab
- Upload student CSV files
- Dataset overview

---

## Development Commands

```bash
# Backend
uvicorn src.api.main:app --reload --port 8000

# Frontend
cd frontend-react && npm run dev

# Type check frontend
cd frontend-react && npx tsc --noEmit

# Build frontend for production
cd frontend-react && npm run build
```

---

## Troubleshooting

### Model not found
Ensure `models/` folder contains:
- `catboost_baseline_production.pkl`

### CORS errors
Vite proxy handles API calls. Ensure `vite.config.ts` has:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

### LLM not working
- **OpenAI**: Verify `OPENAI_API_KEY` is set correctly in `.env`
- **Ollama**: Start with `ollama serve` or set `LLM_PROVIDER=openai`
- Check `LLM_ENABLED=true` in `.env`

### Port already in use
Backend: `uvicorn src.api.main:app --port 8001`
Frontend: `npm run dev -- --port 5174`

---

## Technology Stack

**Backend:**
- FastAPI (REST API)
- CatBoost (risk prediction, native categorical handling)
- SHAP (model explainability)
- OpenAI/Ollama (LLM interventions)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- TanStack Query (data fetching)
- Zustand (state management)

---

## Data Requirements

The platform uses the Open University Learning Analytics Dataset (OULAD).

**Required CSV columns:**

Numeric:
- `num_of_prev_attempts`, `studied_credits`, `avg_score`, `total_clicks`, `completion_rate`

Categorical (raw strings — no encoding needed):
- `code_module` (e.g. AAA, BBB), `gender` (M/F), `region`, `highest_education`, `imd_band`, `age_band`, `disability` (Y/N)

Optional:
- `name` — student display name; falls back to `student_id` if absent

Upload via the **Data Upload** tab or place a file at `data/uploads/uploaded_data.csv` for auto-load on startup. A sample is available at `data/sample_students.csv`.

---

## Production Deployment

1. Build frontend: `npm run build`
2. Serve static files from `frontend-react/dist/`
3. Run backend with gunicorn: `gunicorn src.api.main:app -w 4 -k uvicorn.workers.UvicornWorker`
4. Update CORS settings in `src/api/main.py` for production domains
5. Set `DEBUG=false` in `.env`
