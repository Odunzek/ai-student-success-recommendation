# Student Success Platform

AI-powered student risk prediction and intervention recommendation system.

## Features

- **Risk Prediction**: XGBoost-based model to predict student dropout risk
- **Intervention Generation**: Rule-based and LLM-enhanced intervention recommendations
- **Modern Dashboard**: React frontend with Framer Motion animations and dark mode
- **Data Upload**: Support for CSV and ZIP file uploads with automatic format detection

## Architecture

```
├── src/                    # Python FastAPI backend
│   ├── api/               # REST API routes
│   ├── models/            # ML prediction models
│   ├── services/          # Business logic
│   └── etl/               # Data processing pipeline
├── frontend-react/        # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Tab pages
│   │   ├── api/           # API hooks
│   │   └── store/         # Zustand state
└── models/                # Trained ML models
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key or Ollama (optional, for LLM features)

### Backend Setup

```bash
cd ai-student-success
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend-react
npm install
npm run dev
```

### LLM Setup (Optional)

The platform supports two LLM providers for AI-enhanced interventions and chat:

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

Without an LLM provider configured, the system uses rule-based interventions only.

## Configuration

Environment variables can be set in `.env` file:

```env
# API Settings
DEBUG=false
API_PREFIX=/api/v1

# LLM Provider: "openai" or "ollama"
LLM_PROVIDER=openai
LLM_ENABLED=true
LLM_TIMEOUT=30.0

# OpenAI Settings (required if LLM_PROVIDER=openai)
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Ollama Settings (used if LLM_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:1.5b

# Risk Classification Thresholds
RISK_THRESHOLD_HIGH=70
RISK_THRESHOLD_MEDIUM=40
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/dashboard/stats` | GET | Dashboard statistics |
| `/api/v1/predict` | POST | Single prediction |
| `/api/v1/predict/batch` | POST | Batch predictions |
| `/api/v1/students` | GET | List students |
| `/api/v1/students/{id}/predict` | GET | Predict for student |
| `/api/v1/intervention` | POST | Generate interventions |
| `/api/v1/upload/csv` | POST | Upload data file |
| `/api/v1/chat` | POST | LLM chat with session support |
| `/api/v1/chat/status` | GET | Check LLM availability |
| `/api/v1/chat/session` | POST | Create new chat session |
| `/api/v1/chat/history/{id}` | GET | Get session history |
| `/api/v1/chat/history/{id}` | DELETE | Clear session history |
| `/api/v1/chat/stats` | GET | Chat store statistics |

## Recent Updates

### Bug Fixes (v1.1)

1. **Fixed silent failure in risk classification** - Prediction errors now logged and tracked instead of silently counting as "low risk"
2. **Fixed batch prediction error handling** - Backend returns error count, frontend displays warnings
3. **Fixed intervention result type** - Changed from `generated_by` to `llm_enhanced` boolean
4. **Fixed API query guards** - StudentModal and StudentLookup now properly guard against null/empty IDs
5. **Added configurable risk thresholds** - Risk levels (high/medium/low) now configurable via environment
6. **Added model accuracy configuration** - No longer hardcoded, reads from config
7. **Added CSV default column warnings** - Unknown CSV formats now report which columns were auto-filled
8. **Added staleTime to dashboard queries** - Prevents unnecessary API calls (5 min cache)
9. **Added mock data indicator** - Risk trend chart shows "Sample Data" badge when using fallback data
10. **Added file MIME type validation** - Dropzone validates both extension and MIME type

### Chat System (v1.2)

1. **Session-based conversation history** - Messages stored in-memory per session with 24-hour timeout
2. **Rate limiting** - 20 requests per minute per session to prevent abuse
3. **Prompt injection detection** - Detects and flags suspicious input patterns
4. **Input sanitization** - Removes control characters and normalizes whitespace
5. **Enhanced system prompt** - Comprehensive guardrails for academic-only responses
6. **Conversation context** - LLM receives last 6 messages for coherent multi-turn conversations
7. **Session persistence** - Frontend stores session ID in localStorage for continuity

### UI Enhancements

- Modern dashboard with Framer Motion animations
- Dark mode support with system preference detection
- Glass morphism effects
- Animated charts and statistics
- Toast notifications
- Chat session management with "New Conversation" button

## Development

### Running Tests

```bash
# Backend
pytest tests/

# Frontend
cd frontend-react
npm test
```

### Building for Production

```bash
# Frontend
cd frontend-react
npm run build
```

## License

MIT
