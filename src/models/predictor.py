"""Risk prediction model loader and predictor."""

from typing import Any

import joblib
import numpy as np
import pandas as pd

from src.config import get_settings


class RiskPredictor:
    """Singleton class for loading and using the XGBoost risk prediction model.

    The XGBoost model was trained on 11 behavioral features WITHOUT scaling:
    - 5 numeric: num_of_prev_attempts, studied_credits, avg_score, total_clicks, completion_rate
    - 6 binary: module_BBB, module_CCC, module_DDD, module_EEE, module_FFF, module_GGG
    """

    _instance: "RiskPredictor | None" = None
    _initialized: bool = False

    def __new__(cls) -> "RiskPredictor":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self.settings = get_settings()
        self.model = None
        self.feature_list: list[str] = []

    def load(self) -> None:
        """Load the model and feature list from disk."""
        self.model = joblib.load(self.settings.model_path)
        self._load_feature_list()

    def _load_feature_list(self) -> None:
        """Load the feature list from CSV."""
        df = pd.read_csv(self.settings.feature_list_path)
        self.feature_list = df["feature"].tolist()

    def _prepare_features(self, student_data: dict[str, Any]) -> np.ndarray:
        """Prepare features for prediction.

        XGBoost doesn't require feature scaling, so we pass raw values.

        Args:
            student_data: Dict containing student features

        Returns:
            Numpy array of prepared features ready for prediction
        """
        numeric_features = self.settings.numeric_features
        module_features = self.settings.module_features

        # Extract numeric features with defaults (no scaling needed for XGBoost)
        numeric_values = []
        for feat in numeric_features:
            value = student_data.get(feat, 0.0)
            numeric_values.append(float(value) if value is not None else 0.0)

        # Extract module indicators (binary 0/1)
        module_values = []
        for feat in module_features:
            value = student_data.get(feat, 0)
            module_values.append(1 if value else 0)

        # Combine: numeric + binary module indicators (11 features total)
        all_values = numeric_values + module_values
        features = np.array(all_values).reshape(1, -1)
        return features

    def predict(self, student_data: dict[str, Any]) -> dict[str, Any]:
        """Make a risk prediction for a student.

        Args:
            student_data: Dict containing student features

        Returns:
            Dict with risk_score (0-100), risk_level, and prediction details
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        features = self._prepare_features(student_data)

        # Get probability of at-risk class (class 1)
        proba = self.model.predict_proba(features)[0]
        risk_probability = float(proba[1])
        risk_score = int(round(risk_probability * 100))

        # Classify risk level
        if risk_score >= 70:
            risk_level = "high"
        elif risk_score >= 40:
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
        """Check if the model is loaded."""
        return self.model is not None


def get_predictor() -> RiskPredictor:
    """Get the singleton predictor instance."""
    return RiskPredictor()
