# Week 2 Implementation Plan
**Date**: Feb 3-9, 2026
**Goal**: Build FastAPI backend + hybrid intervention system

---

## Overview

We're moving from notebook exploration to production code. By the end of Week 2, you'll have a working API that:
1. Predicts student risk scores
2. Generates personalized intervention recommendations
3. Provides dashboard statistics

---

## File Structure

```
src/
├── __init__.py
├── config.py                    # Settings (paths, LLM config)
│
├── api/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entry point
│   ├── routes/
│   │   ├── predict.py           # POST /api/v1/predict
│   │   ├── intervention.py      # POST /api/v1/intervention
│   │   ├── students.py          # GET /api/v1/students/{id}
│   │   └── dashboard.py         # GET /api/v1/dashboard/stats
│   └── schemas/
│       ├── student.py           # Input validation
│       ├── prediction.py        # Prediction response
│       └── intervention.py      # Intervention response
│
├── models/
│   ├── predictor.py             # Load XGBoost, make predictions
│   └── explainer.py             # SHAP explanations
│
├── agent/
│   ├── rules.py                 # Rule-based policy engine
│   ├── llm_client.py            # Ollama/DeepSeek client
│   ├── prompts.py               # LLM prompt templates
│   └── hybrid.py                # Rules + LLM orchestration
│
└── etl/
    └── loader.py                # Load student CSV data
```

---

## Phase 1: Minimal /predict Endpoint

**What we're building**: A working API endpoint that takes student data and returns a risk score.

**Files to create**:
- `src/config.py` - Central configuration (model paths, API settings)
- `src/models/predictor.py` - Loads the trained XGBoost model and makes predictions
- `src/api/schemas/student.py` - Pydantic model validating the 11 input features
- `src/api/schemas/prediction.py` - Pydantic model for the response format
- `src/api/main.py` - FastAPI app with startup/shutdown lifecycle
- `src/api/routes/predict.py` - The /predict endpoint handler

**How it works**:
1. On startup, FastAPI loads the XGBoost model and scaler into memory
2. Client sends POST request with student features (clicks, scores, etc.)
3. Predictor scales the features and runs them through the model
4. Returns risk score (0-100), risk level (low/medium/high/critical), and is_at_risk flag

**Checkpoint**: You can run this and get a prediction:
```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"avg_score": 45, "completion_rate": 0.35, "total_clicks": 150}'
```

---

## Phase 2: Minimal /intervention Endpoint

**What we're building**: A rule-based system that maps risk factors to institutional resources.

**Files to create**:
- `src/agent/rules.py` - Rule engine with Cambrian College resources
- `src/api/schemas/intervention.py` - Request/response validation
- `src/api/routes/intervention.py` - The /intervention endpoint handler

**How it works**:
1. Client sends risk score + student metrics
2. Rule engine evaluates conditions:
   - Risk score >= 75? → Urgent advisor meeting
   - Completion rate < 50%? → Academic success center
   - Avg score < 50? → Tutoring services
   - Low engagement? → Study groups
3. Returns prioritized list of interventions with specific resources

**Example rules**:
```
IF risk_score >= 75 THEN recommend "Urgent: Advisor Meeting" (priority 1)
IF completion_rate < 0.5 THEN recommend "Assignment Support" (priority 2)
IF avg_score < 50 THEN recommend "Subject Tutoring" (priority 2)
IF total_clicks < 500 THEN recommend "Join Study Group" (priority 3)
```

**Checkpoint**: Rules work without any LLM:
```bash
curl -X POST http://localhost:8000/api/v1/intervention \
  -H "Content-Type: application/json" \
  -d '{"risk_score": 85, "completion_rate": 0.35, "avg_score": 45, "total_clicks": 150}'
```

---

## Phase 3: Add LLM Personalization Layer

**What we're building**: An optional enhancement that uses DeepSeek-R1 to personalize the rule-based recommendations.

**Files to create**:
- `src/agent/prompts.py` - System prompt and personalization template
- `src/agent/llm_client.py` - Async client for Ollama API
- `src/agent/hybrid.py` - Orchestrates rules + LLM together

**How it works**:
1. Rule engine generates base recommendations (Layer 1 - always runs)
2. If Ollama is available, send student context + rules to LLM (Layer 2)
3. LLM adds personalization:
   - WHY this matters for the specific student
   - Concrete FIRST STEP they can take today
   - Encouragement based on any positive indicators
4. If LLM fails or is unavailable, return rule-based recommendations (graceful degradation)

**Why hybrid?**:
- Rules ensure evidence-based, consistent interventions
- LLM adds natural language and personalization
- System works even if Ollama is down

**Checkpoint**: With Ollama running:
```bash
# Start Ollama first
ollama serve

# Test with LLM
curl -X POST http://localhost:8000/api/v1/intervention \
  -H "Content-Type: application/json" \
  -d '{"risk_score": 85, "completion_rate": 0.35, "avg_score": 45, "total_clicks": 150, "use_llm": true}'
```

---

## Phase 4: Polish & Remaining Endpoints

**What we're building**: SHAP explanations, data loading, and dashboard endpoints.

**Files to create**:
- `src/models/explainer.py` - SHAP TreeExplainer wrapper
- `src/etl/loader.py` - Load students from CSV
- `src/api/routes/students.py` - Student list and detail endpoints
- `src/api/routes/dashboard.py` - Statistics endpoint

**SHAP Explainer**:
- Shows WHY a student was flagged (which features contributed most)
- Returns top 3 risk factors with impact values
- Example: "completion_rate: 0.35 (high impact) - Low assessment completion"

**Data Loader**:
- Loads `student_features_encoded.csv` into memory
- Provides methods: `get_all_students()`, `get_student(id)`, `get_stats()`

**Dashboard Stats**:
- Total students, at-risk count, at-risk percentage
- Average completion rate, average score
- Risk distribution (low/medium/high/critical)

**Checkpoint**: Full API working:
```bash
# Get dashboard stats
curl http://localhost:8000/api/v1/dashboard/stats

# List at-risk students
curl http://localhost:8000/api/v1/students?at_risk_only=true

# Get specific student
curl http://localhost:8000/api/v1/students/STU00001
```

---

## Dependencies to Install

```bash
pip install fastapi uvicorn[standard] pydantic pydantic-settings
pip install httpx python-dotenv
# Already have: joblib pandas numpy shap xgboost scikit-learn
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Graceful degradation | Rules always work; LLM is optional enhancement |
| Singleton pattern | Load model once on startup, reuse for all requests |
| Async LLM calls | Don't block the API while waiting for Ollama |
| Pydantic validation | Auto-generated docs + clear error messages |
| Feature scaling | First 5 features scaled; module indicators (0/1) pass through |

---

## Testing Without LLM

You can develop and test Phases 1-2 without Ollama running. Use `use_llm=false` in requests:

```bash
curl -X POST http://localhost:8000/api/v1/intervention \
  -d '{"risk_score": 85, ..., "use_llm": false}'
```

The response will include `"llm_enhanced": false` to indicate rules-only mode.

---

## Success Criteria

- [ ] `/predict` returns risk score in <100ms
- [ ] `/intervention` returns recommendations (with or without LLM)
- [ ] `/dashboard/stats` shows aggregate metrics
- [ ] Swagger docs available at `/docs`
- [ ] System works when Ollama is not running
