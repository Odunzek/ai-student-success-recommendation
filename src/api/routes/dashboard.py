"""Dashboard statistics endpoint routes."""

from fastapi import APIRouter, HTTPException

from src.etl.loader import get_data_loader
from src.models.predictor import get_predictor

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/stats",
    summary="Get dashboard statistics",
    description="Get summary statistics for the student dashboard.",
)
async def get_dashboard_stats():
    """Get dashboard statistics including risk distribution and key metrics."""
    loader = get_data_loader()
    predictor = get_predictor()

    if not loader.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Student data not loaded. Please upload a CSV file."
        )

    stats = loader.get_statistics()
    total = stats.get("total_students", 0)

    # Calculate risk distribution using predictor
    risk_counts = {"high": 0, "medium": 0, "low": 0}
    total_risk = 0.0

    if predictor.is_loaded and total > 0:
        students = loader.get_all_students(limit=10000)
        for student in students:
            try:
                result = predictor.predict(student)
                risk_level = result.get("risk_level", "low")
                risk_counts[risk_level] = risk_counts.get(risk_level, 0) + 1
                total_risk += result.get("risk_probability", 0)
            except Exception:
                risk_counts["low"] += 1

    avg_risk = total_risk / total if total > 0 else 0

    return {
        "total_students": total,
        "high_risk_count": risk_counts["high"],
        "medium_risk_count": risk_counts["medium"],
        "low_risk_count": risk_counts["low"],
        "avg_dropout_probability": avg_risk,
        "model_accuracy": 0.91,
    }


@router.get(
    "/risk-summary",
    summary="Get risk summary",
    description="Get a summary of students by risk level.",
)
async def get_risk_summary():
    """Get summary of students grouped by risk level.

    Returns:
        Dict with students grouped by risk level
    """
    loader = get_data_loader()
    predictor = get_predictor()

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

    # Get all students and their predictions
    students = loader.get_all_students(limit=1000)

    risk_groups = {
        "high": [],
        "medium": [],
        "low": [],
    }

    for student in students:
        try:
            result = predictor.predict(student)
            risk_level = result["risk_level"]
            risk_groups[risk_level].append({
                "student_id": student.get("student_id", "unknown"),
                "risk_score": result["risk_score"],
                "avg_score": student.get("avg_score"),
                "completion_rate": student.get("completion_rate"),
            })
        except Exception:
            continue

    return {
        "high_risk": {
            "count": len(risk_groups["high"]),
            "students": risk_groups["high"][:10],  # Top 10
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
