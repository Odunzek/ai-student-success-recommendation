"""
Risk prediction model loader and predictor.

This module provides the core ML prediction functionality for student dropout
risk assessment. It loads the production CatBoost model and provides methods
for making predictions on individual students.

Model Details:
    - Algorithm: CatBoost (Gradient Boosting) with native categorical handling
    - File: catboost_baseline_production.pkl
    - Recall: 0.9009 on held-out test set (primary reason baseline was chosen over tuned)
    - Features: 12 total (5 numeric + 7 raw string categoricals)
    - Output: Probability of dropout risk (0-1), converted to 0-100 score

Features Used:
    Numeric (5):
        - num_of_prev_attempts: Number of previous module attempts
        - studied_credits: Total credits completed
        - avg_score: Average assessment score (0-100)
        - total_clicks: Total LMS activity/engagement clicks
        - completion_rate: Course completion percentage (0-1)

    Categorical (7) — passed as raw strings, no encoding needed:
        - code_module: Module code (e.g. 'AAA', 'BBB', ...)
        - gender: 'M' or 'F'
        - region: e.g. 'Scotland', 'London Region', ...
        - highest_education: e.g. 'HE Qualification', 'A Level or Equivalent', ...
        - imd_band: Deprivation decile e.g. '0-10%', '10-20%', ...
        - age_band: '0-35', '35-55', or '55<='
        - disability: 'Y' or 'N'

Usage:
    from src.models.predictor import get_predictor

    predictor = get_predictor()
    predictor.load()  # Load model from disk

    result = predictor.predict({
        "avg_score": 65,
        "completion_rate": 0.7,
        "total_clicks": 500,
        "code_module": "BBB",
        "gender": "M",
        ...
    })
    # Returns: {"risk_score": 45, "risk_level": "medium", ...}
"""

from typing import Any

import joblib
import numpy as np
import pandas as pd

from src.config import get_settings


class RiskPredictor:
    """
    Singleton class for loading and using the CatBoost risk prediction model.

    Implements the Singleton pattern to ensure only one model instance is
    loaded in memory. The model was trained on 12 features (5 numeric +
    7 native categorical) and does NOT require feature scaling or encoding.

    Attributes:
        settings: Application settings containing model path and thresholds
        model: The loaded CatBoost model (None until load() is called)

    Risk Level Thresholds (configurable via environment):
        - High risk: score >= 70 (default)
        - Medium risk: score >= 40 (default)
        - Low risk: score < 40

    Example:
        predictor = get_predictor()
        predictor.load()

        result = predictor.predict({"avg_score": 55, "completion_rate": 0.4, ...})
        print(f"Risk: {result['risk_level']} ({result['risk_score']}%)")
    """

    # Singleton instance tracking
    _instance: "RiskPredictor | None" = None
    _initialized: bool = False

    def __new__(cls) -> "RiskPredictor":
        """
        Implement Singleton pattern - return existing instance if available.

        This ensures only one model is loaded in memory, which is important
        because ML models can be memory-intensive.
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        """
        Initialize the predictor (only runs once due to Singleton pattern).

        Sets up configuration and prepares model attribute (actual loading
        happens in load() method to allow deferred loading).
        """
        if self._initialized:
            return
        self._initialized = True
        self.settings = get_settings()
        self.model = None

    def load(self) -> None:
        """
        Load the trained CatBoost model from disk.

        The model is loaded using joblib. No feature list CSV is needed —
        CatBoost stores its own feature names and cat_feature indices internally.

        Raises:
            FileNotFoundError: If model file doesn't exist
            Exception: If model loading fails for other reasons
        """
        self.model = joblib.load(self.settings.model_path)

    def _prepare_features(self, student_data: dict[str, Any]) -> pd.DataFrame:
        """
        Prepare features for model prediction.

        Builds a single-row pandas DataFrame with 12 features matching the
        exact column order used during training. CatBoost requires a DataFrame
        (not a numpy array) so it can match column names to its stored
        cat_feature indices.

        No encoding is applied — CatBoost handles categoricals natively.
        Missing numeric values are filled with safe defaults.
        Missing categorical values are filled with 'Unknown'.

        Feature Order (must match training):
            code_module, gender, region, highest_education, imd_band,
            age_band, num_of_prev_attempts, studied_credits, disability,
            avg_score, total_clicks, completion_rate

        Args:
            student_data: Dictionary containing student features

        Returns:
            Single-row pandas DataFrame ready for model.predict_proba()
        """
        # Safe defaults for numeric features when value is missing or NaN
        numeric_defaults = {
            "num_of_prev_attempts": 0.0,
            "studied_credits": 60.0,
            "avg_score": 50.0,
            "total_clicks": 0.0,
            "completion_rate": 0.5,
        }

        # Safe defaults for categorical features — 'Unknown' is a valid
        # CatBoost category (treated as its own group, not missing)
        categorical_defaults = {
            "code_module": "Unknown",
            "gender": "Unknown",
            "region": "Unknown",
            "highest_education": "Unknown",
            "imd_band": "Unknown",
            "age_band": "Unknown",
            "disability": "Unknown",
        }

        row = {}

        # Process numeric features — cast to float, replace None/NaN with default
        for feat in self.settings.numeric_features:
            value = student_data.get(feat)
            default = numeric_defaults.get(feat, 0.0)
            if value is None:
                value = default
            else:
                try:
                    value = float(value)
                    if value != value:  # NaN check (NaN != NaN is True)
                        value = default
                except (TypeError, ValueError):
                    value = default
            row[feat] = value

        # Process categorical features — cast to string, replace None with 'Unknown'
        for feat in self.settings.categorical_features:
            value = student_data.get(feat)
            if value is None or (isinstance(value, float) and value != value):
                value = categorical_defaults[feat]
            else:
                value = str(value).strip()
                if not value:
                    value = categorical_defaults[feat]
            row[feat] = value

        # Build single-row DataFrame and reorder columns to EXACTLY match training order.
        # The model was trained with categoricals first (indices 0-5, 8), then numerics.
        # Passing columns in a different order causes CatBoost to misidentify which
        # columns are categorical, producing "Invalid type for cat_feature" errors.
        TRAINING_COLUMN_ORDER = [
            "code_module",        # index 0  — categorical
            "gender",             # index 1  — categorical
            "region",             # index 2  — categorical
            "highest_education",  # index 3  — categorical
            "imd_band",           # index 4  — categorical
            "age_band",           # index 5  — categorical
            "num_of_prev_attempts",  # index 6  — numeric
            "studied_credits",    # index 7  — numeric
            "disability",         # index 8  — categorical
            "avg_score",          # index 9  — numeric
            "total_clicks",       # index 10 — numeric
            "completion_rate",    # index 11 — numeric
        ]
        return pd.DataFrame([row])[TRAINING_COLUMN_ORDER]

    def predict(self, student_data: dict[str, Any]) -> dict[str, Any]:
        """
        Make a risk prediction for a single student.

        Takes student metrics and returns a risk assessment including:
        - Numerical risk score (0-100)
        - Risk level classification (low/medium/high)
        - Raw probability for advanced use cases

        Args:
            student_data: Dictionary containing student features:
                Numeric:
                - avg_score: Average assessment score (0-100)
                - completion_rate: Course completion (0-1)
                - total_clicks: LMS engagement count
                - num_of_prev_attempts: Previous module attempts
                - studied_credits: Credits completed
                Categorical (raw strings):
                - code_module: e.g. 'AAA', 'BBB', ...
                - gender: 'M' or 'F'
                - region: e.g. 'Scotland', 'London Region', ...
                - highest_education: e.g. 'HE Qualification'
                - imd_band: e.g. '0-10%', '10-20%', ...
                - age_band: '0-35', '35-55', or '55<='
                - disability: 'Y' or 'N'

        Returns:
            Dictionary containing:
                - risk_score: Integer 0-100 (higher = more at risk)
                - risk_probability: Float 0-1 (raw model output)
                - risk_level: "low", "medium", or "high"
                - prediction: Binary 0 or 1 (1 = at risk)

        Raises:
            RuntimeError: If model hasn't been loaded yet

        Example:
            result = predictor.predict({
                "avg_score": 45,
                "completion_rate": 0.3,
                "total_clicks": 100,
                "num_of_prev_attempts": 2,
                "studied_credits": 30
            })
            # result = {
            #     "risk_score": 78,
            #     "risk_probability": 0.78,
            #     "risk_level": "high",
            #     "prediction": 1
            # }
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        # Prepare features in the format expected by the model
        features = self._prepare_features(student_data)

        # Get probability of at-risk class (class 1 = at risk, class 0 = not at risk)
        # predict_proba returns [[prob_class_0, prob_class_1]]
        proba = self.model.predict_proba(features)[0]
        risk_probability = float(proba[1])  # Probability of being at risk
        risk_score = int(round(risk_probability * 100))  # Convert to 0-100 scale

        # Classify risk level using configurable thresholds from settings
        # Thresholds can be adjusted via RISK_THRESHOLD_HIGH and RISK_THRESHOLD_MEDIUM env vars
        if risk_score >= self.settings.risk_threshold_high:
            risk_level = "high"
        elif risk_score >= self.settings.risk_threshold_medium:
            risk_level = "medium"
        else:
            risk_level = "low"

        return {
            "risk_score": risk_score,
            "risk_probability": risk_probability,
            "risk_level": risk_level,
            "prediction": 1 if risk_probability >= 0.5 else 0,
        }

    @property
    def is_loaded(self) -> bool:
        """
        Check if the model has been loaded and is ready for predictions.

        Returns:
            True if model is loaded, False otherwise
        """
        return self.model is not None


def get_predictor() -> RiskPredictor:
    """
    Get the singleton RiskPredictor instance.

    This is the recommended way to access the predictor throughout
    the application. Returns the same instance on every call.

    Returns:
        The singleton RiskPredictor instance

    Note:
        Remember to call predictor.load() before making predictions,
        typically done during application startup.
    """
    return RiskPredictor()
