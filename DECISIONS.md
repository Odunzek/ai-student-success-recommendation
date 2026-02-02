# Architecture Decision Records (ADR)

## ADR-001: Use DeepSeek-R1:8b for LLM
**Date**: 2025-01-28
**Status**: ACTIVE
**Decision**: Use DeepSeek-R1 locally
**Reason**: Privacy-preserving, no API costs
**Impact**: Requires local model hosting

---

## ADR-002: Batch Processing (Not Real-Time)
**Date**: 2025-01-29
**Status**: ACTIVE
**Decision**: Process student data in batches (every 24hrs)
**Reason**: Ethical - students need space to catch up
**Impact**: Predictions not real-time

---

## ADR-003: Use Behavioral Features Only (No Demographics)

**Date**: 2025-01-30  
**Status**: ACTIVE  
**Decision**: Train model on behavioral data only, exclude demographic features  

**Breakthrough Finding**:
- Behavioral-only model: 91.0% accuracy
- Full model (with demographics): 91.2% accuracy
- Difference: Only 0.2% accuracy loss!

**Reason**: 
- Prevents discrimination based on age, gender, disability, region
- Ethical AI - model cannot learn demographic stereotypes
- Fair predictions - all students judged on actions, not identity
- Minimal accuracy tradeoff for massive ethical gain

**Behavioral Features Used**:
- total_clicks, avg_score, assessment_completion_rate
- days_active, vle_engagement, studied_credits

**Demographics Excluded**:
- age_band, gender, disability, region, imd_band

**Impact**: 
- Model cannot discriminate against protected groups
- 0.2% lower accuracy - acceptable tradeoff
- More defensible to ethics review boards
- Aligns with equity values

**Alternative Considered**: 
- Full feature set (rejected: ethical concerns outweigh 0.2% gain)

**Related Files**: `data/processed/student_features_encoded.csv`

---

## ADR-004: Use XGBoost (Not Logistic Regression or Random Forest)

**Date**: 2025-01-31  
**Status**: ACTIVE  
**Decision**: XGBoost as primary prediction model  

**Performance Comparison**:
- XGBoost: 91% accuracy ⭐
- Random Forest: 89% accuracy
- Logistic Regression: 87% accuracy

**Reason**: 
- Best accuracy - outperforms alternatives by 2-4%
- Handles imbalanced data well
- Fast inference (<50ms per prediction)
- Built-in feature importance
- Industry standard for tabular data

**Impact**: 
- Model saved as .joblib files
- Fast deployment-ready inference
- Easy to explain to stakeholders

**Alternative Considered**: 
- Logistic Regression (rejected: 87% too low)
- Random Forest (rejected: slower, 89% not enough gain)
- Neural Networks (rejected: overkill for tabular data)

**Related Files**: `models/xgboost_final.joblib`

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
**Status**: IN PROGRESS  
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

**Related Files**: `src/api/` (to be created)

---

## ADR-008: React for Frontend (Not Vue/Angular)

**Date**: 2025-02-02  
**Status**: PLANNED  
**Decision**: React + TypeScript for frontend dashboard  

**Reason**: 
- Most popular framework - easier to find help
- Component-based architecture - reusable UI
- Rich ecosystem (Recharts, Tailwind CSS)
- Good for portfolio showcase
- TypeScript for type safety

**Planned Components**:
- StudentList - Filterable at-risk students table
- StudentDetail - Individual risk profile
- RiskChart - SHAP waterfall visualization
- InterventionPanel - Recommended actions
- Dashboard - Overview statistics

**Impact**: 
- Requires Node.js, npm/yarn
- Need to learn React hooks
- Modern, professional UI

**Alternative Considered**: 
- Vue (rejected: less industry demand)
- Angular (rejected: too complex)
- Streamlit (rejected: not production-grade)

**Related Files**: `frontend/` (to be created)

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
**Status**: DESIGNED (Not Implemented)  
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

**Related Files**: `src/agent/` (to be implemented)

---

## ADR-011: Four-Week Timeline with Milestones

**Date**: 2025-01-27  
**Status**: ON TRACK  
**Decision**: Structured 4-week sprint with clear deliverables  

**Timeline**:
- **Week 1**: Data + ML Core ✅ COMPLETE
- **Week 2**: Backend API + Integration 🔄 IN PROGRESS
- **Week 3**: Frontend Dashboard 📅 UPCOMING
- **Week 4**: Testing + Demo Prep 📅 UPCOMING

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