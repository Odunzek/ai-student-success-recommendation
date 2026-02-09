"""Upload API endpoints for CSV/ZIP file uploads."""

from pathlib import Path
from typing import Annotated
import shutil

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel

from src.config import get_settings
from src.etl.loader import get_data_loader
from src.etl.pipeline import (
    process_uploaded_file,
    transform_oulad,
    validate_features,
    REQUIRED_FEATURES,
)


router = APIRouter(prefix="/upload", tags=["Upload"])


class UploadResponse(BaseModel):
    """Response model for upload endpoints."""

    message: str
    rows_processed: int
    filename: str
    format_detected: str = ""
    warning: str | None = None
    defaulted_columns: list[str] = []


class UploadStatusResponse(BaseModel):
    """Response model for upload status."""

    has_data: bool
    row_count: int
    last_upload: str | None = None


def ensure_upload_dir() -> Path:
    """Ensure the uploads directory exists."""
    settings = get_settings()
    upload_dir = settings.project_root / "data" / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


@router.post("/csv", response_model=UploadResponse)
async def upload_csv(
    file: Annotated[UploadFile, File(description="CSV or ZIP file to upload")]
):
    """Upload a CSV or ZIP file for processing.

    Accepts:
    - Pre-processed CSV with model features
    - Combined raw OULAD CSV
    - ZIP file containing OULAD CSVs (studentInfo, studentAssessment, etc.)

    The file will be automatically processed and loaded into the system.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Validate file extension
    filename_lower = file.filename.lower()
    if not (filename_lower.endswith(".csv") or filename_lower.endswith(".zip")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only CSV and ZIP files are accepted."
        )

    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Process the file
    try:
        df, format_detected = process_uploaded_file(content, file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to process file: {str(e)}"
        )

    # Validate features
    is_valid, missing = validate_features(df)

    if not is_valid:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required features: {', '.join(missing)}"
        )

    # Parse format_detected for defaulted columns warning
    warning = None
    defaulted_columns: list[str] = []
    actual_format = format_detected

    if format_detected.startswith("unknown_with_defaults:"):
        actual_format = "unknown_with_defaults"
        defaulted_columns = format_detected.split(":")[1].split(",")
        warning = f"Missing columns were filled with default values: {', '.join(defaulted_columns)}"

    # Save processed file
    upload_dir = ensure_upload_dir()
    output_path = upload_dir / "uploaded_data.csv"
    df.to_csv(output_path, index=False)

    # Reload data
    loader = get_data_loader()
    loader.reload(output_path)

    return UploadResponse(
        message=f"Successfully loaded {len(df)} records",
        rows_processed=len(df),
        filename=file.filename or "unknown.csv",
        format_detected=actual_format,
        warning=warning,
        defaulted_columns=defaulted_columns,
    )


@router.post("/oulad", response_model=UploadResponse)
async def upload_oulad_files(
    student_info: Annotated[
        UploadFile,
        File(description="studentInfo.csv file")
    ],
    student_assessment: Annotated[
        UploadFile | None,
        File(description="studentAssessment.csv file")
    ] = None,
    student_vle: Annotated[
        UploadFile | None,
        File(description="studentVle.csv file")
    ] = None,
    assessments: Annotated[
        UploadFile | None,
        File(description="assessments.csv file")
    ] = None,
):
    """Upload separate OULAD CSV files for processing.

    Required:
    - studentInfo.csv: Student demographics and registration

    Optional:
    - studentAssessment.csv: Assessment scores
    - studentVle.csv: VLE interaction data
    - assessments.csv: Assessment metadata

    Missing optional files will result in default values being used.
    """
    import pandas as pd
    import io

    dfs = {}

    # Read required studentInfo
    try:
        content = await student_info.read()
        dfs["studentInfo.csv"] = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read studentInfo.csv: {str(e)}"
        )

    # Read optional files
    if student_assessment:
        try:
            content = await student_assessment.read()
            dfs["studentAssessment.csv"] = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to read studentAssessment.csv: {str(e)}"
            )

    if student_vle:
        try:
            content = await student_vle.read()
            dfs["studentVle.csv"] = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to read studentVle.csv: {str(e)}"
            )

    if assessments:
        try:
            content = await assessments.read()
            dfs["assessments.csv"] = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to read assessments.csv: {str(e)}"
            )

    # Transform OULAD data
    try:
        df = transform_oulad(dfs)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to transform OULAD data: {str(e)}"
        )

    # Validate features
    is_valid, missing = validate_features(df)

    if not is_valid:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required features after transformation: {', '.join(missing)}"
        )

    # Save processed file
    upload_dir = ensure_upload_dir()
    output_path = upload_dir / "uploaded_data.csv"
    df.to_csv(output_path, index=False)

    # Reload data
    loader = get_data_loader()
    loader.reload(output_path)

    files_uploaded = ["studentInfo.csv"]
    if student_assessment:
        files_uploaded.append("studentAssessment.csv")
    if student_vle:
        files_uploaded.append("studentVle.csv")
    if assessments:
        files_uploaded.append("assessments.csv")

    return UploadResponse(
        message=f"Successfully processed {len(df)} records from OULAD files",
        rows_processed=len(df),
        filename=", ".join(files_uploaded),
        format_detected="oulad_separate",
    )


@router.get("/status", response_model=UploadStatusResponse)
async def get_upload_status():
    """Get current dataset information."""
    loader = get_data_loader()

    if not loader.is_loaded:
        return UploadStatusResponse(
            has_data=False,
            row_count=0,
            last_upload=None,
        )

    source_info = loader.get_source_info()

    return UploadStatusResponse(
        has_data=True,
        row_count=source_info["record_count"],
        last_upload=source_info["source"],
    )


@router.delete("/data")
async def clear_uploaded_data():
    """Clear uploaded data and reload default dataset.

    This will remove any uploaded data and reload the original dataset
    from the configured path.
    """
    settings = get_settings()
    loader = get_data_loader()

    # Clear uploaded file if exists
    upload_dir = ensure_upload_dir()
    uploaded_file = upload_dir / "uploaded_data.csv"
    if uploaded_file.exists():
        uploaded_file.unlink()

    # Reload default data
    try:
        loader.reload(settings.student_data_path)
        return {
            "success": True,
            "message": "Data cleared. Default dataset reloaded.",
            "records_loaded": len(loader.data) if loader.is_loaded else 0,
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to reload default data: {str(e)}",
            "records_loaded": 0,
        }
