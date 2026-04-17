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
        # Feature names MUST match the exact column order used during training.
        # The model was trained with categoricals first (positions 0-5, 8),
        # NOT in numeric-first order. Mismatching this causes SHAP values to be
        # labelled with the wrong feature names.
        # This order is confirmed by cat_feature_indices=[0,1,2,3,4,5,8]
        # from the training notebook output.
        self.feature_names = [
            "code_module",          # 0  — categorical
            "gender",               # 1  — categorical
            "region",               # 2  — categorical
            "highest_education",    # 3  — categorical
            "imd_band",             # 4  — categorical
            "age_band",             # 5  — categorical
            "num_of_prev_attempts", # 6  — numeric
            "studied_credits",      # 7  — numeric
            "disability",           # 8  — categorical
            "avg_score",            # 9  — numeric
            "total_clicks",         # 10 — numeric
            "completion_rate",      # 11 — numeric
        ]

    def load(self) -> None:
        """Initialize the SHAP explainer with the model."""
        predictor = get_predictor()
        if not predictor.is_loaded:
            raise RuntimeError("Predictor must be loaded before explainer")

        # Create TreeExplainer for CatBoost
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
