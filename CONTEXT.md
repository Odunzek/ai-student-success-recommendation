# AI-Powered Student Success Platform - Project Context

## Project Overview
**Course**: AIE1014 - AI Applied Project @ Cambrian College  
**Timeline**: 4 weeks (Jan 27 - Feb 24, 2026)  
**Developer**: Solo project (Kachy)  
**Goal**: Build compelling proposal + working prototype that demonstrates AI-powered student intervention system

## Deliverables
1. **Technical Proposal** (12-15 pages) - Professional document for Cambrian stakeholders
2. **Working Prototype** - Functional demo of prediction + intervention system
3. **Live Demo** (15 min) - Presentation showing system capabilities

## Core Innovation
**Beyond Prediction**: System doesn't just flag at-risk students, it provides actionable intervention recommendations using a hybrid AI approach (rule-based + LLM agent).

## Architecture Decisions

### Data Layer
- **Dataset**: Open University Learning Analytics Dataset (OULAD)
- **Approach**: ETL pipeline to merge relational CSV files
- **Features**: Attendance, assessment scores, engagement clicks
- **Target**: Student success (Pass/Fail/Withdrawn)

### ML Model
- **Algorithm**: XGBoost (tree-based, handles tabular data well)
- **Explainability**: SHAP for feature attribution
- **Goal**: >75% accuracy with interpretable predictions

### Agentic Intervention System (Hybrid Approach)
**Layer 1 - Rule-Based Foundation**:
- Deterministic policy matching
- Maps risk factors → institutional resources
- Guaranteed baseline recommendations

**Layer 2 - LLM Enhancement**:
- Model: Llama 3.1 70B (local, via Ollama)
- Purpose: Personalize interventions, draft outreach, prioritize actions
- Fallback: If LLM fails, rules still work

**Why Hybrid?**: Reliability + Intelligence. Rules ensure consistency, LLM adds personalization.

### Tech Stack

**Backend**:
- Python 3.10+
- FastAPI (REST API)
- Pandas (data processing)
- XGBoost + SHAP (ML)
- Ollama + Llama 3.1 70B (LLM agent)

**Frontend**:
- React + TypeScript
- Tailwind CSS (styling)
- Recharts (visualizations)
- Vite (build tool)

**Database** (Prototype):
- CSV files / In-memory (simplicity for demo)
- Proposal mentions PostgreSQL for production

**Development**:
- Git/GitHub (version control)
- VS Code (IDE)
- Jupyter notebooks (exploration)

## Hardware Advantage
**Machine**: ASUS Zephyrus G16 (RTX 4070, 32GB RAM, Intel Ultra 9)  
**Capability**: Can run Llama 3.1 70B locally - gives competitive edge

## Timeline

### Week 1: Data + ML Core (Jan 27 - Feb 2)
- ETL pipeline (join OULAD tables)
- Feature engineering
- XGBoost training + SHAP
- Rule-based policy engine
- Proposal: Problem statement section

### Week 2: Agent + Backend (Feb 3 - 9)
- LLM agent setup (Llama 3.1 70B)
- FastAPI endpoints
- Integration (rules + LLM)
- Proposal: Technical architecture section

### Week 3: Frontend (Feb 10 - 16)
- React dashboard (student list, detail views, interventions)
- API integration
- SHAP visualizations
- Proposal: Intervention framework section

### Week 4: Polish + Finalize (Feb 17 - 24)
- End-to-end testing
- UI polish
- Proposal completion (TIDES, executive summary)
- Demo preparation

## Key Design Principles

**Privacy by Design**:
- Training data can be anonymized (learns patterns, not people)
- Inference maintains identity (advisors need to know who to help)
- Role-based access control

**Production Thinking**:
- Proposal shows scalable architecture
- Prototype demonstrates proof-of-concept
- Document realistic limitations

**Learning-Focused Development**:
- Understand concepts, not just copy-paste
- Build iteratively with AI assistance
- Code reviews and explanations at each step

## Project Structure
```
student-success-platform/
├── data/
│   ├── raw/              # OULAD CSV files
│   └── processed/        # Cleaned datasets
├── notebooks/            # Jupyter exploration
├── src/
│   ├── etl/             # Data pipeline
│   ├── models/          # ML training
│   ├── api/             # FastAPI backend
│   └── agent/           # LLM agent logic
├── frontend/            # React app
├── docs/                # Proposal + diagrams
├── CONTEXT.md           # This file
└── README.md
```

## Current Status
**Phase**: Project setup  
**Next**: Data exploration and ETL pipeline development

## API Endpoints (Planned)
- `POST /api/predict` - Get risk score + SHAP explanation
- `POST /api/interventions` - Get recommendations (hybrid approach)
- `GET /api/students/{id}` - Student profile with full context

## Success Metrics
- Model accuracy: >75%
- Intervention generation: <5 seconds per student
- Advisor efficiency: 80% time reduction (30 min → 5 min per student)
- Demo impact: Impress stakeholders enough to consider implementation

## Notes for Claude CLI
- Solo developer project (no team coordination)
- Learning while building (explain concepts, don't just generate code)
- Time-constrained (4 weeks total)
- Portfolio piece (needs to be impressive + understandable)