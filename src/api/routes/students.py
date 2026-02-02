"""Student data endpoint routes."""

from fastapi import APIRouter, HTTPException, Query

from src.etl.loader import get_data_loader
from src.models.predictor import get_predictor
from src.api.schemas.student import StudentFeatures
from src.api.schemas.prediction import PredictionResponse

router = APIRouter(prefix="/students", tags=["Students"])


@router.get(
    "",
    summary="List students",
    description="Get a paginated list of students with their basic information.",
)
async def list_students(
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of students to return"),
    offset: int = Query(default=0, ge=0, description="Number of students to skip"),
):
    """Get paginated list of students.

    Args:
        limit: Maximum number of records (1-100)
        offset: Number of records to skip

    Returns:
        List of student records
    """
    loader = get_data_loader()

    if not loader.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Student data not loaded"
        )

    students = loader.get_all_students(limit=limit, offset=offset)
    total = loader.data.shape[0] if loader.is_loaded else 0

    return {
        "students": students,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get(
    "/{student_id}",
    summary="Get student by ID",
    description="Get detailed information for a specific student.",
)
async def get_student(student_id: str):
    """Get a specific student by ID.

    Args:
        student_id: Student identifier (row index)

    Returns:
        Student record with features and optional prediction
    """
    loader = get_data_loader()

    if not loader.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Student data not loaded"
        )

    student = loader.get_student(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student {student_id} not found"
        )

    return {"student": student}


@router.get(
    "/{student_id}/predict",
    response_model=PredictionResponse,
    summary="Predict risk for student",
    description="Get risk prediction for a specific student using their stored features.",
)
async def predict_student_risk(student_id: str):
    """Get risk prediction for a specific student.

    Args:
        student_id: Student identifier

    Returns:
        Risk prediction
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

    student = loader.get_student(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student {student_id} not found"
        )

    try:
        # Extract features from student data
        features = StudentFeatures(
            num_of_prev_attempts=int(student.get("num_of_prev_attempts", 0)),
            studied_credits=int(student.get("studied_credits", 60)),
            avg_score=float(student.get("avg_score", 50)),
            total_clicks=int(student.get("total_clicks", 0)),
            completion_rate=float(student.get("completion_rate", 0.5)),
            # Module features would need to be extracted from code_module
            module_BBB=False,
            module_CCC=False,
            module_DDD=False,
            module_EEE=False,
            module_FFF=False,
            module_GGG=False,
        )

        result = predictor.predict(features.model_dump())
        return PredictionResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )
