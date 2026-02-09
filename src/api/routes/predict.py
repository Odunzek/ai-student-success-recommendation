"""Prediction endpoint routes."""

import logging

from fastapi import APIRouter, HTTPException, Query

from src.api.schemas.student import StudentFeatures
from src.api.schemas.prediction import PredictionResponse, PredictionWithExplanation
from src.models.predictor import get_predictor
from src.models.explainer import get_explainer
from src.etl.loader import get_data_loader

logger = logging.getLogger(__name__)

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


@router.post(
    "/batch",
    summary="Run batch predictions",
    description="Run predictions on all uploaded students and update risk distribution.",
)
async def batch_predict():
    """Run predictions on all students in the dataset.

    Returns:
        Summary of batch prediction results
    """
    predictor = get_predictor()
    loader = get_data_loader()

    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please try again later."
        )

    if not loader.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Student data not loaded."
        )

    try:
        students = loader.get_all_students(limit=10000)
        results = {"high": 0, "medium": 0, "low": 0}
        errors = 0

        for student in students:
            try:
                features = StudentFeatures(
                    num_of_prev_attempts=int(student.get("num_of_prev_attempts", 0)),
                    studied_credits=int(student.get("studied_credits", 60)),
                    avg_score=float(student.get("avg_score", 50)),
                    total_clicks=int(student.get("total_clicks", 0)),
                    completion_rate=float(student.get("completion_rate", 0.5)),
                    module_BBB=False,
                    module_CCC=False,
                    module_DDD=False,
                    module_EEE=False,
                    module_FFF=False,
                    module_GGG=False,
                )
                result = predictor.predict(features.model_dump())
                risk_level = result.get("risk_level", "low")
                results[risk_level] = results.get(risk_level, 0) + 1
            except Exception as e:
                errors += 1
                logger.warning(
                    f"Batch prediction failed for student {student.get('student_id', 'unknown')}: {e}"
                )

        return {
            "processed": len(students),
            "successful": len(students) - errors,
            "errors": errors,
            "high_risk": results["high"],
            "medium_risk": results["medium"],
            "low_risk": results["low"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction failed: {str(e)}"
        )
