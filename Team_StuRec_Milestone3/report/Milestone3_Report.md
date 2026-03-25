# Milestone 3 Technical Report: Data Pipeline & Initial Model

**Course:** AIE1014 – Artificial Intelligence Engineering
**Project:** Student Success Platform
**Submission:** Milestone 3 – Data Pipeline & Initial Model
**Date:** February 2026

---

## 1. Executive Summary

This report documents the end-to-end data pipeline and machine learning model development for the Student Success Platform. The system predicts student dropout risk using the Open University Learning Analytics Dataset (OULAD), enabling early interventions for at-risk students.

**Pipeline overview:**
Raw OULAD data → Data merging & cleaning → Feature engineering (28 features) → Model selection → Hyperparameter tuning → SHAP explainability → SHAP-driven feature selection → Final model (13 features)

**Final model performance (XGBoost, 13 SHAP-selected features):**

| Metric | Baseline (DummyClassifier) | Final Model |
|--------|---------------------------|-------------|
| Accuracy | 53.0% | **91.09%** |
| Precision | — | 94.27% |
| Recall | — | 88.50% |
| F1-Score | 0.69 | **91.29%** |
| AUC-ROC | — | **97.13%** |

The final model outperforms the baseline by **+38.1 percentage points** in accuracy. A SHAP-driven feature selection step reduced the feature set from 28 to 13 (54% reduction) with no loss in predictive performance — validating that regional demographic features carry negligible predictive signal.

---

## 2. Data Pipeline

### 2.1 Data Sources

The OULAD (Open University Learning Analytics Dataset) consists of anonymised records from the Open University UK. Five CSV files were used:

| File | Records | Description |
|------|---------|-------------|
| `studentInfo.csv` | 32,593 | Core demographics and final outcomes |
| `studentAssessment.csv` | 173,912 | Assessment submission scores |
| `assessments.csv` | 206 | Assessment metadata (weight, type) |
| `studentVle.csv` | 10,655,280 | Virtual Learning Environment click logs |
| `studentRegistration.csv` | 32,593 | Registration and unregistration dates |

**Target variable:** `final_result` from `studentInfo.csv`
Binary encoding: `at_risk = 1` (Fail or Withdrawn), `at_risk = 0` (Pass or Distinction)

Class distribution:
- Pass / Distinction (0): 25,209 students — 77.4%
- Fail / Withdrawn (1): 7,384 students — 22.6%

### 2.2 Data Merging

All tables were merged at the **student-course** level (one row per student-module enrolment). The merging sequence:

1. `studentInfo` ← left join → `studentRegistration` (on `id_student`, `code_module`, `code_presentation`)
2. Result ← left join → aggregated `studentAssessment` (mean score, submission count per student-course)
3. Result ← left join → aggregated `studentVle` (total clicks per student-course)

Aggregation logic:
- **avg_score**: mean of all submitted assessment scores (weighted by assessment weight)
- **total_clicks**: sum of all VLE interaction clicks
- **has_assessments**: binary flag — 1 if student submitted at least one assessment

Final merged dataset: **32,593 rows × 13 raw columns** (before feature engineering).

### 2.3 Missing Value Handling

| Feature | Missing Values | Strategy | Rationale |
|---------|---------------|----------|-----------|
| `avg_score` | Students with no submissions | Fill with 0 | No submission = no engagement |
| `total_clicks` | Students with no VLE activity | Fill with 0 | No activity = zero engagement |
| `imd_band` | Formatting inconsistencies | Standardised labels | "10-20" vs "10-20%" unified |
| `has_assessments` | N/A | Binary derived feature | 1 if any submission exists |

No rows were dropped — missing engagement data is itself informative (students who never submitted assessments are at high risk).

### 2.4 Feature Engineering

28 features were constructed across four categories:

**Behavioural features (3):**
- `completion_rate` – ratio of submitted assessments to total assessments available
- `total_clicks` – total VLE interactions for the course
- `avg_score` – mean assessment score

**Demographic and academic features (8):**
- `gender` – binary (M/F)
- `age_band` – ordinal (0–35, 35–55, 55+)
- `highest_education` – ordinal (No formal quals → Postgraduate)
- `imd_band` – ordinal deprivation decile (0–10% least deprived to 90–100%)
- `disability` – binary (Y/N)
- `num_of_prev_attempts` – number of prior course attempts
- `studied_credits` – total credits currently enrolled
- `has_assessments` – binary flag

**Module indicators (7, one-hot encoded):**
`module_AAA`, `module_BBB`, `module_CCC`, `module_DDD`, `module_EEE`, `module_FFF`, `module_GGG`

**Region indicators (12, one-hot encoded):**
East Midlands, Ireland, London, North, North Western, Scotland, South East, South, South West, Wales, West Midlands, Yorkshire

### 2.5 Train/Test Split

| Split | Rows | Proportion |
|-------|------|------------|
| Training set | 26,074 | 80% |
| Test set | 6,519 | 20% |

- Method: Stratified split (preserves class balance in both sets)
- `random_state=42` for reproducibility
- No data leakage — scaler fitted on training set only, then applied to test set

---

## 3. Baseline Model

A `DummyClassifier` (strategy: `most_frequent`) was established as the performance floor. By always predicting the majority class (Pass/Distinction), it achieves 53% accuracy — reflecting the class imbalance.

| Metric | DummyClassifier |
|--------|----------------|
| Accuracy | 53.0% |
| F1-Score | 0.69 |
| AUC-ROC | 0.50 |

Any meaningful model must substantially exceed these figures, particularly on F1-Score and AUC-ROC.

---

## 4. Model Development

### 4.1 Model Selection

Three models were trained and evaluated on the full 28-feature set using 5-fold stratified cross-validation:

| Model | Accuracy | Precision | Recall | F1-Score | AUC-ROC | Train Time |
|-------|----------|-----------|--------|----------|---------|------------|
| Logistic Regression | 88.2% | 91.2% | 86.0% | 88.5% | 0.944 | 0.046s |
| Random Forest | 90.9% | 94.4% | 88.0% | 91.1% | 0.967 | 0.415s |
| **XGBoost** | **91.2%** | **94.8%** | **88.2%** | **91.4%** | **0.971** | 0.259s |

**XGBoost** was selected as the best model based on highest accuracy, AUC-ROC, and F1-Score with a favourable training time.

### 4.2 Hyperparameter Tuning

`RandomizedSearchCV` with 100 iterations and 5-fold stratified cross-validation was used to optimise XGBoost. F1-Score was used as the optimisation metric to balance precision and recall.

**Search space:**

| Parameter | Range |
|-----------|-------|
| `max_depth` | [4, 5, 6, 7] |
| `n_estimators` | 300–800 |
| `learning_rate` | 0.01–0.10 |
| `subsample` | 0.70–1.00 |
| `colsample_bytree` | 0.70–1.00 |
| `min_child_weight` | 1–5 |
| `gamma` | 0.00–0.40 |
| `reg_alpha` | 0.00–0.30 |
| `reg_lambda` | 0.00–3.00 |

**Best hyperparameters found:**

| Parameter | Value |
|-----------|-------|
| `colsample_bytree` | 0.837 |
| `gamma` | 0.087 |
| `learning_rate` | 0.047 |
| `max_depth` | 5 |
| `min_child_weight` | 3 |
| `n_estimators` | 427 |
| `reg_alpha` | 0.242 |
| `reg_lambda` | 2.292 |
| `subsample` | 0.795 |

### 4.3 Full-Feature Model Results (28 features)

After tuning, the XGBoost model was evaluated on the held-out test set:

| Metric | Score |
|--------|-------|
| Accuracy | 91.09% |
| Precision | 94.27% |
| Recall | 88.50% |
| F1-Score | 91.29% |
| AUC-ROC | 97.11% |

### 4.4 SHAP Explainability

SHAP (SHapley Additive exPlanations) was applied using `TreeExplainer` on the tuned XGBoost model to explain predictions on the full test set (6,519 samples).

**Top 10 features by mean absolute SHAP value:**

| Rank | Feature | Mean \|SHAP\| | Interpretation |
|------|---------|--------------|----------------|
| 1 | `completion_rate` | 2.546 | Strongest predictor — low completion = high risk |
| 2 | `total_clicks` | 1.090 | Low engagement strongly predicts dropout |
| 3 | `avg_score` | 0.958 | Academic performance is highly predictive |
| 4 | `module_FFF` | 0.310 | Module FFF has significantly different risk profile |
| 5 | `highest_education` | 0.152 | Prior education level affects risk |
| 6 | `module_BBB` | 0.102 | Module-specific effect |
| 7 | `module_CCC` | 0.100 | Module-specific effect |
| 8 | `age_band` | 0.088 | Older students show different risk patterns |
| 9 | `studied_credits` | 0.072 | Credit load affects completion likelihood |
| 10 | `imd_band` | 0.068 | Socioeconomic deprivation has moderate influence |

The three behavioural features (`completion_rate`, `total_clicks`, `avg_score`) collectively account for 78.1% of total SHAP importance, confirming that engagement data is the dominant signal in predicting dropout risk.

### 4.5 SHAP-Based Feature Selection

Following feedback to use SHAP for feature selection, a **cumulative importance threshold** of 95% was applied to identify features with meaningful predictive contribution.

**Method:**
1. Rank all 28 features by mean absolute SHAP value (descending)
2. Calculate cumulative SHAP importance as a percentage of total
3. Select all features up to and including the one that reaches 95%

**Result: 13 features selected, 15 dropped**

**Selected features (95% cumulative SHAP importance):**

| # | Feature | Mean \|SHAP\| | Cumulative % |
|---|---------|--------------|-------------|
| 1 | `completion_rate` | 2.5462 | 43.3% |
| 2 | `total_clicks` | 1.0898 | 61.8% |
| 3 | `avg_score` | 0.9581 | 78.1% |
| 4 | `module_FFF` | 0.3100 | 83.4% |
| 5 | `highest_education` | 0.1523 | 85.9% |
| 6 | `module_BBB` | 0.1019 | 87.7% |
| 7 | `module_CCC` | 0.1002 | 89.4% |
| 8 | `age_band` | 0.0877 | 90.9% |
| 9 | `studied_credits` | 0.0717 | 92.1% |
| 10 | `imd_band` | 0.0681 | 93.3% |
| 11 | `module_GGG` | 0.0591 | 94.3% |
| 12 | `gender` | 0.0431 | 95.0% |
| 13 | `module_DDD` | 0.0420 | 95.7% |

**Dropped features (15, collectively <5% of total SHAP importance):**
`region_South Region`, `region_Scotland`, `region_London Region`, `disability`, `num_of_prev_attempts`, `module_EEE`, `region_East Midlands Region`, `region_South East Region`, `region_South West Region`, `region_Wales`, `region_North Western Region`, `region_North Region`, `region_West Midlands Region`, `region_Yorkshire Region`, `region_Ireland`

The dropped features are predominantly regional indicators. While region may carry some demographic signal, SHAP analysis confirms it has negligible direct influence on at-risk prediction once behavioural and academic features are accounted for.

### 4.6 Retrained Model Results (13 SHAP-Selected Features)

XGBoost was retrained on the 13 selected features using the same tuned hyperparameters (ensuring a fair comparison).

| Metric | Full Model (28 features) | SHAP-Selected (13 features) | Change |
|--------|--------------------------|------------------------------|--------|
| Features Used | 28 | **13** | −54% |
| Accuracy | 91.09% | **91.09%** | 0.00% |
| Precision | 94.27% | **94.27%** | 0.00% |
| Recall | 88.50% | **88.50%** | 0.00% |
| F1-Score | 91.29% | **91.29%** | 0.00% |
| AUC-ROC | 97.11% | **97.13%** | +0.02% |

**Key finding:** Removing 15 low-signal features produced a model with **identical performance** and a marginal improvement in AUC-ROC (0.9711 → 0.9713). This confirms that the dropped regional features added noise rather than signal.

The SHAP-selected 13-feature model is the final submitted model:
- **Leaner:** 54% fewer features reduces data collection overhead
- **More interpretable:** Every retained feature has a clear, explainable contribution
- **Equally accurate:** No performance trade-off from the reduction

---

## 5. Challenges and Solutions

| Challenge | Solution |
|-----------|----------|
| Students with no VLE activity had missing `total_clicks` | Filled with 0 — absence of engagement is itself a predictive signal |
| Students who never submitted assessments had missing `avg_score` | Filled with 0 + created `has_assessments` binary flag |
| Inconsistent `imd_band` formatting across records | Standardised all labels to uniform format before encoding |
| Class imbalance (77.4% vs 22.6%) | Used stratified train/test split and F1-Score as optimisation metric |
| Initial 28-feature model included noisy regional indicators | SHAP analysis identified low-signal features; retraining on 13 features maintained performance while improving model simplicity |

---

## 6. Next Steps

1. **Time-series features:** Incorporate weekly engagement trends (not just totals) to detect early disengagement patterns before the end of term
2. **Class imbalance handling:** Evaluate SMOTE oversampling to further improve recall on the minority (at-risk) class
3. **Threshold optimisation:** Adjust the classification threshold (default 0.5) to prioritise recall — catching more at-risk students is preferable to false alarms in this context
4. **Additional models:** Evaluate LightGBM and CatBoost as alternatives; explore ensemble stacking
5. **Platform integration:** Connect the trained model to the Student Success Platform API to serve real-time predictions and power the intervention recommendation system
6. **Temporal validation:** Test model on a held-out academic year to validate generalisation across cohorts
