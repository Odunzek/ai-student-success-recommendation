# Student Success Platform - Technical Documentation

**Version:** 1.0.0
**Last Updated:** February 2025
**Purpose:** Team Handoff Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Backend (Python/FastAPI)](#3-backend-pythonfastapi)
4. [Frontend (React/TypeScript)](#4-frontend-reacttypescript)
5. [Machine Learning Model](#5-machine-learning-model)
6. [LLM Integration](#6-llm-integration)
7. [Setup & Running Instructions](#7-setup--running-instructions)
8. [Key Technical Decisions](#8-key-technical-decisions)

---

## 1. Executive Summary

### What the App Does

The **Student Success Platform** is an AI-powered web application designed to help academic advisors identify at-risk students and generate personalized intervention recommendations. It predicts student dropout probability using machine learning and provides actionable support strategies.

### Key Features

- **Dashboard**: Overview of student population with risk distribution and alerts
- **Risk Assessment**: Individual student dropout probability predictions with SHAP explanations
- **Student Management**: Browse, search, and filter student records
- **Intervention Generator**: AI-enhanced personalized intervention recommendations
- **AI Chat Interface**: Conversational assistant for advisor support questions
- **Data Upload**: Upload OULAD-format student data (single file or multi-file)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, TailwindCSS, React Query |
| Backend | Python 3.11+, FastAPI, Pydantic |
| ML Model | XGBoost, SHAP (explainability) |
| LLM | OpenAI GPT-4o-mini (primary), Ollama (fallback) |
| State Management | Zustand (frontend), In-memory (backend) |

---

## 2. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │Dashboard│ │  Risk   │ │Students │ │Interven-│ │  Chat   │   │
│  │  Page   │ │Assessment│ │  Tab   │ │  tions  │ │Interface│   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │           │           │           │           │         │
│       └───────────┴───────────┴───────────┴───────────┘         │
│                              │                                   │
│                    React Query (API Hooks)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/REST
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes                             │   │
│  │  /dashboard  /students  /predict  /intervention  /chat    │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────┐  ┌────────┴────────┐  ┌──────────────────┐   │
│  │  ML Model    │  │  Hybrid Engine  │  │   LLM Client     │   │
│  │  (XGBoost)   │  │  (Rules + LLM)  │  │ (OpenAI/Ollama)  │   │
│  └──────────────┘  └─────────────────┘  └──────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │              Data Layer (ETL + Loader)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request** → Frontend sends API request via React Query
2. **API Processing** → FastAPI routes handle request, validate with Pydantic
3. **ML Prediction** → XGBoost model predicts dropout probability
4. **SHAP Explanation** → Model generates feature importance values
5. **LLM Enhancement** → OpenAI personalizes intervention recommendations
6. **Response** → JSON response rendered in React components

---

## 3. Backend (Python/FastAPI)

### Project Structure

```
src/
├── api/
│   ├── main.py              # FastAPI app entry point, CORS, routers
│   ├── routes/
│   │   ├── chat.py          # Chat endpoint with LLM integration
│   │   ├── dashboard.py     # Dashboard statistics
│   │   ├── intervention.py  # Intervention generation
│   │   ├── predict.py       # ML prediction endpoint
│   │   ├── settings.py      # LLM configuration endpoints
│   │   ├── students.py      # Student CRUD operations
│   │   └── upload.py        # Data upload handling
│   └── schemas/
│       ├── chat.py          # Chat request/response models
│       ├── intervention.py  # Intervention models
│       ├── prediction.py    # Prediction models
│       └── student.py       # Student data models
├── agent/
│   ├── hybrid.py            # Hybrid intervention engine (rules + LLM)
│   ├── llm_client.py        # OpenAI and Ollama client implementations
│   ├── prompts.py           # System prompts and templates
│   └── rules.py             # Rule-based intervention logic
├── etl/
│   ├── loader.py            # Data loading and student lookup
│   └── pipeline.py          # ETL pipeline for OULAD data
├── models/
│   ├── predictor.py         # XGBoost prediction wrapper
│   └── explainer.py         # SHAP explainer integration
├── services/
│   └── chat_store.py        # In-memory chat session storage
└── config.py                # Application configuration (Pydantic Settings)
```

### Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/dashboard/stats` | GET | Dashboard statistics and risk distribution |
| `/api/v1/students` | GET | Paginated student list with filtering |
| `/api/v1/students/{id}` | GET | Single student details |
| `/api/v1/students/{id}/predict` | GET | Predict dropout risk for a student |
| `/api/v1/predict` | POST | Predict risk from raw features |
| `/api/v1/intervention` | POST | Generate intervention recommendations |
| `/api/v1/chat` | POST | Chat with AI assistant |
| `/api/v1/chat/status` | GET | Check LLM availability |
| `/api/v1/settings/llm` | GET | Get current LLM configuration |
| `/api/v1/settings/llm/models` | GET | List available models |
| `/api/v1/upload/student-data` | POST | Upload student CSV data |
| `/api/v1/upload/oulad` | POST | Upload OULAD multi-file data |

### Key Files Explained

#### `src/api/main.py`
- Creates FastAPI application instance
- Configures CORS for frontend communication
- Registers all API routers
- Sets up OpenAPI documentation

#### `src/config.py`
- Pydantic Settings class for environment configuration
- Loads from `.env` file automatically
- Configures: LLM provider, model paths, risk thresholds

#### `src/models/predictor.py`
- Loads trained XGBoost model from joblib file
- Handles feature preprocessing and scaling
- Returns probability and risk classification

#### `src/agent/hybrid.py`
- **HybridEngine**: Combines rule-based and LLM-based interventions
- Layer 1 (Rules): Deterministic recommendations based on metrics
- Layer 2 (LLM): Personalized enhancement if available
- Graceful degradation: Falls back to rules if LLM unavailable

#### `src/agent/llm_client.py`
- **OpenAIClient**: Async client for OpenAI API
- **OllamaClient**: Async client for local Ollama
- **get_llm_client()**: Factory function that returns appropriate client

#### `src/etl/loader.py`
- Loads student data from CSV
- Provides student lookup by ID
- Handles data caching for performance

---

## 4. Frontend (React/TypeScript)

### Project Structure

```
frontend-react/src/
├── api/
│   ├── client.ts            # Axios client configuration
│   └── hooks/
│       ├── useChat.ts       # Chat API hooks
│       ├── useDashboard.ts  # Dashboard data hooks
│       ├── useIntervention.ts # Intervention hooks
│       ├── useSettings.ts   # LLM settings hooks
│       ├── useStudents.ts   # Student data hooks
│       └── useUpload.ts     # File upload hooks
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx  # Full chat interface
│   │   ├── ChatMessage.tsx    # Individual message component
│   │   └── ChatWidget.tsx     # Floating chat widget
│   ├── dashboard/
│   │   ├── AlertsTable.tsx    # High-risk student alerts
│   │   ├── RiskTrendChart.tsx # Risk distribution chart
│   │   └── StatCard.tsx       # Statistics card component
│   ├── intervention/
│   │   ├── InterventionCard.tsx # Intervention display card
│   │   └── InterventionForm.tsx # Input form for generation
│   ├── layout/
│   │   ├── AppLayout.tsx      # Main app layout wrapper
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   └── TopHeader.tsx      # Top navigation header
│   ├── prediction/
│   │   ├── RiskCircle.tsx     # Circular risk visualization
│   │   ├── RiskDistribution.tsx # Risk breakdown chart
│   │   ├── ShapFactors.tsx    # SHAP factor display
│   │   └── StudentLookup.tsx  # Student search component
│   ├── students/
│   │   ├── StudentModal.tsx   # Student detail modal
│   │   └── StudentTable.tsx   # Student list table
│   ├── ui/                    # Reusable UI components
│   │   ├── Alert.tsx, Badge.tsx, Button.tsx, Card.tsx
│   │   ├── Input.tsx, Modal.tsx, Select.tsx, Skeleton.tsx
│   │   ├── Spinner.tsx, Toast.tsx, Toggle.tsx
│   └── upload/
│       ├── DatasetInfo.tsx    # Current dataset information
│       ├── Dropzone.tsx       # File drag-and-drop zone
│       └── OuladUploader.tsx  # Multi-file OULAD upload
├── pages/
│   ├── ChatTab.tsx            # AI Chat page
│   ├── DashboardPage.tsx      # Main dashboard
│   ├── DataTab.tsx            # Data upload page
│   ├── InterventionTab.tsx    # Intervention generator
│   ├── PredictionTab.tsx      # Risk assessment page
│   └── StudentsTab.tsx        # Student management
├── store/
│   └── useAppStore.ts         # Zustand global state store
├── App.tsx                    # Main app component with routing
└── main.tsx                   # React entry point
```

### State Management

**Zustand Store** (`store/useAppStore.ts`):
- Persists UI state across tab switches
- Stores: selected student, search queries, intervention results
- Lightweight alternative to Redux

**React Query** (`api/hooks/`):
- Server state management for API calls
- Automatic caching and invalidation
- Background refetching

### Key Components

#### `pages/InterventionTab.tsx`
- Student search and selection
- Risk prediction display with SHAP factors
- AI-enhanced intervention generation
- Model selector dropdown (OpenAI/Ollama)

#### `components/chat/ChatInterface.tsx`
- Full conversational chat UI
- Message history display
- Session management
- LLM status indicator

#### `components/prediction/RiskCircle.tsx`
- Circular progress visualization
- Color-coded risk levels (green/amber/red)
- Animated transitions

---

## 5. Machine Learning Model

### Model Overview

- **Algorithm**: XGBoost Classifier
- **Task**: Binary classification (dropout vs. completion)
- **Training Data**: OULAD (Open University Learning Analytics Dataset)

### Features Used

| Feature | Description | Type |
|---------|-------------|------|
| `num_of_prev_attempts` | Previous module attempts | Numeric |
| `studied_credits` | Total credits enrolled | Numeric |
| `avg_score` | Average assessment score | Numeric |
| `total_clicks` | VLE engagement (clicks) | Numeric |
| `completion_rate` | Assessment completion rate | Numeric |
| `module_*` | One-hot encoded module codes | Categorical |

### SHAP Explainability

- **SHAP (SHapley Additive exPlanations)** provides feature importance
- Shows which factors contribute most to risk prediction
- Displayed as horizontal bar chart in the UI
- Values normalized to percentages for user-friendliness

### Risk Classification

| Risk Level | Probability Range | Color |
|------------|------------------|-------|
| Low | 0% - 39% | Green |
| Medium | 40% - 69% | Amber |
| High | 70% - 100% | Red |

Thresholds are configurable via `RISK_THRESHOLD_HIGH` and `RISK_THRESHOLD_MEDIUM` environment variables.

---

## 6. LLM Integration

### Provider Architecture

The system supports two LLM providers with automatic fallback:

```python
def get_llm_client():
    if settings.llm_provider == "openai" and settings.openai_api_key:
        return OpenAIClient()
    return OllamaClient()
```

### OpenAI Configuration

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

**Supported Models**: gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo

### Ollama Configuration (Local/Free Alternative)

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:1.5b
```

### Chat System Prompt

The AI assistant is configured as a helpful colleague for academic advisors with:
- **Role**: Help understand risk scores, suggest interventions
- **Personality**: Friendly, warm, conversational
- **Boundaries**: No code generation, no medical/legal advice, no PII
- **Off-topic handling**: Polite redirection to student support topics

### Intervention Personalization

The Hybrid Engine uses a two-layer approach:

1. **Layer 1 (Rules)**: Deterministic recommendations based on metrics
   - Low engagement → VLE activity intervention
   - Low scores → Academic tutoring
   - Previous failures → Mentoring program

2. **Layer 2 (LLM)**: Personalized enhancement
   - Adds "Why this matters for this student"
   - Specific action steps
   - Owner assignment (advisor/student/tutor)
   - Timeline and success metrics

### Security Measures

- **Prompt injection detection**: Regex patterns for common attack vectors
- **Input sanitization**: Control character removal, whitespace normalization
- **Message length limits**: 8000 characters max input
- **Output limits**: 3000 tokens max response

---

## 7. Setup & Running Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key (or Ollama installed locally)

### Backend Setup

```bash
# Navigate to project
cd ai-student-success

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your OpenAI API key

# Run the server
python -m uvicorn src.api.main:app --reload
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend-react

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Environment Variables

```env
# LLM Configuration
LLM_PROVIDER=openai              # "openai" or "ollama"
OPENAI_API_KEY=sk-your-key       # Required for OpenAI
OPENAI_MODEL=gpt-4o-mini         # Model to use
LLM_TIMEOUT=30.0                 # Request timeout in seconds
LLM_ENABLED=true                 # Enable/disable LLM features

# Ollama (if using local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:1.5b

# Risk Thresholds
RISK_THRESHOLD_HIGH=70
RISK_THRESHOLD_MEDIUM=40
```

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure backend is running on port 8000 |
| LLM offline | Check API key in .env, verify OpenAI account has credits |
| Model not found | Ensure model files exist in `/models` directory |
| Upload fails | Check file format matches OULAD schema |

---

## 8. Key Technical Decisions

### Why FastAPI?

- **Async support**: Non-blocking I/O for LLM calls
- **Auto documentation**: OpenAPI/Swagger UI generated automatically
- **Pydantic integration**: Type validation and serialization
- **Performance**: One of the fastest Python web frameworks

### Why React + TypeScript?

- **Type safety**: Catches errors at compile time
- **Component reuse**: Modular UI architecture
- **React Query**: Excellent server state management
- **Ecosystem**: Large community and library support

### Why XGBoost?

- **Tabular data performance**: Best-in-class for structured data
- **SHAP compatibility**: Easy to explain predictions
- **Fast inference**: Suitable for real-time predictions
- **Proven reliability**: Widely used in production systems

### Why Hybrid Intervention System?

- **Reliability**: Rules always work, even if LLM fails
- **Personalization**: LLM adds human-like context
- **Graceful degradation**: System never fully breaks
- **Cost control**: Can disable LLM if needed

### Why OpenAI as Default?

- **Reliability**: High uptime, consistent quality
- **gpt-4o-mini**: Good balance of cost and capability
- **Easy setup**: Just need an API key
- **Ollama fallback**: Free option for development/testing

### Why Zustand over Redux?

- **Simplicity**: Less boilerplate code
- **Performance**: No unnecessary re-renders
- **Size**: Tiny bundle impact (~1KB)
- **TypeScript**: Excellent type inference

---

## Appendix: File Quick Reference

### Backend Key Files

| File | Purpose |
|------|---------|
| `src/api/main.py` | FastAPI app entry |
| `src/config.py` | Environment configuration |
| `src/models/predictor.py` | ML prediction logic |
| `src/agent/llm_client.py` | OpenAI/Ollama clients |
| `src/agent/hybrid.py` | Intervention engine |
| `src/agent/prompts.py` | LLM prompts |
| `src/etl/loader.py` | Data loading |

### Frontend Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app + routing |
| `src/store/useAppStore.ts` | Global state |
| `src/api/hooks/*.ts` | API integration |
| `src/pages/*.tsx` | Page components |
| `src/components/ui/*.tsx` | Reusable UI |

---

*Document generated for team handoff. For questions, refer to the codebase or contact the development team.*
