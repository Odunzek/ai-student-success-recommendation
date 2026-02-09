# Student Success Platform - Bug Fix Plan v2

## Issues Identified

Based on screenshot analysis and code exploration, the following critical issues need fixing:

---

## Issue Summary

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| 1 | Student Management not loading data | CRITICAL | API path mismatch + data flow |
| 2 | View Profile buttons don't work | CRITICAL | StudentModal not global + invalid IDs |
| 3 | Recent Alerts not showing real data | HIGH | Using counts instead of student IDs |
| 4 | Global search doesn't work | HIGH | Read-only input + backend ignores search |
| 5 | Batch prediction fails | MEDIUM | Data loader timing/initialization |

---

## Fix Plan

### Phase 1: API Path Fix (CRITICAL)

**Problem:** Frontend uses `/api` but backend expects `/api/v1`

**File:** `frontend-react/src/api/client.ts`

**Fix:**
```typescript
// Change from:
const API_BASE = '/api'

// To:
const API_BASE = '/api/v1'
```

---

### Phase 2: StudentModal Global Integration (CRITICAL)

**Problem:** StudentModal only exists in StudentsTab, not accessible from Dashboard

**Files to modify:**
1. `frontend-react/src/components/layout/AppLayout.tsx` - Add StudentModal
2. `frontend-react/src/pages/StudentsTab.tsx` - Remove duplicate modal

**Fix for AppLayout.tsx:**
```tsx
// Add import
import { StudentModal } from '../components/students/StudentModal'
import { useStudentModalStore } from '../store/studentModalStore'

// Add at end of component, before closing fragment
<StudentModal />
```

---

### Phase 3: Dashboard Alerts Fix (HIGH)

**Problem:** Alerts use "13 students" as studentId instead of actual student IDs

**Files to modify:**
1. `frontend-react/src/api/hooks/useDashboard.ts` - Add useRiskSummary hook
2. `frontend-react/src/pages/DashboardPage.tsx` - Fetch real at-risk students

**New hook in useDashboard.ts:**
```typescript
export function useRiskSummary() {
  return useQuery({
    queryKey: ['dashboard', 'risk-summary'],
    queryFn: () => api.get<RiskSummaryResponse>('/dashboard/risk-summary'),
    staleTime: 5 * 60 * 1000,
  })
}
```

**Fix DashboardPage.tsx alerts:**
- Fetch actual high-risk students from `/dashboard/risk-summary`
- Create alerts with real student IDs
- Link View Profile to actual student records

---

### Phase 4: Global Search Implementation (HIGH)

**Problem:** Search input is read-only, backend ignores search param

**Files to modify:**
1. `frontend-react/src/components/layout/TopHeader.tsx` - Make search functional
2. `src/api/routes/students.py` - Implement search filtering

**Backend search fix (students.py):**
```python
# Add to list_students function after getting students:
if search:
    search_lower = search.lower()
    students = [
        s for s in students
        if search_lower in str(s.get('student_id', '')).lower()
        or search_lower in str(s.get('name', '')).lower()
    ]
```

**Frontend TopHeader fix:**
- Remove `readOnly` attribute
- Add state and onChange handler
- Navigate to students page with search filter OR open search modal

---

### Phase 5: Data Loader Initialization (MEDIUM)

**Problem:** Data not persisted/loaded properly after upload

**Files to modify:**
1. `src/api/main.py` - Add optional auto-load for demo data
2. `src/api/routes/upload.py` - Better error handling and confirmation

**Fix:**
- Add startup check for existing uploaded data
- If `data/uploads/uploaded_data.csv` exists, auto-load it
- Add better logging to track loader state

---

## Test Plan

### Unit Tests Needed

```
tests/
├── api/
│   ├── test_students.py      # Student CRUD + search
│   ├── test_dashboard.py     # Stats + risk summary
│   ├── test_predict.py       # Single + batch prediction
│   ├── test_upload.py        # CSV upload + validation
│   └── test_chat.py          # Chat session + rate limiting
├── etl/
│   └── test_loader.py        # Data loading + validation
└── models/
    └── test_predictor.py     # ML model predictions
```

### Integration Tests

1. **Upload Flow:**
   - Upload CSV → Verify loader loaded → Verify students endpoint returns data

2. **Dashboard Flow:**
   - Upload data → View dashboard → Verify stats match → Click alert → Verify modal opens

3. **Search Flow:**
   - Upload data → Search by ID → Verify results filtered

4. **Prediction Flow:**
   - Upload data → Run batch prediction → Verify results

### Manual Test Checklist

- [ ] Upload sample_students.csv
- [ ] Dashboard shows correct counts
- [ ] Risk Assessment shows distribution
- [ ] Student Management lists all students
- [ ] Click View on student → Modal opens with data
- [ ] Dashboard alerts show real students
- [ ] View Profile on alert → Opens correct student
- [ ] Global search filters students
- [ ] Batch prediction runs without error
- [ ] AI Chat responds (when Ollama running)

---

## Implementation Order

1. **Phase 1:** API Path Fix (5 min)
2. **Phase 2:** StudentModal Global (15 min)
3. **Phase 3:** Dashboard Alerts (30 min)
4. **Phase 4:** Global Search (30 min)
5. **Phase 5:** Data Loader (20 min)
6. **Testing:** Write and run tests (60 min)

Total estimated time: ~2.5 hours

---

## Files to Create/Modify

| File | Action | Phase |
|------|--------|-------|
| `frontend-react/src/api/client.ts` | Modify | 1 |
| `frontend-react/src/components/layout/AppLayout.tsx` | Modify | 2 |
| `frontend-react/src/pages/StudentsTab.tsx` | Modify | 2 |
| `frontend-react/src/api/hooks/useDashboard.ts` | Modify | 3 |
| `frontend-react/src/types/dashboard.ts` | Modify | 3 |
| `frontend-react/src/pages/DashboardPage.tsx` | Modify | 3 |
| `frontend-react/src/components/layout/TopHeader.tsx` | Modify | 4 |
| `src/api/routes/students.py` | Modify | 4 |
| `src/api/main.py` | Modify | 5 |
| `tests/*.py` | Create | 6 |
