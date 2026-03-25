# Student Risk Prediction System

## Author
- Onyekachi Odunze (last 4 digits: see title page) | AIE1014

## What This Project Does
This system predicts whether a student is at risk of failing or withdrawing from their module using a Random Forest classifier trained on the OULAD (Open University Learning Analytics Dataset). It gives academic advisors at Cambrian College an easy-to-use web interface to check individual students and get an immediate risk level (low / medium / high) with confidence score.

## Prerequisites
- Python 3.8 or higher
- pip

## Installation
```bash
cd Assignment03
python -m pip install -r requirements.txt
```

## Running the Application

### Step 1 - Start the API (Terminal 1)
```bash
python -m uvicorn api.main:app --reload
```
- API runs at: http://localhost:8000
- Interactive docs (Swagger UI): http://localhost:8000/docs

### Step 2 - Start the UI (Terminal 2)
```bash
streamlit run ui/app_ui.py
```
- App runs at: http://localhost:8501

## Running the Integration Tests
Make sure the API is running first, then:
```bash
python tests/test_integration.py
```

## Project Structure
```
Assignment03/
├── api/
│   ├── main.py          <- Standalone FastAPI server
│   └── model.pkl        <- Trained RandomForest model (from Assignment 02)
├── ui/
│   └── app_ui.py        <- Streamlit web interface
├── tests/
│   └── test_integration.py  <- 8 integration tests
├── requirements.txt
└── README.md
```

## API Endpoints

| Endpoint  | Method | Description                    |
|-----------|--------|--------------------------------|
| /health   | GET    | Health check + model status    |
| /predict  | POST   | Predict student risk level     |
| /info     | GET    | Model metadata and feature list|

## Model Information
- **Algorithm:** Random Forest Classifier (100 estimators)
- **Target:** at_risk (0 = not at risk, 1 = at risk)
- **Key features:** avg_score, completion_rate, total_clicks, studied_credits, num_of_prev_attempts
- **CV Accuracy:** 90.62% (5-fold cross-validation on training set)
- **Test Accuracy:** 90.66%
- **Trained on:** OULAD dataset - 32,176 records after cleaning

## Known Issues & Limitations
1. The model was trained on OULAD (UK Open University) data, not actual Cambrian College data. Predictions may not fully reflect Cambrian's student population.
2. Demographic features (region, IMD band) are UK-specific and may not apply to Canadian students.
3. The model does not update in real time - it requires retraining on new data to reflect current trends.

## Next Steps
1. Retrain on actual Cambrian College Moodle data once data-sharing agreements are in place.
2. Add OAuth2 role-based access control before any production deployment.
3. Add batch prediction support (CSV upload) for processing multiple students at once.
