"""SHAP-based model explanations."""

import numpy as np
import shap

from src.models.predictor import get_predictor
from src.config import get_settings


class ShapExplainer:
    """SHAP explainer for model predictions."""

    _instance: "ShapExplainer | None" = None
    _initialized: bool = False

    def __new__(cls) -> "ShapExplainer":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.explainer = None
        self.settings = get_settings()
        self.feature_names = (
            self.settings.numeric_features + self.settings.module_features
        )

    def load(self) -> None:
        """Initialize the SHAP explainer with the model."""
        predictor = get_predictor()
        if not predictor.is_loaded:
            raise RuntimeError("Predictor must be loaded before explainer")

        # Create TreeExplainer for XGBoost
        self.explainer = shap.TreeExplainer(predictor.model)

    def explain(self, features: np.ndarray) -> list[dict]:
        """Generate SHAP explanations for a prediction.

        Args:
            features: Prepared feature array (1, n_features)

        Returns:
            List of top contributing factors with feature, impact, and direction
        """
        if self.explainer is None:
            raise RuntimeError("Explainer not loaded. Call load() first.")

        # Get SHAP values
        shap_values = self.explainer.shap_values(features)

        # For binary classification, shap_values might be a list [class_0, class_1]
        # or a single array. Handle both cases.
        if isinstance(shap_values, list):
            # Use class 1 (at-risk) SHAP values
            values = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        else:
            values = shap_values[0]

        # Create list of (feature, shap_value) tuples
        feature_impacts = list(zip(self.feature_names, values))

        # Sort by absolute impact (descending)
        feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)

        # Format top factors
        top_factors = []
        for feature, impact in feature_impacts[:5]:  # Top 5 factors
            direction = "increases_risk" if impact > 0 else "decreases_risk"
            top_factors.append({
                "feature": feature,
                "impact": float(impact),
                "direction": direction,
            })

        return top_factors

    @property
    def is_loaded(self) -> bool:
        """Check if the explainer is loaded."""
        return self.explainer is not None


def get_explainer() -> ShapExplainer:
    """Get the singleton explainer instance."""
    return ShapExplainer()
