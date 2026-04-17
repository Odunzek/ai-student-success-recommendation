# Student Success Platform — Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Backend (FastAPI)](#backend)
5. [Frontend (React)](#frontend)
6. [Machine Learning Model](#machine-learning-model)
7. [LLM Integration](#llm-integration)
8. [API Reference](#api-reference)
9. [Data Storage](#data-storage)
10. [Configuration](#configuration)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Student Success Platform is an AI-powered web application that helps educational institutions identify at-risk students and generate personalised intervention recommendations, built on the Open University Learning Analytics Dataset (OULAD).

### Key Features

| Feature | Description |
|---------|-------------|
| Risk Prediction | CatBoost model (AUC 0.971) predicts dropout probability per student |
| SHAP Explanations | Feature-level explanations for every prediction |
| Intervention Engine | Hybrid rule-based + LLM system generating actionable plans |
| Student Management | Full CRUD browsing with search, filter, and profile modals |
| AI Chat (EduAssist) | OpenAI-powered assistant with session history and student context |
| Dashboard | Live cohort stats, risk distribution, and high-priority alerts |
| Help Page | Built-in advisor documentation and FAQ |
| Dark Mode | Full theme support with system preference detection |

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, Framer Motion |
| Backend | Python 3.12, FastAPI, Pydantic v2, pydantic-settings |
| ML | CatBoost 1.2, SHAP, scikit-learn, joblib |
| LLM | OpenAI `gpt-4o-mini` via `openai` async client |
| State | Zustand (client), React Query (server) |
| Virtual Env | `studRec` (Python venv) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React SPA)                         │
│                                                                      │
│  Dashboard  Risk Assessment  Students  Interventions  Chat  Data  Help│
│                                                                      │
│                        React Query (API Hooks)                       │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │ HTTP/REST  (Vite proxy /api → /api/v1)
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                             │
│                                                                      │
│   /predict  /students  /dashboard  /intervention  /chat  /upload    │
│                                                                      │
│   ┌───────────┐  ┌────────┐  ┌────────────┐  ┌──────────────────┐  │
│   │ CatBoost  │  │ Data   │  │  Hybrid    │  │   OpenAI Client  │  │
│   │ Predictor │  │ Loader │  │  Engine    │  │  (gpt-4o-mini)   │  │
│   │ + SHAP    │  │ (CSV)  │  │Rules + LLM │  │                  │  │
│   └───────────┘  └────────┘  └────────────┘  └──────────────────┘  │
│                                                                      │
│   models/catboost_baseline_production.pkl   data/uploads/uploaded_data.csv        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Upload Flow
```
User uploads CSV → POST /upload/csv → DataLoader.load() → pandas DataFrame (in-memory)
                                    → saved to data/uploads/uploaded_data.csv
```

### Prediction Flow
```
Student features → CatBoost.predict_proba() → risk_score (0–100)
                → SHAP TreeExplainer       → shap_factors (per-feature contributions)
```

### Intervention Flow
```
risk_score + metrics → Rule Engine → base recommendations
                     → LLM (if enabled) → personalised plan with Why/Action/Owner/Timeline
```

### Chat Flow
```
user message → rate limit check → input sanitize + injection detect
             → student context injection (if student_id given):
               fetch record + prediction + SHAP factors → injected as structured text
             → OpenAI chat.completions → response stored in ChatStore session
```

---

## Backend

### Directory Structure

```
src/
├── api/
│   ├── main.py              # FastAPI app factory + lifespan
│   ├── routes/
│   │   ├── predict.py       # POST /predict, POST /predict/batch
│   │   ├── students.py      # GET /students, GET /students/{id}
│   │   ├── dashboard.py     # GET /dashboard/stats
│   │   ├── intervention.py  # POST /intervention
│   │   ├── chat.py          # POST /chat, GET /chat/status, session management
│   │   ├── upload.py        # POST /upload/csv, GET /upload/status
│   │   └── settings.py      # GET /settings
│   └── schemas/
│       ├── student.py       # StudentFeatures, StudentResponse
│       ├── prediction.py    # PredictionResponse, PredictionWithExplanation
│       ├── intervention.py  # InterventionResult, InterventionRequest
│       └── chat.py          # ChatRequest, ChatResponse, ChatHistoryResponse
├── models/
│   ├── predictor.py         # CatBoost model wrapper (singleton)
│   └── explainer.py         # SHAP TreeExplainer wrapper (singleton)
├── agent/
│   ├── rules.py             # Rule-based intervention engine
│   ├── llm_client.py        # OpenAI async client
│   ├── prompts.py           # All prompt templates + injection detection
│   └── hybrid.py            # Rules + LLM combined engine
├── etl/
│   └── loader.py            # CSV → in-memory DataFrame (singleton)
├── services/
│   └── chat_store.py        # In-memory session store with rate limiting
└── config.py                # Settings (pydantic-settings, reads .env)
```

### Key Components

#### Predictor (`src/models/predictor.py`)

Wraps `catboost_baseline_production.pkl` for predictions. Singleton via `get_predictor()`.

```python
predictor = get_predictor()
predictor.load()
result = predictor.predict(student_features_dict)
# → { risk_score, risk_probability, risk_level, prediction }
```

**Risk thresholds** (configurable via `.env`):

| Level | Default Range |
|-------|---------------|
| High | ≥ 70% |
| Medium | 40–69% |
| Low | < 40% |

#### SHAP Explainer (`src/models/explainer.py`)

Computes SHAP values using `shap.TreeExplainer` on the loaded CatBoost model.

```python
explainer = get_explainer()
factors = explainer.explain(features_df)
# → [{ feature, value, impact, direction }, ...]
```

`direction: "positive"` = increases risk, `"negative"` = decreases risk.

#### Data Loader (`src/etl/loader.py`)

Singleton managing the uploaded student dataset in memory.

```python
loader = get_data_loader()
loader.load(path)                        # Load CSV
loader.get_student(student_id)           # Single student dict
loader.get_all_students(page, per_page, risk_level)
loader.get_statistics()                  # Cohort summary stats
```

Data is persisted to `data/uploads/uploaded_data.csv` and auto-reloaded on startup if it exists.

#### Rule Engine (`src/agent/rules.py`)

Deterministic intervention rules triggered by metric thresholds:

| Condition | Priority | Intervention |
|-----------|----------|--------------|
| `completion_rate < 0.30` | critical | Assessment Completion Support |
| `completion_rate < 0.50` | high | Assessment Monitoring |
| `avg_score < 40` | critical | Academic Performance Support |
| `avg_score < 50` | medium | Performance Improvement Plan |
| `total_clicks < 100` | high | Re-engagement Outreach |
| `total_clicks < 200` | medium | Engagement Encouragement |
| `num_of_prev_attempts > 0` | medium | Repeat Student Support |
| `risk_score ≥ 70` | critical | Immediate Advisor Contact |

#### Hybrid Engine (`src/agent/hybrid.py`)

Runs rule engine first, then optionally enhances with OpenAI.

- If `use_llm=True` and key is configured → LLM personalises each intervention
- If LLM unavailable → returns rule-based recommendations only (graceful degradation)

#### LLM Client (`src/agent/llm_client.py`)

Async OpenAI client using `AsyncOpenAI`.

```python
client = get_llm_client()
available = await client.is_available()   # True if OPENAI_API_KEY is set
response  = await client.generate(prompt, system_prompt)
```

Model: `gpt-4o-mini` (configurable via `OPENAI_MODEL`). Timeout: 30s (configurable).

#### Chat Store (`src/services/chat_store.py`)

In-memory session manager for the EduAssist chat.

- Sessions expire after **24 hours** of inactivity
- Max **50 messages** per session (oldest evicted)
- Rate limit: **20 requests per minute** per session
- Max **1000 concurrent sessions**

#### Prompts (`src/agent/prompts.py`)

All LLM prompt templates plus security utilities:

| Function | Purpose |
|----------|---------|
| `CHAT_SYSTEM_PROMPT` | EduAssist persona and guardrails |
| `INTERVENTION_ENHANCEMENT_TEMPLATE` | Structured intervention plan template |
| `create_chat_prompt()` | Builds prompt with optional history and context |
| `create_intervention_prompt()` | Builds intervention enhancement prompt |
| `detect_injection_attempt()` | Regex-based injection pattern detection |
| `sanitize_input()` | Strips control chars, normalises whitespace |

---

## Frontend

### Directory Structure

```
frontend-react/src/
├── api/
│   ├── client.ts            # fetch wrapper (GET/POST/PUT/DELETE)
│   └── hooks/
│       ├── useDashboard.ts
│       ├── useStudents.ts
│       ├── usePrediction.ts
│       ├── useIntervention.ts
│       ├── useChat.ts
│       └── useUpload.ts
├── components/
│   ├── chat/                # ChatInterface, ChatWidget, ChatMessage
│   ├── dashboard/           # StatCard, AlertsTable, RiskTrendChart
│   ├── intervention/        # InterventionCard, InterventionForm
│   ├── layout/              # AppLayout, Sidebar, TopHeader
│   ├── prediction/          # RiskCircle, RiskDistribution, ShapFactors, StudentLookup
│   ├── students/            # StudentTable, StudentModal
│   ├── upload/              # Dropzone, DatasetInfo
│   └── ui/                  # Button, Badge, Spinner, Toast, Modal
├── pages/
│   ├── DashboardPage.tsx
│   ├── PredictionTab.tsx
│   ├── StudentsTab.tsx
│   ├── InterventionTab.tsx
│   ├── ChatTab.tsx
│   ├── DataTab.tsx
│   └── HelpPage.tsx         # Built-in advisor documentation
├── store/
│   ├── useAppStore.ts       # Zustand: routing, modals, chat/intervention state
│   └── useThemeStore.ts     # Zustand: dark/light theme
├── lib/
│   ├── animations.ts        # Framer Motion variants
│   ├── hooks.ts             # useMediaQuery, etc.
│   └── utils.ts             # cn(), formatPercentage(), etc.
├── types/                   # TypeScript interfaces
└── App.tsx                  # Route registry + AnimatePresence
```

### Routing

Client-side routing via Zustand `activeRoute` (no React Router):

| Route | Page | Description |
|-------|------|-------------|
| `dashboard` | DashboardPage | Cohort overview + alerts |
| `risk-assessment` | PredictionTab | Manual + student prediction |
| `students` | StudentsTab | Browse all students |
| `interventions` | InterventionTab | Generate intervention plans |
| `chat` | ChatTab | EduAssist full-page chat |
| `data` | DataTab | CSV upload |
| `help` | HelpPage | Documentation and FAQ |

### State Management

**React Query** — server state (caching, refetching, mutations):
- `staleTime: 5min` on dashboard queries to reduce API calls
- Query invalidation after uploads and predictions

**Zustand** — client state:
- Active route, sidebar collapse, theme
- Student modal (open/close/selected ID)
- Chat session persistence (messages, session ID in localStorage)
- Intervention tab state persistence

### Vite Proxy

`/api/*` → `http://localhost:8000/api/v1/*`

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
  }
}
```

---

## Machine Learning Model

### Model: CatBoost Classifier

**File:** `models/catboost_baseline_production.pkl`

CatBoost was selected after a full tuned comparison against XGBoost, Random Forest, and Logistic Regression on OULAD data. It handles categorical features natively — no one-hot encoding needed.

**Training pipeline** (see `notebooks/notebook.ipynb` — full pipeline with EDA, model comparison, and hyperparameter tuning. Legacy exploratory notebook archived as `notebooks/notebook_legacy.ipynb`):

1. ETL — merge OULAD relational tables → `student_features.csv`
2. Feature engineering — `completion_rate`, `total_clicks`, module dummies
3. Baseline comparison — 4 models evaluated (XGBoost won baseline; CatBoost tuned via `randomized_search`)
4. Model comparison — CatBoost baseline vs tuned vs Random Forest vs Logistic Regression
5. Model selection — CatBoost **baseline** chosen for production: Recall 0.9009 > Tuned 0.8983
6. SHAP explainability — TreeExplainer generates per-feature SHAP values at prediction time

**Test set performance:**

| Metric | CatBoost Baseline (Production) |
|--------|---------------------------------|
| AUC-ROC | 0.9780 |
| Recall (at-risk) | **0.9009** — primary metric |
| F1-Score | 0.913 |
| Accuracy | 0.911 |
| Precision | 0.86 |

**Input features (CatBoost — raw, unencoded):**

| Feature | Type | Description |
|---------|------|-------------|
| `code_module` | categorical | Course module code (AAA–GGG) |
| `gender` | categorical | M / F |
| `region` | categorical | Student's UK region |
| `highest_education` | categorical | Highest prior qualification |
| `imd_band` | categorical | Index of Multiple Deprivation band |
| `age_band` | categorical | Age group |
| `disability` | categorical | Disability status |
| `num_of_prev_attempts` | int | Previous module attempts |
| `studied_credits` | int | Credits enrolled |
| `avg_score` | float | Mean assessment score |
| `total_clicks` | int | VLE platform interactions |
| `completion_rate` | float | Assessments completed / total |

**Output:**
```json
{
  "risk_score": 75,
  "risk_probability": 0.75,
  "risk_level": "high",
  "prediction": 1
}
```

### Model Files

```
models/
├── catboost_baseline_production.pkl  ← production model (loaded by app)
├── catboost_full_tuned.pkl           ← tuned variant (higher precision, lower recall — not used in production)
├── model_comparison_results.csv      ← 4-model comparison results
└── best_params.csv                   ← CatBoost tuning hyperparameters
```

---

## LLM Integration

### Provider: OpenAI (gpt-4o-mini)

The platform uses the OpenAI API exclusively for both chat and intervention enhancement.

**Setup:**
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini   # default
LLM_TIMEOUT=30.0
LLM_ENABLED=true
```

**Availability check** — `is_available()` returns `True` if `OPENAI_API_KEY` is non-empty. Authentication errors surface as `None` responses from `generate()`, which the routes handle gracefully.

### Chat — EduAssist

**Endpoint:** `POST /api/v1/chat`

**Request:**
```json
{
  "message": "Why is this student high risk?",
  "student_id": "12345",
  "session_id": "uuid-optional",
  "context": "optional extra context"
}
```

If `student_id` is provided, the handler automatically loads that student's metrics and risk prediction as context before calling the LLM.

**Security:**
- Prompt injection detection (regex patterns: role override, instruction bypass, jailbreaks)
- Input sanitisation (control char removal, whitespace normalisation, 2000 char limit)
- Rate limiting: 20 req/min per session

**Conversation memory:** Last 10 messages (up to 1500 chars each) included in every prompt for multi-turn coherence.

### Interventions — LLM Enhancement

**Endpoint:** `POST /api/v1/intervention` with `use_llm: true`

The LLM receives the student's metrics + rule-based recommendations and returns a structured plan:

```
SUMMARY: [root cause analysis]

INTERVENTIONS:
1. **Title**
   Why: ...    Action: ...    Owner: ...    Timeline: ...    Success: ...
```

If `use_llm: false` or the API is unavailable, rule-based recommendations are returned directly (`llm_enhanced: false`).

---

## API Reference

**Base URL:** `http://localhost:8000/api/v1`

### Health
```
GET /health
→ { "status": "healthy", "model_loaded": true }
```

### Dashboard
```
GET /dashboard/stats
→ { total_students, high_risk_count, medium_risk_count, low_risk_count,
    avg_dropout_probability, model_accuracy }
```

### Prediction
```
POST /predict
Body: { num_of_prev_attempts, studied_credits, avg_score, total_clicks,
        completion_rate, code_module, gender, region, highest_education,
        imd_band, age_band, disability }
→ { risk_score, risk_probability, risk_level, prediction, shap_factors[] }

POST /predict/batch
→ { processed, high_risk, medium_risk, low_risk, errors }
```

### Students
```
GET /students?page=1&per_page=20&risk_level=high&search=
→ { students[], total, page, per_page, total_pages }

GET /students/{id}
→ { student: { ...features } }

GET /students/{id}/predict
→ { dropout_probability, risk_level, confidence, shap_factors[] }
```

### Interventions
```
POST /intervention
Body: { risk_score, completion_rate, avg_score, total_clicks,
        studied_credits, num_of_prev_attempts, use_llm,
        student_name?, module_name?, shap_factors[]? }
→ { risk_level, summary, interventions[], llm_enhanced }
```

### Chat
```
POST /chat
Body: { message, student_id?, session_id?, context? }
→ { response, llm_available, session_id, flagged, flag_reason? }

GET /chat/status
→ { available, message }

POST /chat/session
→ { session_id, message }

GET  /chat/history/{session_id}
→ { session_id, messages[], message_count }

DELETE /chat/history/{session_id}
→ { success, message }

GET /chat/stats
→ { total_sessions, max_sessions, session_timeout_hours, rate_limit }
```

### Upload
```
POST /upload/csv        (multipart/form-data)
→ { message, rows_processed, filename }

GET /upload/status
→ { has_data, row_count, columns[], last_upload }

DELETE /upload/data
→ { success, message }
```

---

## Data Storage

### In-Memory (runtime)

Student data is held in a pandas DataFrame loaded from CSV. No database required.

- **Loaded at:** startup (if `data/uploads/uploaded_data.csv` exists) or via upload
- **Reset at:** server restart (unless upload file exists)

### File System

```
data/
├── raw/                         # Original OULAD CSV files
│   ├── studentInfo.csv
│   ├── studentAssessment.csv
│   ├── studentVle.csv
│   ├── assessments.csv
│   ├── courses.csv
│   ├── studentRegistration.csv
│   └── vle.csv
├── processed/
│   ├── student_features.csv     # Merged feature dataset (unencoded)
│   └── student_features_encoded.csv  # One-hot encoded (for XGBoost)
└── uploads/
    └── uploaded_data.csv        # Persisted upload (auto-reloaded on restart)
```

---

## Configuration

All settings live in `src/config.py` (Pydantic `BaseSettings`) and are read from `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_TITLE` | Student Success Platform API | Swagger title |
| `API_VERSION` | 1.0.0 | API version string |
| `API_PREFIX` | /api/v1 | URL prefix for all routes |
| `DEBUG` | false | FastAPI debug mode |
| `OPENAI_API_KEY` | None | OpenAI key (required for LLM features) |
| `OPENAI_MODEL` | gpt-4o-mini | OpenAI model ID |
| `OPENAI_BASE_URL` | None | Optional Azure/proxy override |
| `LLM_TIMEOUT` | 30.0 | OpenAI request timeout (seconds) |
| `LLM_ENABLED` | true | Global LLM on/off switch |
| `RISK_THRESHOLD_HIGH` | 70 | Score ≥ this → high risk |
| `RISK_THRESHOLD_MEDIUM` | 40 | Score ≥ this → medium risk |
| `MODEL_ACCURACY` | None | Optional override shown in UI |

**Model paths** (relative to project root, auto-resolved):

| Setting | Default Path |
|---------|-------------|
| `model_path` | `models/catboost_baseline_production.pkl` |
| `student_data_path` | `data/processed/student_features.csv` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: catboost` | Ensure `studRec` venv is active: `source studRec/Scripts/activate` |
| AI chat shows offline | Set valid `OPENAI_API_KEY` in `.env`, restart backend |
| 404 on `/api/v1/chat/status` | Stale process on port 8000 — kill old processes via Task Manager or `taskkill` |
| Dashboard empty | Upload a CSV via Data Upload first |
| Upload fails with column error | Ensure CSV contains all required feature columns |
| SHAP explainer warns on startup | Non-critical — predictions still work; SHAP initialises lazily |
| Kernel `No module named catboost` in notebook | Select the `studRec` Python interpreter in VS Code's kernel picker |
| Multiple processes on port 8000 | `powershell.exe -Command "Stop-Process -Id <PID> -Force"` |
