"""
Dashboard statistics endpoint routes.

This module provides API endpoints for the main dashboard view, including:
    - Aggregate statistics (total students, risk distribution)
    - Risk-based student groupings
    - Model accuracy metrics

Endpoints:
    GET /dashboard/stats        - Get aggregate dashboard statistics
    GET /dashboard/risk-summary - Get students grouped by risk level

The dashboard endpoints compute statistics on-demand by running predictions
on all loaded students. For large datasets, consider caching these results.

Usage:
    # In FastAPI app
    from src.api.routes.dashboard import router
    app.include_router(router, prefix="/api/v1")
"""

import logging

from fastapi import APIRouter, HTTPException

from src.config import get_settings
from src.etl.loader import get_data_loader
from src.models.predictor import get_predictor

# Configure logger for tracking prediction errors
logger = logging.getLogger(__name__)

# Create router with prefix and tags for OpenAPI documentation
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# =============================================================================
# MAIN DASHBOARD STATS ENDPOINT
# =============================================================================

@router.get(
    "/stats",
    summary="Get dashboard statistics",
    description="Get summary statistics for the student dashboard.",
)
async def get_dashboard_stats():
    """
    Get aggregate statistics for the dashboard display.

    This endpoint computes real-time statistics by running predictions on all
    loaded students. It provides:
        - Total student count
        - Distribution across risk levels (high/medium/low)
        - Average dropout probability
        - Model accuracy (from configuration)
        - Count of prediction errors (if any failed)

    Returns:
        dict containing:
            - total_students: Total number of students in the dataset
            - high_risk_count: Students with risk score >= 70
            - medium_risk_count: Students with risk score 40-69
            - low_risk_count: Students with risk score < 40
            - avg_dropout_probability: Average risk probability (0-1)
            - model_accuracy: Model accuracy from settings (or None)
            - prediction_errors: Number of failed predictions

    Raises:
        HTTPException 503: If student data hasn't been uploaded yet

    Performance Note:
        This endpoint runs predictions on all students (up to 10,000).
        For very large datasets, consider implementing caching or pagination.

    Error Handling:
        Prediction errors are logged and tracked but don't fail the request.
        Students with failed predictions are NOT counted as any risk level
        to avoid misclassification.
    """
    # Get singleton instances
    loader = get_data_loader()
    predictor = get_predictor()
    settings = get_settings()

    # Validate data is available
    if not loader.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Student data not loaded. Please upload a CSV file."
        )

    # Get basic statistics from the data loader
    stats = loader.get_statistics()
    total = stats.get("total_students", 0)

    # Initialize counters for risk distribution calculation
    risk_counts = {"high": 0, "medium": 0, "low": 0}
    total_risk = 0.0
    prediction_errors = 0
    successfully_predicted = 0

    # Calculate risk distribution by running predictions on all students
    if predictor.is_loaded and total > 0:
        # Limit to 10,000 students to prevent memory issues
        # get_all_students returns (students_list, total_count) tuple
        students, _ = loader.get_all_students(limit=10000)

        for student in students:
            try:
                # Run prediction for this student
                result = predictor.predict(student)
                risk_level = result.get("risk_level", "low")

                # Update counters
                risk_counts[risk_level] = risk_counts.get(risk_level, 0) + 1
                total_risk += result.get("risk_probability", 0)
                successfully_predicted += 1

            except Exception as e:
                # Log error but don't fail the request
                # IMPORTANT: Don't misclassify failed predictions as "low risk"
                prediction_errors += 1
                logger.warning(
                    f"Prediction failed for student {student.get('student_id', 'unknown')}: {e}"
                )

    # Calculate average risk only from successful predictions
    avg_risk = total_risk / successfully_predicted if successfully_predicted > 0 else 0

    return {
        "total_students": total,
        "high_risk_count": risk_counts["high"],
        "medium_risk_count": risk_counts["medium"],
        "low_risk_count": risk_counts["low"],
        "avg_dropout_probability": avg_risk,
        "model_accuracy": settings.model_accuracy,  # From config, can be None
        "prediction_errors": prediction_errors,
    }


# =============================================================================
# RISK SUMMARY ENDPOINT
# =============================================================================

@router.get(
    "/risk-summary",
    summary="Get risk summary",
    description="Get a summary of students by risk level.",
)
async def get_risk_summary():
    """
    Get students grouped by their risk level with sample student details.

    This endpoint is useful for displaying risk distribution and providing
    quick access to students in each risk category. Returns counts and
    a sample of up to 10 students per risk level.

    Returns:
        dict with three risk groups, each containing:
            - count: Total number of students in this risk level
            - students: List of up to 10 students with:
                - student_id: Unique identifier
                - risk_score: Numerical risk score (0-100)
                - avg_score: Student's average assessment score
                - completion_rate: Course completion percentage

    Raises:
        HTTPException 503: If student data or model not loaded

    Note:
        This endpoint limits to 1,000 students for performance.
        Students with prediction errors are silently skipped.
    """
    # Get singleton instances
    loader = get_data_loader()
    predictor = get_predictor()

    # Validate both data and model are available
    if not loader.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Student data not loaded"
        )

    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded"
        )

    # Get students (limited to 1,000 for performance)
    # get_all_students returns (students_list, total_count) tuple
    students, _ = loader.get_all_students(limit=1000)

    # Initialize risk group containers
    risk_groups = {
        "high": [],
        "medium": [],
        "low": [],
    }

    # Classify each student by risk level
    for student in students:
        try:
            result = predictor.predict(student)
            risk_level = result["risk_level"]

            # Add student summary to appropriate risk group
            risk_groups[risk_level].append({
                "student_id": student.get("student_id", "unknown"),
                "risk_score": result["risk_score"],
                "avg_score": student.get("avg_score"),
                "completion_rate": student.get("completion_rate"),
            })

        except Exception:
            # Silently skip students with prediction errors
            # These are already logged in the stats endpoint
            continue

    # Return structured response with counts and sample students
    return {
        "high_risk": {
            "count": len(risk_groups["high"]),
            "students": risk_groups["high"][:10],  # Limit to top 10 for performance
        },
        "medium_risk": {
            "count": len(risk_groups["medium"]),
            "students": risk_groups["medium"][:10],
        },
        "low_risk": {
            "count": len(risk_groups["low"]),
            "students": risk_groups["low"][:10],
        },
    }
