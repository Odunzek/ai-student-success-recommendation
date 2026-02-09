# Student Success Platform - Setup Guide

This guide walks you through setting up and running the AI-powered Student Success Platform.

## Prerequisites

- **Python 3.10+**
- **Node.js 16+** with npm
- **Ollama** (optional, for LLM-enhanced interventions)

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

# LLM Settings (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:1.5b
LLM_TIMEOUT=30.0
LLM_ENABLED=true
```

### 3. Start Backend Server

```bash
# From project root (ai-student-success/)
uvicorn src.api.main:app --reload --port 8000
```

Expected output:
```
[OK] Model loaded from models/xgboost_final.joblib
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

### 5. (Optional) Start Ollama for LLM Features

```bash
# Install Ollama from https://ollama.ai
ollama pull deepseek-r1:1.5b
ollama serve
```

Without Ollama, the system uses rule-based interventions only.

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
│   ├── xgboost_final.joblib
│   ├── scaler.joblib
│   └── feature_list.csv
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
- `xgboost_final.joblib`
- `scaler.joblib`
- `feature_list.csv`

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

### Ollama connection refused
Either start Ollama (`ollama serve`) or disable LLM features in requests.

### Port already in use
Backend: `uvicorn src.api.main:app --port 8001`
Frontend: `npm run dev -- --port 5174`

---

## Technology Stack

**Backend:**
- FastAPI (REST API)
- XGBoost (risk prediction)
- SHAP (model explainability)
- Ollama/DeepSeek (LLM interventions)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- TanStack Query (data fetching)
- Zustand (state management)

---

## Data Requirements

The platform uses the Open University Learning Analytics Dataset (OULAD).

**Required features:**
- `num_of_prev_attempts`
- `studied_credits`
- `avg_score`
- `total_clicks`
- `completion_rate`
- Module indicators (module_BBB, module_CCC, etc.)

Processed data should be in `data/processed/student_features_encoded.csv`.

---

## Production Deployment

1. Build frontend: `npm run build`
2. Serve static files from `frontend-react/dist/`
3. Run backend with gunicorn: `gunicorn src.api.main:app -w 4 -k uvicorn.workers.UvicornWorker`
4. Update CORS settings in `src/api/main.py` for production domains
5. Set `DEBUG=false` in `.env`
