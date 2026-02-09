# Student Success Platform - Comprehensive Test Plan

This document outlines a systematic approach to testing all features of the Student Success Platform. Use this guide after making changes to ensure all components work correctly together.

---

## Pre-Test Setup

### 1. Start Backend Server
```bash
cd ai-student-success
uvicorn src.api.main:app --reload --port 8000
```

### 2. Start Frontend Development Server
```bash
cd frontend-react
npm run dev
```

### 3. Ensure Ollama is Running (for AI features)
```bash
ollama serve
# In another terminal:
ollama pull deepseek-r1:1.5b
```

---

## Test Sections

### Section 1: File Upload & Data Loading

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| UL-01 | Upload valid CSV | 1. Go to Upload tab<br>2. Drop `sample_students.csv`<br>3. Wait for processing | Success message with row count |
| UL-02 | Upload invalid file | 1. Try uploading a `.txt` file | Error: "Invalid file type" |
| UL-03 | Upload empty file | 1. Upload empty CSV | Error: "Empty file uploaded" |
| UL-04 | Data persists on reload | 1. Upload data<br>2. Refresh browser<br>3. Restart backend | Data still available |
| UL-05 | MIME type validation | 1. Rename `.txt` to `.csv`<br>2. Try uploading | Should reject invalid content |

### Section 2: Student Management

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| SM-01 | View student list | 1. Upload data<br>2. Go to Students tab | Table shows paginated students |
| SM-02 | Pagination | 1. Click page 2<br>2. Navigate back to page 1 | Correct data on each page |
| SM-03 | Search by ID | 1. Type student ID in search<br>2. Press Enter | Filtered results shown |
| SM-04 | Filter by risk | 1. Select "High Risk" filter | Only high-risk students shown |
| SM-05 | View student modal | 1. Click "View" on any student | Modal opens with full details |
| SM-06 | Modal shows prediction | 1. Open student modal | Risk score and SHAP factors visible |

### Section 3: Global Search

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| GS-01 | Search from any page | 1. Go to Dashboard<br>2. Type in top search bar<br>3. Press Enter | Navigates to Students, shows results |
| GS-02 | Keyboard shortcut | 1. Press Ctrl+K<br>2. Type search query<br>3. Press Enter | Search executes correctly |
| GS-03 | Clear search | 1. Search for something<br>2. Clear input<br>3. Press Enter | All students shown |

### Section 4: Dashboard

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| DB-01 | Stats display | 1. Upload data<br>2. Go to Dashboard | Stats cards show correct counts |
| DB-02 | Risk distribution | 1. Check pie chart | Shows high/medium/low distribution |
| DB-03 | Risk trend chart | 1. View trend chart | Shows trend data or mock indicator |
| DB-04 | Alerts table | 1. Check alerts section | Shows individual student alerts |
| DB-05 | View Profile from alert | 1. Click "View Profile" on alert | Opens StudentModal for that student |
| DB-06 | API health status | 1. Check status indicator | Shows "Connected" if backend running |

### Section 5: Risk Prediction

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| RP-01 | Individual prediction | 1. Go to Prediction tab<br>2. Select student<br>3. Click Predict | Risk score and factors shown |
| RP-02 | Batch prediction | 1. Click "Run Batch Prediction"<br>2. Wait for completion | All students processed |
| RP-03 | Error handling | 1. Force a prediction error | Error shown, not silent failure |
| RP-04 | SHAP factors | 1. Get prediction<br>2. Check factors list | Shows feature impacts |

### Section 6: Interventions

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| IV-01 | Generate interventions | 1. Get a prediction<br>2. Click "Get Interventions" | Rule-based recommendations shown |
| IV-02 | AI enhancement | 1. With Ollama running<br>2. Generate interventions | LLM-enhanced recommendations shown |
| IV-03 | High-risk student | 1. Select high-risk student<br>2. Get interventions | Shows high-priority actions |

### Section 7: AI Chat Assistant

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| CH-01 | Chat availability | 1. Go to Chat tab<br>2. Check status | Shows if AI is available |
| CH-02 | Send message | 1. Type question<br>2. Send message | AI response received |
| CH-03 | Conversation context | 1. Ask follow-up question | Response uses previous context |
| CH-04 | Clear history | 1. Click clear history | Messages cleared, new session |
| CH-05 | Rate limiting | 1. Send 20+ messages quickly | Rate limit message shown |
| CH-06 | Injection detection | 1. Try "ignore instructions" | Flagged but processed |

### Section 8: Error Handling

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| EH-01 | Backend offline | 1. Stop backend<br>2. Try any action | Graceful error message |
| EH-02 | No data loaded | 1. Clear data<br>2. View students | "No data" message shown |
| EH-03 | Invalid student ID | 1. Try to load non-existent student | 404 error handled |
| EH-04 | Model not loaded | 1. Force model unload<br>2. Try prediction | Appropriate error shown |

---

## Integration Tests

### Cross-Feature Workflow Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| INT-01 | Full student workflow | 1. Upload CSV<br>2. Find student via search<br>3. View details<br>4. Get prediction<br>5. Generate interventions | All steps complete successfully |
| INT-02 | Dashboard to student | 1. See alert on Dashboard<br>2. Click View Profile<br>3. Get interventions | Seamless navigation |
| INT-03 | Search integration | 1. Search from Dashboard<br>2. Auto-navigate to Students<br>3. See filtered results | Search persists across navigation |

---

## Performance Checks

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| PF-01 | Initial load | 1. Open app cold | Dashboard loads < 3 seconds |
| PF-02 | Large dataset | 1. Upload 10,000+ records | Pagination works smoothly |
| PF-03 | API caching | 1. View dashboard stats twice | Second call uses cache (5 min) |
| PF-04 | Batch prediction | 1. Run batch on 100+ students | Completes without timeout |

---

## Regression Checklist

After any code changes, verify:

- [ ] Data uploads successfully
- [ ] Students table loads
- [ ] Search filters work
- [ ] Dashboard stats update
- [ ] View Profile opens modal
- [ ] Predictions generate
- [ ] Interventions display
- [ ] Chat responds (if Ollama running)
- [ ] No console errors
- [ ] API calls use correct path (/api/v1)

---

## Test Data

### Sample Students CSV Format
```csv
student_id,num_of_prev_attempts,studied_credits,avg_score,total_clicks,completion_rate,at_risk
0,0,60,75.5,1500,0.85,0
1,1,60,45.2,500,0.35,1
2,0,120,82.0,2200,0.95,0
```

### High-Risk Student Test Case
- `avg_score` < 50
- `completion_rate` < 0.4
- `total_clicks` < 500

### Low-Risk Student Test Case
- `avg_score` > 75
- `completion_rate` > 0.8
- `total_clicks` > 1500

---

## Troubleshooting

### Common Issues

1. **"Student data not loaded" error**
   - Upload a CSV file first
   - Check backend console for load errors

2. **API 404 errors**
   - Ensure API path uses `/api/v1`
   - Check backend is running on port 8000

3. **View Profile not working from Dashboard**
   - Ensure StudentModal is in AppLayout
   - Check if alert has valid student_id

4. **Search not working**
   - Backend must have search filtering enabled
   - Check browser console for errors

5. **AI features unavailable**
   - Run `ollama serve`
   - Pull model: `ollama pull deepseek-r1:1.5b`
