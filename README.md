# Student Success Platform

AI-powered student risk prediction and intervention recommendation system built on the OULAD dataset.

## Features

- **Risk Prediction** — CatBoost model (AUC-ROC 0.97) predicts student dropout probability with SHAP explanations
- **Intervention Generation** — Hybrid rule-based + LLM engine generates personalised action plans
- **Student Management** — Browse, search, and filter all students with full profile modals
- **AI Chat (EduAssist)** — OpenAI-powered advisor assistant with session history and student context
- **Help Page** — Built-in documentation and FAQ for advisors
- **Dark Mode** — Full dark/light theme with system preference detection

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Python 3.12, FastAPI, Pydantic v2 |
| ML Model | CatBoost, SHAP, scikit-learn |
| LLM | OpenAI gpt-4o-mini |
| State | Zustand + React Query |

## Architecture

```
frontend-react/         React + TypeScript SPA
src/
├── api/               FastAPI routes (predict, students, dashboard, intervention, chat, upload)
├── models/            CatBoost predictor + SHAP explainer
├── agent/             Rule engine + LLM client + hybrid engine + prompts
├── etl/               Data loader (CSV → in-memory DataFrame)
├── services/          Chat session store
└── config.py          Settings (pydantic-settings, reads from .env)
models/                Trained model files (.pkl / .joblib)
notebooks/             Jupyter exploration + training pipeline
```

## Quick Start

### Prerequisites

- Python 3.12
- Node.js 18+
- OpenAI API key (for chat and LLM-enhanced interventions)

### Backend

```bash
cd ai-student-success
python -m venv studRec
.\studRec\Scripts\activate        # Windows
# source studRec/Scripts/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Configuration

Create a `.env` file in `ai-student-success/`:

```env
# API
API_TITLE=Student Success Platform API
API_VERSION=1.0.0
API_PREFIX=/api/v1
DEBUG=false

# OpenAI (required for chat + LLM interventions)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# LLM
LLM_TIMEOUT=30.0
LLM_ENABLED=true

# Risk thresholds
RISK_THRESHOLD_HIGH=70
RISK_THRESHOLD_MEDIUM=40
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/dashboard/stats` | GET | Dashboard statistics |
| `/api/v1/predict` | POST | Single student prediction |
| `/api/v1/predict/batch` | POST | Batch predictions |
| `/api/v1/students` | GET | List students (paginated + filtered) |
| `/api/v1/students/{id}/predict` | GET | Predict for a loaded student |
| `/api/v1/intervention` | POST | Generate intervention plan |
| `/api/v1/upload/csv` | POST | Upload student data CSV |
| `/api/v1/upload/status` | GET | Check upload status |
| `/api/v1/chat` | POST | Chat with EduAssist |
| `/api/v1/chat/status` | GET | Check AI availability |
| `/api/v1/chat/session` | POST | Create new chat session |
| `/api/v1/chat/history/{id}` | GET/DELETE | Get or clear session history |

Full interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Model

The production model is `models/catboost_baseline_production.pkl` — a CatBoost classifier trained on OULAD data with native categorical feature handling. Key metrics on the test set:

| Metric | Score |
|--------|-------|
| AUC-ROC | 0.9780 |
| Recall (at-risk) | **0.9009** — primary metric |
| F1-Score | 0.913 |
| Accuracy | 0.911 |

> Recall is the primary metric — missing a real at-risk student is more costly than a false alarm.

SHAP values are computed at prediction time using `shap.TreeExplainer` to explain individual risk scores.

## Data

Upload a CSV with these columns to enable the Dashboard and Students pages:

```
# Numeric
num_of_prev_attempts, studied_credits, avg_score, total_clicks, completion_rate

# Categorical (raw strings — no encoding needed)
code_module, gender, region, highest_education, imd_band, age_band, disability

# Optional
name, student_id
```

A ready-to-use sample is at `data/sample_students.csv`. Uploaded data persists to `data/uploads/uploaded_data.csv` and is reloaded on restart.

## Development

```bash
# Backend tests
pytest tests/

# Frontend build
cd frontend-react && npm run build
```

## License

MIT
