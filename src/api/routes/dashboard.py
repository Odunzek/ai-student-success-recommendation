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
    """Get dashboard statistics including risk distribution and key metrics.

    Returns:
        Dict with various statistics
    """
    loader = get_data_loader()
    predictor = get_predictor()

    if not loader.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Student data not loaded"
        )

    stats = loader.get_statistics()
    risk_dist = loader.get_risk_distribution()

    return {
        "overview": {
            "total_students": stats.get("total_students", 0),
            "at_risk_count": stats.get("at_risk_count", 0),
            "not_at_risk_count": stats.get("not_at_risk_count", 0),
            "risk_percentage": stats.get("risk_percentage", 0),
        },
        "metrics": {
            "avg_score": {
                "average": stats.get("avg_avg_score"),
                "min": stats.get("min_avg_score"),
                "max": stats.get("max_avg_score"),
            },
            "completion_rate": {
                "average": stats.get("avg_completion_rate"),
                "min": stats.get("min_completion_rate"),
                "max": stats.get("max_completion_rate"),
            },
            "total_clicks": {
                "average": stats.get("avg_total_clicks"),
                "min": stats.get("min_total_clicks"),
                "max": stats.get("max_total_clicks"),
            },
        },
        "risk_distribution": risk_dist,
        "model_status": {
            "loaded": predictor.is_loaded,
        },
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
