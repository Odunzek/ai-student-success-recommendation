"""Prediction response schemas."""

from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    """Response schema for risk prediction endpoint."""

    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Risk score from 0-100 (percentage likelihood of being at-risk)"
    )
    risk_probability: float = Field(
        ...,
        ge=0,
        le=1,
        description="Raw probability from model (0-1)"
    )
    risk_level: str = Field(
        ...,
        description="Risk category: 'low', 'medium', or 'high'"
    )
    prediction: int = Field(
        ...,
        ge=0,
        le=1,
        description="Binary prediction: 0 = not at risk, 1 = at risk"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "risk_score": 75,
                    "risk_probability": 0.75,
                    "risk_level": "high",
                    "prediction": 1,
                }
            ]
        }
    }


class PredictionWithExplanation(PredictionResponse):
    """Prediction response with SHAP explanations."""

    top_factors: list[dict] | None = Field(
        None,
        description="Top contributing factors to the prediction"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "risk_score": 75,
                    "risk_probability": 0.75,
                    "risk_level": "high",
                    "prediction": 1,
                    "top_factors": [
                        {"feature": "completion_rate", "impact": -0.35, "direction": "increases_risk"},
                        {"feature": "avg_score", "impact": -0.20, "direction": "increases_risk"},
                        {"feature": "total_clicks", "impact": -0.15, "direction": "increases_risk"},
                    ]
                }
            ]
        }
    }
