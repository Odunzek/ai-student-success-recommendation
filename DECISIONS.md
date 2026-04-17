# Architecture Decision Records (ADR)

## ADR-001: LLM Provider — OpenAI Primary, Ollama Fallback
**Date**: 2025-01-28 | **Revised**: 2025-04-16
**Status**: ACTIVE
**Decision**: OpenAI `gpt-4o-mini` is the primary LLM. Ollama (e.g. `deepseek-r1:1.5b`) is supported as a local/free alternative via `LLM_PROVIDER=ollama` in `.env`.
**Reason**: OpenAI gives better response quality; Ollama allows offline/cost-free demos. Both share the same async client interface.
**Impact**: Requires `OPENAI_API_KEY` for full quality; Ollama requires local install but has no ongoing cost.

---

## ADR-002: On-Demand Predictions (Batch Processing Deferred)
**Date**: 2025-01-29 | **Revised**: 2025-04-16
**Status**: REVISED — predictions run on-demand per student request. Scheduled batch scans are a planned future feature.
**Decision**: Risk scores are computed at request time (when an advisor views a student or the list loads), not on a 24-hour schedule.
**Reason**: Simpler to implement correctly; avoids stale cached scores; batch scan can be added later as a background job.
**Impact**: Slightly higher per-request latency (~100–300ms for CatBoost + SHAP); acceptable for advisor workflows.

---

## ADR-003: Use All 12 OULAD Features Including Demographics

**Date**: 2025-01-30 | **Revised**: 2025-04-16
**Status**: ACTIVE (supersedes earlier behavioral-only draft)
**Decision**: Train on all 12 OULAD features — 5 numeric + 7 native categoricals

**Features**:
- Numeric: `num_of_prev_attempts`, `studied_credits`, `avg_score`, `total_clicks`, `completion_rate`
- Categorical: `code_module`, `gender`, `region`, `highest_education`, `imd_band`, `age_band`, `disability`

**Reason**:
- CatBoost handles categoricals natively — no manual encoding, no introduced bias from arbitrary encoding choices
- Demographics are used as context signals (e.g. first-generation students, high deprivation), not as grounds for differential treatment
- SHAP explains which features drive each prediction, enabling advisors to see if demographic factors appear unexpectedly influential
- Recall on held-out test set: 0.9009 — capturing 90% of real at-risk students

**Ethical Mitigation**:
- SHAP factors are surfaced to advisors; any demographic dominance would be visible and challengeable
- Final decision always remains with the human advisor — the model is an alert, not a verdict

**Alternative Considered**:
- Behavioral-only model (considered: marginally lower recall, dismissed because demographic context is meaningful and transparent with SHAP)

**Related Files**: `notebooks/notebook.ipynb`, `models/catboost_baseline_production.pkl`

---

## ADR-004: Use CatBoost Baseline (Not Tuned, Not XGBoost)

**Date**: 2025-01-31 | **Revised**: 2025-04-16
**Status**: ACTIVE
**Decision**: CatBoost baseline model (`catboost_baseline_production.pkl`) as the production predictor

**Model Comparison** (from `notebooks/notebook.ipynb`):
| Model | AUC-ROC | Recall (at-risk) | Precision |
|---|---|---|---|
| CatBoost Baseline | 0.9780 | **0.9009** | 0.86 |
| CatBoost Tuned | 0.9781 | 0.8983 | 0.87 |
| Random Forest | ~0.96 | ~0.87 | — |
| Logistic Regression | ~0.91 | ~0.83 | — |

**Why Baseline Over Tuned**:
- Recall is the primary metric for dropout risk — missing a real at-risk student is worse than a false alarm
- Baseline recall (0.9009) > Tuned recall (0.8983) — baseline catches more at-risk students
- AUC-ROC difference is negligible (0.0001)

**Why CatBoost**:
- Native categorical handling — no one-hot encoding, no information loss
- `cat_features` parameter passed directly as string values
- Best recall across all tested models
- SHAP-compatible via `TreeExplainer`

**Critical Implementation Note**:
- Feature column order must match training exactly: `[code_module, gender, region, highest_education, imd_band, age_band, num_of_prev_attempts, studied_credits, disability, avg_score, total_clicks, completion_rate]`
- `cat_feature_indices = [0,1,2,3,4,5,8]` — wrong column order causes `Invalid type for cat_feature` errors

**Related Files**: `models/catboost_baseline_production.pkl`, `src/models/predictor.py`

---

## ADR-005: Integrate SHAP for Explainability

**Date**: 2025-02-01  
**Status**: ACTIVE  
**Decision**: Use SHAP (SHapley Additive exPlanations) for model interpretability  

**Reason**: 
- Transparent AI - advisors must understand WHY students are flagged
- Legal/ethical requirement for automated decisions
- Builds trust - shows specific contributing factors
- Actionable insights - reveals which behaviors to target
- Research-backed approach

**Impact**: 
- Adds ~0.5-1 second latency per prediction
- Requires saving SHAP explainer (~50MB)
- Worth the cost for transparency

**Alternative Considered**: 
- Feature importance only (rejected: less detailed)
- LIME (rejected: less consistent than SHAP)
- No explainability (rejected: unacceptable for high-stakes decisions)

**Related Files**: `models/shap_explainer.joblib`

---

## ADR-006: Use OULAD Dataset (Not Real Cambrian Data)

**Date**: 2025-01-28  
**Status**: ACTIVE (Compromise)  
**Decision**: Train on Open University Learning Analytics Dataset (32,593 students)  

**Reason**: 
- Real Cambrian data inaccessible (privacy, bureaucracy)
- OULAD is similar structure (Moodle-like LMS data)
- Publicly available, well-documented
- Good for proof-of-concept
- 4-week timeline can't wait for data approval

**Impact**: 
- Model trained on UK Open University students
- May need retraining when real Cambrian data available
- Different demographics and course structures

**Future Migration Path**:
1. Deploy with OULAD model
2. Get Cambrian Moodle API access
3. Retrain on Cambrian data
4. A/B test performance
5. Switch to Cambrian-trained model

**Alternative Considered**: 
- Wait for Cambrian data (rejected: would miss deadline)
- Synthetic data (rejected: less realistic)

**Related Files**: `data/raw/*.csv`

---

## ADR-007: FastAPI for Backend (Not Flask/Django)

**Date**: 2025-02-02  
**Status**: COMPLETE  
**Decision**: Use FastAPI for REST API backend  

**Reason**: 
- Modern framework with async/await support
- Auto-generated API docs (Swagger/OpenAPI)
- Type hints with Pydantic validation
- Fast performance for ML APIs
- Industry standard (Netflix, Uber, Microsoft)

**Planned Endpoints**:
- POST /api/v1/predict - Student risk prediction
- POST /api/v1/intervention - Generate recommendations
- GET /api/v1/students/{id}/history - Student timeline
- GET /api/v1/dashboard/stats - Dashboard metrics

**Impact**: 
- Requires learning async Python
- Need Pydantic models for validation
- Better long-term maintainability

**Alternative Considered**: 
- Flask (rejected: too basic, no async)
- Django (rejected: too heavy, includes ORM we don't need)

**Related Files**: `src/api/routes/`, `src/api/schemas/`, `src/api/main.py`

---

## ADR-008: React for Frontend (Not Vue/Angular)

**Date**: 2025-02-02  
**Status**: COMPLETE  
**Decision**: React + TypeScript for frontend dashboard  

**Reason**: 
- Most popular framework - easier to find help
- Component-based architecture - reusable UI
- Rich ecosystem (Recharts, Tailwind CSS)
- Good for portfolio showcase
- TypeScript for type safety

**Delivered Components**:
- `StudentTable` / `StudentModal` — filterable table with full OULAD profile modals
- `RiskCircle` / `ShapFactors` — animated risk gauge + SHAP factor visualisation
- `InterventionCard` — structured card with Action/Owner/Timeline/Success rendering
- `PredictionForm` — manual 12-feature prediction form with categorical dropdowns
- `ChatInterface` / `ChatTab` — full EduAssist conversational UI with student context sidebar
- `DashboardPage` — cohort stats, risk distribution chart, high-risk alerts

**Impact**: 
- Requires Node.js, npm/yarn
- TypeScript + React Query + Zustand for type-safe, reactive UI
- Dark/light mode with system preference detection

**Alternative Considered**: 
- Vue (rejected: less industry demand)
- Angular (rejected: too complex)
- Streamlit (rejected: not production-grade)

**Related Files**: `frontend-react/src/`

---

## ADR-009: Systematic ETL Pipeline (Not Ad-Hoc Scripts)

**Date**: 2025-01-29  
**Status**: COMPLETE  
**Decision**: Build structured ETL pipeline with validation and feature engineering  

**Pipeline Stages**:
1. **Extract**: Load 7 OULAD CSV files
2. **Transform**: Join tables, engineer features, handle missing data, encode categoricals
3. **Load**: Output student_features_encoded.csv

**Key Features Engineered**:
- assessment_completion_rate = submitted / total
- avg_score = mean of all scores
- total_clicks = sum of VLE interactions
- days_active = unique activity dates
- vle_engagement = clicks per day active

**Reason**: 
- Reproducible data processing
- Easier debugging with clear stages
- Production-ready approach
- Learning data engineering best practices

**Impact**: 
- More upfront work (~2 days)
- Cleaner, maintainable code
- Easy to add new features
- Can adapt for Cambrian data

**Alternative Considered**: 
- Ad-hoc Jupyter notebook (rejected: messy, hard to reproduce)

**Related Files**: `src/etl/`, `data/processed/student_features_encoded.csv`

---

## ADR-010: Hybrid Intervention System (Rules + LLM)

**Date**: 2025-02-01  
**Status**: COMPLETE  
**Decision**: Combine rule-based policies with LLM enhancement  

**Architecture**:
1. Rule engine generates evidence-based templates
2. LLM (DeepSeek) personalizes recommendations
3. Fallback: If LLM fails, return rule-based advice

**Reason**: 
- Rules ensure evidence-based interventions
- LLM adds personalization and natural language
- System works even if LLM unavailable
- Best of both worlds - structure + flexibility

**Example**:
- Rule: "Low engagement + failing → Recommend tutoring"
- LLM: Personalizes based on student's specific situation

**Impact**: 
- More complex than single approach
- Need prompt engineering for LLM
- More maintainable than pure LLM

**Alternative Considered**: 
- Rules only (rejected: less engaging)
- LLM only (rejected: risk of hallucinations)

**Related Files**: `src/agent/rules.py`, `src/agent/hybrid.py`, `src/agent/prompts.py`, `src/agent/llm_client.py`

---

## ADR-011: Four-Week Timeline with Milestones

**Date**: 2025-01-27  
**Status**: COMPLETE  
**Decision**: Structured 4-week sprint with clear deliverables  

**Timeline**:
- **Week 1**: Data + ML Core ✅ COMPLETE
- **Week 2**: Backend API + Integration ✅ COMPLETE
- **Week 3**: Frontend Dashboard ✅ COMPLETE
- **Week 4**: Testing + Demo Prep ✅ COMPLETE — defence scheduled April 2025

**Reason**: 
- Academic deadline - project due Feb 24
- Learning pacing - one major milestone per week
- Portfolio showcase - need polished demo
- Prevents scope creep

**Impact**: 
- Must stay disciplined on timeline
- No time for "nice-to-have" features
- Focus on MVP (Minimum Viable Product)

**Related Files**: Project plan, GitHub milestones

---

## ADR-012: Hands-On Learning Approach (Not Copy-Paste)

**Date**: Ongoing  
**Status**: GUIDING PHILOSOPHY  
**Decision**: Learn by implementing, not by reading theory  

**Kachy's Preference**: 
"Show me how, I'll build it. Don't just give me theory."

**Teaching Principles**:
- Concise code examples - show implementation
- Real-world context - explain "why" with industry perspective
- Production best practices - write code like senior engineers
- Minimal theory dumps - only what's needed to understand

**Reason**: 
- Better retention through practice
- Portfolio requires understanding, not just working code
- Hands-on experience builds confidence
- Simulates real engineering work

**Impact**: 
- Takes more time than copy-paste
- Deeper learning and understanding
- Better prepared for technical interviews
- Can explain decisions to stakeholders

**Related**: All conversations with Claude as CTO

---

## ADR-013: SHAP Factors as First-Class Context for All AI Systems

**Date**: 2025-04-16
**Status**: ACTIVE
**Decision**: Pass SHAP factors from the risk model into both the chat AI and the intervention generator

**What changed**:
- Chat endpoint: fetches SHAP factors after prediction and injects them as "Top Risk Drivers" in student context
- Intervention endpoint: accepts `shap_factors` in the request body; hybrid engine passes them to both the rule engine (for priority boosting) and the LLM prompt (for targeted recommendations)
- Frontend: `InterventionTab` reads `prediction.shap_factors` and includes them in the intervention API call

**Reason**:
- Without SHAP, the AI only knows raw metrics (avg_score, completion_rate, etc.) but not *which ones are actually driving risk for this specific student*
- Two students can have the same avg_score but different top SHAP drivers — the interventions should differ accordingly
- SHAP-aware interventions are more defensible: advisors can trace why a specific action was recommended back to the model's explanation

**Rule engine impact**:
- Top risk-increasing SHAP features boost the corresponding intervention priority (`medium → high`, `high → critical`)
- Ensures the most impactful action gets surfaced first

**LLM prompt impact**:
- SHAP section added to `INTERVENTION_ENHANCEMENT_TEMPLATE` with direction (↑ raises / ↓ lowers) and percentage of model explanation
- LLM instructed to "address the top SHAP drivers directly"

**Related Files**: `src/api/routes/chat.py`, `src/agent/prompts.py`, `src/agent/rules.py`, `src/agent/hybrid.py`, `src/api/schemas/intervention.py`, `frontend-react/src/pages/InterventionTab.tsx`

---

## ADR-014: Context Injection Instead of RAG

**Date**: 2025-04-16
**Status**: ACTIVE
**Decision**: Use direct prompt context injection for student data, not a RAG (Retrieval-Augmented Generation) pipeline

**What we do**:
- When a student is selected in the chat sidebar, the backend fetches their full record + runs prediction + fetches SHAP factors
- All of this is injected as structured text into the LLM prompt for that message

**Why not RAG**:
- RAG requires a vector database (Chroma, Pinecone, pgvector) + embedding model + chunk retrieval pipeline
- Our "knowledge base" is structured student records — these are better served by direct lookup than semantic search
- RAG is most valuable for large unstructured document collections (papers, policies, manuals)
- For this project scope and timeline, context injection provides equivalent quality with far less infrastructure

**When RAG would make sense as a future upgrade**:
- If we added a library of intervention research papers, course content, or institutional policies that advisors could query
- At that point, semantic search over documents would outperform direct injection

**Related Files**: `src/api/routes/chat.py`

---

## ADR-015: Student Names as First-Class Data

**Date**: 2025-04-16
**Status**: ACTIVE
**Decision**: Store and display student names throughout the platform rather than IDs only

**What changed**:
- `data/sample_students.csv` includes a `name` column
- All search inputs across Students, Prediction, Intervention, and Chat tabs accept name or student ID
- Backend search (`loader.py`) performs OR-match on both `student_id` and `name` columns
- AI chat context and intervention inputs use the student's name for personalized responses
- UI displays name as primary identifier with student ID as subtitle

**Reason**:
- Advisors think of students by name, not by opaque IDs like "STU003"
- Personalised AI responses that say "Emily's completion rate is 84%" are more useful than "Student STU001's completion rate is 84%"
- Better UX for demo and defence scenarios

**Impact**:
- `name` column is optional — platform degrades gracefully to student_id if absent
- No schema changes required; name is just another CSV column

**Related Files**: `data/sample_students.csv`, `src/etl/loader.py`, `frontend-react/src/types/student.ts`

---