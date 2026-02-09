# Student Success Platform - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Backend (Python/FastAPI)](#backend)
5. [Frontend (React/TypeScript)](#frontend)
6. [Machine Learning Model](#machine-learning-model)
7. [LLM Integration](#llm-integration)
8. [API Reference](#api-reference)
9. [Database/Data Storage](#data-storage)
10. [Configuration](#configuration)

---

## Overview

The Student Success Platform is an AI-powered web application that helps educational institutions identify at-risk students and generate personalized intervention recommendations.

### Key Features
- **Risk Prediction**: Uses XGBoost ML model to predict student dropout probability
- **Explainable AI**: SHAP values show which factors contribute to risk
- **Smart Interventions**: Hybrid system (rules + LLM) generates personalized recommendations
- **Dashboard**: Visual analytics of student risk distribution
- **AI Chat**: Natural language assistant for advisors

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.10+, FastAPI, Pydantic |
| ML Model | XGBoost, SHAP, scikit-learn |
| LLM | Ollama (DeepSeek-R1) |
| State | Zustand (frontend), React Query (data fetching) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │Prediction│ │ Students │ │Intervent.│ │   Chat   │ │  Data │ │
│  │   Tab    │ │   Tab    │ │   Tab    │ │   Tab    │ │  Tab  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬───┘ │
│       │            │            │            │           │      │
│       └────────────┴─────┬──────┴────────────┴───────────┘      │
│                          │                                       │
│                    React Query                                   │
│                     (API Hooks)                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      API Routes                              │ │
│  │  /predict  /students  /dashboard  /intervention  /chat      │ │
│  └──────┬────────┬──────────┬────────────┬───────────┬─────────┘ │
│         │        │          │            │           │           │
│         ▼        ▼          ▼            ▼           ▼           │
│  ┌──────────┐ ┌──────┐ ┌────────┐ ┌───────────┐ ┌─────────┐     │
│  │Predictor │ │Loader│ │ Stats  │ │  Hybrid   │ │   LLM   │     │
│  │(XGBoost) │ │(CSV) │ │        │ │  Engine   │ │ Client  │     │
│  └────┬─────┘ └──┬───┘ └────────┘ └─────┬─────┘ └────┬────┘     │
│       │          │                      │            │           │
│       ▼          ▼                      ▼            ▼           │
│  ┌──────────┐ ┌──────────┐       ┌───────────┐ ┌──────────┐     │
│  │  SHAP    │ │  Data    │       │   Rules   │ │  Ollama  │     │
│  │Explainer │ │  Files   │       │  Engine   │ │  Server  │     │
│  └──────────┘ └──────────┘       └───────────┘ └──────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Data Upload Flow
```
User uploads CSV → /api/v1/upload/csv → ETL Pipeline → Data Loader → In-Memory Storage
```

### 2. Prediction Flow
```
Student Data → Predictor (XGBoost) → Risk Score → SHAP Explainer → Risk Factors
```

### 3. Intervention Flow
```
Risk Score → Rule Engine → Base Recommendations → LLM Enhancement → Personalized Interventions
```

### 4. Dashboard Flow
```
Data Loader → Statistics → Risk Distribution → Frontend Charts
```

---

## Backend

### Directory Structure
```
src/
├── api/
│   ├── main.py              # FastAPI app entry point
│   ├── routes/
│   │   ├── predict.py       # Prediction endpoints
│   │   ├── students.py      # Student data endpoints
│   │   ├── dashboard.py     # Dashboard statistics
│   │   ├── intervention.py  # Intervention generation
│   │   ├── chat.py          # AI chat endpoint
│   │   └── upload.py        # File upload endpoints
│   └── schemas/
│       ├── student.py       # Student data models
│       ├── prediction.py    # Prediction response models
│       ├── intervention.py  # Intervention models
│       └── chat.py          # Chat models
├── models/
│   ├── predictor.py         # XGBoost model wrapper
│   └── explainer.py         # SHAP explainer wrapper
├── agent/
│   ├── rules.py             # Rule-based intervention engine
│   ├── llm_client.py        # Ollama API client
│   ├── prompts.py           # LLM prompt templates
│   └── hybrid.py            # Combined rules + LLM engine
├── etl/
│   ├── loader.py            # Data loading utilities
│   └── pipeline.py          # Data transformation pipeline
└── config.py                # Application settings
```

### Key Components

#### 1. Predictor (`src/models/predictor.py`)
Wraps the XGBoost model for making predictions.

```python
# Usage
predictor = get_predictor()
predictor.load()  # Load model from file
result = predictor.predict(student_features)
# Returns: {risk_score, risk_probability, risk_level, prediction}
```

**Risk Levels:**
- `low`: risk_score < 40
- `medium`: 40 <= risk_score < 70
- `high`: risk_score >= 70

#### 2. Data Loader (`src/etl/loader.py`)
Singleton class that manages student data in memory.

```python
# Usage
loader = get_data_loader()
loader.load(path)           # Load CSV file
loader.get_student(id)      # Get single student
loader.get_all_students()   # Get paginated list
loader.get_statistics()     # Get summary stats
```

#### 3. Rule Engine (`src/agent/rules.py`)
Generates deterministic intervention recommendations based on thresholds.

**Rules:**
| Condition | Intervention |
|-----------|--------------|
| completion_rate < 30% | Critical: Assessment Completion Support |
| completion_rate < 50% | High: Assessment Monitoring |
| avg_score < 40 | Critical: Academic Performance Support |
| avg_score < 50 | Medium: Performance Improvement |
| total_clicks < 100 | High: Re-engagement Required |
| total_clicks < 200 | Medium: Engagement Encouragement |
| prev_attempts > 0 | Repeat Student Support |
| risk_score >= 70 | Critical: Immediate Contact |

#### 4. Hybrid Engine (`src/agent/hybrid.py`)
Combines rule-based recommendations with LLM personalization.

```
Layer 1 (Rules): Always runs, provides base recommendations
Layer 2 (LLM): Optional, enhances with personalized messaging
```

**Graceful Degradation:** If LLM is unavailable, returns rule-based recommendations only.

#### 5. LLM Client (`src/agent/llm_client.py`)
Communicates with Ollama server for AI text generation.

```python
# Usage
client = get_llm_client()
available = await client.is_available()  # Check if Ollama is running
response = await client.generate(prompt, system_prompt)
```

---

## Frontend

### Directory Structure
```
frontend-react/src/
├── api/
│   ├── client.ts            # HTTP client wrapper
│   └── hooks/
│       ├── usePrediction.ts # Prediction API hooks
│       ├── useStudents.ts   # Student data hooks
│       ├── useDashboard.ts  # Dashboard stats hooks
│       ├── useIntervention.ts
│       ├── useChat.ts
│       └── useUpload.ts
├── components/
│   ├── prediction/
│   │   ├── RiskCircle.tsx       # Circular risk visualization
│   │   ├── RiskDistribution.tsx # Donut chart + batch button
│   │   ├── ShapFactors.tsx      # Feature importance bars
│   │   └── StudentLookup.tsx    # Student search
│   ├── students/
│   │   ├── StudentTable.tsx     # Paginated student list
│   │   └── StudentModal.tsx     # Student detail modal
│   ├── intervention/
│   │   ├── InterventionCard.tsx
│   │   └── InterventionForm.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   └── ChatMessage.tsx
│   ├── dashboard/
│   │   └── StatCard.tsx
│   ├── upload/
│   │   ├── Dropzone.tsx
│   │   └── DatasetInfo.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── TabNav.tsx
│   │   └── Footer.tsx
│   └── ui/                  # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Alert.tsx
│       └── Spinner.tsx
├── pages/
│   ├── PredictionTab.tsx    # Risk analysis dashboard
│   ├── StudentsTab.tsx      # Student list view
│   ├── InterventionTab.tsx  # Intervention generator
│   ├── ChatTab.tsx          # AI assistant
│   └── DataTab.tsx          # Data upload
├── types/
│   ├── student.ts
│   ├── prediction.ts
│   ├── intervention.ts
│   └── chat.ts
├── lib/
│   └── utils.ts             # Utility functions
├── store/
│   └── useAppStore.ts       # Zustand global state
├── App.tsx                  # Main app component
└── main.tsx                 # Entry point
```

### Key Components

#### 1. RiskCircle
Circular progress indicator showing dropout probability.

```tsx
<RiskCircle probability={0.75} size="lg" />
// Shows 75% with "high" risk label
// Colors: green (low), yellow (medium), red (high)
```

#### 2. RiskDistribution
Donut chart showing breakdown of students by risk level.

```tsx
<RiskDistribution
  stats={dashboardStats}
  onRunBatch={handleBatchPredict}
  isRunningBatch={isPending}
/>
```

#### 3. ShapFactors
Horizontal bar chart showing feature contributions to risk.

```tsx
<ShapFactors factors={[
  { feature: "avg_score", impact: 0.15, direction: "positive" },
  { feature: "completion_rate", impact: 0.12, direction: "negative" }
]} />
// Red bars = increases risk, Green bars = decreases risk
```

#### 4. StudentLookup
Search box with autocomplete for finding students.

```tsx
<StudentLookup />
// Searches by student_id
// Shows RiskCircle + ShapFactors on selection
```

### State Management

**React Query** handles server state:
- Automatic caching
- Background refetching
- Optimistic updates
- Query invalidation after mutations

**Zustand** handles client state:
- Selected tab
- UI preferences
- Temporary form state

### API Hooks

| Hook | Purpose |
|------|---------|
| `useDashboardStats()` | Fetch dashboard statistics |
| `useStudents(filters)` | Fetch paginated student list |
| `useStudent(id)` | Fetch single student |
| `useStudentPredict(id)` | Get prediction for student |
| `usePrediction()` | Make ad-hoc prediction |
| `useBatchPrediction()` | Run predictions on all students |
| `useIntervention()` | Generate interventions |
| `useChat()` | Send chat messages |
| `useUpload()` | Upload CSV files |

---

## Machine Learning Model

### Model: XGBoost Classifier

**Input Features (11 total):**
| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| num_of_prev_attempts | int | 0-10 | Previous module attempts |
| studied_credits | int | 0-360 | Credits enrolled |
| avg_score | float | 0-100 | Average assessment score |
| total_clicks | int | 0+ | VLE platform interactions |
| completion_rate | float | 0-1 | Assessment completion ratio |
| module_BBB | binary | 0/1 | Enrolled in module BBB |
| module_CCC | binary | 0/1 | Enrolled in module CCC |
| module_DDD | binary | 0/1 | Enrolled in module DDD |
| module_EEE | binary | 0/1 | Enrolled in module EEE |
| module_FFF | binary | 0/1 | Enrolled in module FFF |
| module_GGG | binary | 0/1 | Enrolled in module GGG |

**Output:**
```json
{
  "risk_score": 75,           // 0-100 percentage
  "risk_probability": 0.75,   // 0-1 raw probability
  "risk_level": "high",       // low/medium/high
  "prediction": 1             // 0=not at risk, 1=at risk
}
```

### SHAP Explanations

SHAP (SHapley Additive exPlanations) shows how each feature contributes to the prediction.

**Example Output:**
```json
{
  "shap_factors": [
    {"feature": "avg_score", "value": 35, "impact": 0.25, "direction": "positive"},
    {"feature": "completion_rate", "value": 0.3, "impact": 0.18, "direction": "positive"},
    {"feature": "total_clicks", "value": 150, "impact": 0.12, "direction": "positive"}
  ]
}
```

- **direction: positive** = increases dropout risk
- **direction: negative** = decreases dropout risk
- **impact** = magnitude of effect (higher = more important)

### Model Files
```
models/
├── xgboost_final.joblib    # Trained XGBoost model
├── scaler.joblib           # Feature scaler
└── feature_list.csv        # Feature names
```

---

## LLM Integration

### Ollama Setup

The app uses Ollama to run local LLMs for intervention personalization.

**Default Model:** `deepseek-r1:1.5b`

**Installation:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull deepseek-r1:1.5b

# Start server
ollama serve
```

### Prompts

#### System Prompt (Intervention)
```
You are an academic advisor at Cambrian College. Be empathetic,
specific, and action-oriented. Keep responses brief.
```

#### Intervention Enhancement Template
```
Student metrics: Risk {risk_score}% ({risk_level}),
Completion {completion_rate:.0%}, Avg Score {avg_score:.0f}%,
Engagement {total_clicks} clicks.

Current recommendations:
{rule_recommendations}

Respond in this exact format:
SUMMARY: [1-2 sentence personalized assessment]

ENHANCED:
1. [Enhanced first intervention - 1 sentence]
2. [Enhanced second intervention - 1 sentence]
```

#### Chat System Prompt
```
You are an AI assistant for the Cambrian College Student Success Platform.
You help advisors understand student risk data and intervention strategies.

Keep responses concise (2-4 sentences). Be helpful and practical.
```

### Graceful Degradation

If Ollama is unavailable:
1. `is_available()` returns false
2. Intervention endpoint uses rules-only
3. Chat endpoint returns "AI assistant unavailable" message
4. App continues to function without LLM features

---

## API Reference

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints

#### Health Check
```
GET /health
Response: { "status": "healthy", "model_loaded": true }
```

#### Dashboard
```
GET /dashboard/stats
Response: {
  "total_students": 30,
  "high_risk_count": 5,
  "medium_risk_count": 10,
  "low_risk_count": 15,
  "avg_dropout_probability": 0.35,
  "model_accuracy": 0.91
}
```

#### Students
```
GET /students?page=1&per_page=10&risk_level=high
Response: {
  "students": [...],
  "total": 100,
  "page": 1,
  "per_page": 10,
  "total_pages": 10
}

GET /students/{id}
Response: { "student": {...} }

GET /students/{id}/predict
Response: {
  "dropout_probability": 0.72,
  "risk_level": "high",
  "confidence": 0.85,
  "shap_factors": [...]
}
```

#### Prediction
```
POST /predict
Body: { feature values }
Response: { risk_score, risk_probability, risk_level, prediction }

POST /predict/batch
Response: {
  "processed": 30,
  "high_risk": 5,
  "medium_risk": 10,
  "low_risk": 15
}
```

#### Intervention
```
POST /intervention
Body: {
  "risk_score": 75,
  "completion_rate": 0.3,
  "avg_score": 45,
  "total_clicks": 150,
  "use_llm": true
}
Response: {
  "risk_level": "high",
  "summary": "...",
  "interventions": [...],
  "llm_enhanced": true
}
```

#### Chat
```
POST /chat
Body: { "message": "How should I help a high-risk student?", "context": "..." }
Response: { "response": "...", "llm_available": true }

GET /chat/status
Response: { "available": true, "message": "AI assistant is ready" }
```

#### Upload
```
POST /upload/csv
Body: FormData with file
Response: { "message": "...", "rows_processed": 30, "filename": "..." }

GET /upload/status
Response: { "has_data": true, "row_count": 30, "last_upload": "..." }

DELETE /upload/data
Response: { "success": true, "message": "Data cleared" }
```

---

## Data Storage

### In-Memory Storage

The app uses in-memory storage (pandas DataFrame) for student data.

**Why In-Memory?**
- Fast queries for small-medium datasets
- No database setup required
- Suitable for demo/POC purposes

**Limitations:**
- Data lost on server restart
- Not suitable for large datasets (>100k records)
- No persistence

**For Production:**
Consider adding PostgreSQL or MongoDB for persistent storage.

### File Storage

```
data/
├── processed/
│   └── student_features.csv    # Default dataset (not auto-loaded)
├── uploads/
│   └── uploaded_data.csv       # User uploaded data
└── sample_students.csv         # Sample test data
```

---

## Configuration

### Environment Variables

Create `.env` file in project root:

```env
# API Settings
API_TITLE=Student Success Platform API
API_VERSION=1.0.0
API_PREFIX=/api/v1
DEBUG=false

# LLM Settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:1.5b
LLM_TIMEOUT=120.0
LLM_ENABLED=true
```

### Vite Proxy

Frontend proxy configuration (`vite.config.ts`):

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
    },
  },
}
```

This maps:
- Frontend `/api/*` → Backend `/api/v1/*`

---

## Running the Application

### Development

**Terminal 1 - Backend:**
```bash
cd ai-student-success
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn src.api.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd ai-student-success/frontend-react
npm run dev
```

**Terminal 3 - Ollama (optional):**
```bash
ollama serve
```

### URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Ollama: http://localhost:11434

### Testing the App

1. **Upload Data:** Go to Data tab, upload `data/sample_students.csv`
2. **View Dashboard:** Go to Prediction tab, see risk distribution
3. **Search Student:** Use Student Lookup to find a student
4. **Generate Interventions:** Go to Intervention tab
5. **Chat:** Go to Chat tab to ask the AI assistant questions

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 503 errors | Data not loaded - upload CSV first |
| 404 on API calls | Check backend is running on port 8000 |
| Empty LLM responses | Check `ollama list` for model, increase timeout |
| CORS errors | Ensure Vite proxy is configured correctly |
| Model not found | Check `models/` folder has joblib files |
| Upload fails | Check CSV has required columns |

---

## Future Enhancements

1. **Database Integration** - PostgreSQL for persistent storage
2. **Authentication** - User login and role-based access
3. **Email Notifications** - Alert advisors about high-risk students
4. **Batch Import** - Schedule automatic data imports
5. **Reporting** - Export PDF reports
6. **Mobile App** - React Native companion app
