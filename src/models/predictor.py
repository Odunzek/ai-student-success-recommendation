"""
Risk prediction model loader and predictor.

This module provides the core ML prediction functionality for student dropout
risk assessment. It loads a pre-trained XGBoost model and provides methods
for making predictions on individual students.

Model Details:
    - Algorithm: XGBoost (Gradient Boosting)
    - Training accuracy: ~91% (configurable via settings)
    - Features: 11 total (5 numeric + 6 binary module indicators)
    - Output: Probability of dropout risk (0-1), converted to 0-100 score

Features Used:
    Numeric (5):
        - num_of_prev_attempts: Number of previous module attempts
        - studied_credits: Total credits completed
        - avg_score: Average assessment score (0-100)
        - total_clicks: Total LMS activity/engagement clicks
        - completion_rate: Course completion percentage (0-1)

    Binary/Categorical (6):
        - module_BBB through module_GGG: One-hot encoded module indicators

Usage:
    from src.models.predictor import get_predictor

    predictor = get_predictor()
    predictor.load()  # Load model from disk

    result = predictor.predict({
        "avg_score": 65,
        "completion_rate": 0.7,
        "total_clicks": 500,
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
    Singleton class for loading and using the XGBoost risk prediction model.

    Implements the Singleton pattern to ensure only one model instance is
    loaded in memory. The model was trained on 11 behavioral features and
    does NOT require feature scaling (XGBoost handles raw values).

    Attributes:
        settings: Application settings containing model path and thresholds
        model: The loaded XGBoost model (None until load() is called)
        feature_list: List of feature names from training

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
        self.feature_list: list[str] = []

    def load(self) -> None:
        """
        Load the trained XGBoost model and feature list from disk.

        The model is loaded using joblib (efficient for scikit-learn/XGBoost).
        The feature list is loaded from a CSV file that was saved during training.

        Raises:
            FileNotFoundError: If model or feature list file doesn't exist
            Exception: If model loading fails for other reasons
        """
        self.model = joblib.load(self.settings.model_path)
        self._load_feature_list()

    def _load_feature_list(self) -> None:
        """
        Load the feature list from the CSV file created during training.

        The feature list ensures we process features in the same order
        they were used during model training.
        """
        df = pd.read_csv(self.settings.feature_list_path)
        self.feature_list = df["feature"].tolist()

    def _prepare_features(self, student_data: dict[str, Any]) -> np.ndarray:
        """
        Prepare features for model prediction.

        Transforms raw student data into the feature array format expected
        by the XGBoost model. XGBoost doesn't require feature scaling, so
        we pass raw values directly.

        Feature Order (must match training):
            1. num_of_prev_attempts (numeric)
            2. studied_credits (numeric)
            3. avg_score (numeric)
            4. total_clicks (numeric)
            5. completion_rate (numeric)
            6-11. module_BBB through module_GGG (binary 0/1)

        Args:
            student_data: Dictionary containing student metrics with keys
                         matching the expected feature names

        Returns:
            Numpy array of shape (1, 11) ready for model.predict_proba()
        """
        numeric_features = self.settings.numeric_features
        module_features = self.settings.module_features

        # Safe defaults when a value is missing or NaN
        feature_defaults = {
            "num_of_prev_attempts": 0.0,
            "studied_credits": 60.0,
            "avg_score": 50.0,
            "total_clicks": 0.0,
            "completion_rate": 0.5,
        }

        numeric_values = []
        for feat in numeric_features:
            value = student_data.get(feat)
            default = feature_defaults.get(feat, 0.0)
            # Replace None or NaN with the safe default
            if value is None:
                value = default
            else:
                try:
                    value = float(value)
                    if value != value:  # NaN check (NaN != NaN is always True)
                        value = default
                except (TypeError, ValueError):
                    value = default
            numeric_values.append(value)

        # Extract module indicators (binary 0/1)
        module_values = []
        for feat in module_features:
            value = student_data.get(feat, 0)
            try:
                module_values.append(1 if float(value or 0) else 0)
            except (TypeError, ValueError):
                module_values.append(0)

        # Combine: numeric + binary module indicators (11 features total)
        all_values = numeric_values + module_values
        features = np.array(all_values).reshape(1, -1)
        return features

    def predict(self, student_data: dict[str, Any]) -> dict[str, Any]:
        """
        Make a risk prediction for a single student.

        Takes student metrics and returns a risk assessment including:
        - Numerical risk score (0-100)
        - Risk level classification (low/medium/high)
        - Raw probability for advanced use cases

        Args:
            student_data: Dictionary containing student features:
                - avg_score: Average assessment score (0-100)
                - completion_rate: Course completion (0-1)
                - total_clicks: LMS engagement count
                - num_of_prev_attempts: Previous module attempts
                - studied_credits: Credits completed
                - module_*: Optional module indicators

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
