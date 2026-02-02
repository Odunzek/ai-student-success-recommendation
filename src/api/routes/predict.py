"""Prediction endpoint routes."""

from fastapi import APIRouter, HTTPException, Query

from src.api.schemas.student import StudentFeatures
from src.api.schemas.prediction import PredictionResponse, PredictionWithExplanation
from src.models.predictor import get_predictor
from src.models.explainer import get_explainer

router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post(
    "",
    response_model=PredictionResponse,
    summary="Predict student risk",
    description="Predict whether a student is at risk based on their features.",
)
async def predict_risk(student: StudentFeatures) -> PredictionResponse:
    """Make a risk prediction for a student.

    Args:
        student: Student features for prediction

    Returns:
        Risk prediction with score, probability, and level
    """
    predictor = get_predictor()

    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please try again later."
        )

    try:
        student_data = student.model_dump()
        result = predictor.predict(student_data)
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post(
    "/explain",
    response_model=PredictionWithExplanation,
    summary="Predict with SHAP explanation",
    description="Predict student risk with SHAP feature importance explanations.",
)
async def predict_with_explanation(student: StudentFeatures) -> PredictionWithExplanation:
    """Make a risk prediction with SHAP explanations.

    Args:
        student: Student features for prediction

    Returns:
        Risk prediction with top contributing factors
    """
    predictor = get_predictor()
    explainer = get_explainer()

    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please try again later."
        )

    try:
        student_data = student.model_dump()

        # Get prediction
        result = predictor.predict(student_data)

        # Get SHAP explanation if available
        top_factors = None
        if explainer.is_loaded:
            features = predictor._prepare_features(student_data)
            top_factors = explainer.explain(features)

        return PredictionWithExplanation(
            **result,
            top_factors=top_factors
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )
