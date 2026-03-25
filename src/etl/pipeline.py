"""ETL pipeline for transforming OULAD data to model features."""

from pathlib import Path
from typing import Literal
import zipfile
import tempfile

import pandas as pd

from src.config import get_settings


# Required features for the ML model
REQUIRED_FEATURES = [
    "num_of_prev_attempts",
    "studied_credits",
    "avg_score",
    "total_clicks",
    "completion_rate",
    "module_BBB",
    "module_CCC",
    "module_DDD",
    "module_EEE",
    "module_FFF",
    "module_GGG",
]

# OULAD file names expected in ZIP
OULAD_FILES = [
    "studentInfo.csv",
    "studentAssessment.csv",
    "studentVle.csv",
    "assessments.csv",
]


def detect_format(df: pd.DataFrame) -> Literal["processed", "combined_raw", "unknown"]:
    """Auto-detect if data is pre-processed or raw OULAD format.

    Args:
        df: Input DataFrame to analyze

    Returns:
        Format type: "processed", "combined_raw", or "unknown"
    """
    columns = set(df.columns)

    # Check for processed format (has all required features)
    required_set = set(REQUIRED_FEATURES)
    if required_set.issubset(columns):
        return "processed"

    # Check for combined raw OULAD format
    raw_indicators = {"id_student", "score", "sum_click", "code_module"}
    if raw_indicators.issubset(columns) or "id_student" in columns:
        return "combined_raw"

    return "unknown"


def validate_features(df: pd.DataFrame) -> tuple[bool, list[str]]:
    """Ensure output DataFrame has all required 11 features.

    Args:
        df: DataFrame to validate

    Returns:
        Tuple of (is_valid, list of missing features)
    """
    columns = set(df.columns)
    required_set = set(REQUIRED_FEATURES)
    missing = list(required_set - columns)
    return len(missing) == 0, missing


def transform_oulad(dfs: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Process multiple OULAD CSVs into model features.

    Expected input files:
    - studentInfo.csv: Student demographics and registration info
    - studentAssessment.csv: Assessment scores per student
    - studentVle.csv: VLE interaction data (clicks)
    - assessments.csv: Assessment metadata

    Args:
        dfs: Dictionary mapping filename to DataFrame

    Returns:
        Transformed DataFrame with required features
    """
    # Extract DataFrames - use explicit None checks to avoid DataFrame truth value ambiguity
    student_info = dfs.get("studentInfo.csv")
    if student_info is None:
        student_info = dfs.get("studentInfo")

    student_assessment = dfs.get("studentAssessment.csv")
    if student_assessment is None:
        student_assessment = dfs.get("studentAssessment")

    student_vle = dfs.get("studentVle.csv")
    if student_vle is None:
        student_vle = dfs.get("studentVle")

    assessments = dfs.get("assessments.csv")
    if assessments is None:
        assessments = dfs.get("assessments")

    if student_info is None:
        raise ValueError("studentInfo.csv is required")

    # Start with student info as base
    # Use id_student + code_module + code_presentation as unique key
    if "id_student" not in student_info.columns:
        raise ValueError("studentInfo.csv must contain 'id_student' column")

    # Create base features from studentInfo
    result = student_info[["id_student"]].copy()

    # Add num_of_prev_attempts if available
    if "num_of_prev_attempts" in student_info.columns:
        result["num_of_prev_attempts"] = student_info["num_of_prev_attempts"].fillna(0)
    else:
        result["num_of_prev_attempts"] = 0

    # Add studied_credits if available
    if "studied_credits" in student_info.columns:
        result["studied_credits"] = student_info["studied_credits"].fillna(60)
    else:
        result["studied_credits"] = 60

    # Calculate avg_score from studentAssessment
    if student_assessment is not None and "id_student" in student_assessment.columns:
        # Join with assessments to get weight if available
        if assessments is not None and "id_assessment" in assessments.columns:
            merged = student_assessment.merge(
                assessments[["id_assessment", "weight"]] if "weight" in assessments.columns else assessments[["id_assessment"]],
                on="id_assessment",
                how="left"
            )
        else:
            merged = student_assessment.copy()

        # Calculate average score per student
        if "score" in merged.columns:
            avg_scores = merged.groupby("id_student")["score"].mean().reset_index()
            avg_scores.columns = ["id_student", "avg_score"]
            result = result.merge(avg_scores, on="id_student", how="left")
        else:
            result["avg_score"] = 50.0
    else:
        result["avg_score"] = 50.0

    result["avg_score"] = result["avg_score"].fillna(50.0)

    # Calculate total_clicks from studentVle
    if student_vle is not None and "id_student" in student_vle.columns:
        click_col = "sum_click" if "sum_click" in student_vle.columns else "click"
        if click_col in student_vle.columns:
            total_clicks = student_vle.groupby("id_student")[click_col].sum().reset_index()
            total_clicks.columns = ["id_student", "total_clicks"]
            result = result.merge(total_clicks, on="id_student", how="left")
        else:
            result["total_clicks"] = 0
    else:
        result["total_clicks"] = 0

    result["total_clicks"] = result["total_clicks"].fillna(0).astype(int)

    # Calculate completion_rate from studentAssessment
    if student_assessment is not None and assessments is not None:
        if "id_assessment" in assessments.columns:
            total_assessments = assessments["id_assessment"].nunique()
            if total_assessments > 0:
                submitted = student_assessment.groupby("id_student")["id_assessment"].nunique().reset_index()
                submitted.columns = ["id_student", "submitted_count"]
                result = result.merge(submitted, on="id_student", how="left")
                result["submitted_count"] = result["submitted_count"].fillna(0)
                result["completion_rate"] = result["submitted_count"] / total_assessments
                result["completion_rate"] = result["completion_rate"].clip(0, 1)
                result = result.drop(columns=["submitted_count"])
            else:
                result["completion_rate"] = 0.5
        else:
            result["completion_rate"] = 0.5
    else:
        result["completion_rate"] = 0.5

    result["completion_rate"] = result["completion_rate"].fillna(0.5)

    # One-hot encode code_module
    if "code_module" in student_info.columns:
        module_info = student_info[["id_student", "code_module"]].copy()
        result = result.merge(module_info, on="id_student", how="left")

        for module in ["BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]:
            result[f"module_{module}"] = (result["code_module"] == module).astype(int)

        result = result.drop(columns=["code_module"], errors="ignore")
    else:
        # Default all modules to 0
        for module in ["BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]:
            result[f"module_{module}"] = 0

    # Drop id_student for model input (or rename to student_id)
    result = result.rename(columns={"id_student": "student_id"})

    return result


def transform_combined(df: pd.DataFrame) -> pd.DataFrame:
    """Process a single combined raw CSV into model features.

    Expected columns: id_student, score, sum_click, code_module, etc.

    Args:
        df: Combined raw DataFrame

    Returns:
        Transformed DataFrame with required features
    """
    result = pd.DataFrame()

    # Get unique students
    if "id_student" in df.columns:
        students = df["id_student"].unique()
        result["student_id"] = students
    else:
        result["student_id"] = df.index.astype(str)

    # Group by student for aggregations
    if "id_student" in df.columns:
        grouped = df.groupby("id_student")

        # num_of_prev_attempts
        if "num_of_prev_attempts" in df.columns:
            prev_attempts = grouped["num_of_prev_attempts"].first().reset_index()
            prev_attempts.columns = ["id_student", "num_of_prev_attempts"]
            result = result.merge(
                prev_attempts.rename(columns={"id_student": "student_id"}),
                on="student_id",
                how="left"
            )
        else:
            result["num_of_prev_attempts"] = 0

        # studied_credits
        if "studied_credits" in df.columns:
            credits = grouped["studied_credits"].first().reset_index()
            credits.columns = ["id_student", "studied_credits"]
            result = result.merge(
                credits.rename(columns={"id_student": "student_id"}),
                on="student_id",
                how="left"
            )
        else:
            result["studied_credits"] = 60

        # avg_score
        if "score" in df.columns:
            avg_score = grouped["score"].mean().reset_index()
            avg_score.columns = ["id_student", "avg_score"]
            result = result.merge(
                avg_score.rename(columns={"id_student": "student_id"}),
                on="student_id",
                how="left"
            )
        else:
            result["avg_score"] = 50.0

        # total_clicks
        click_col = "sum_click" if "sum_click" in df.columns else ("click" if "click" in df.columns else None)
        if click_col:
            total_clicks = grouped[click_col].sum().reset_index()
            total_clicks.columns = ["id_student", "total_clicks"]
            result = result.merge(
                total_clicks.rename(columns={"id_student": "student_id"}),
                on="student_id",
                how="left"
            )
        else:
            result["total_clicks"] = 0

        # completion_rate (estimate from non-null scores if available)
        if "score" in df.columns and "id_assessment" in df.columns:
            total_assessments = df["id_assessment"].nunique()
            if total_assessments > 0:
                submitted = grouped["id_assessment"].nunique().reset_index()
                submitted.columns = ["id_student", "submitted"]
                submitted["completion_rate"] = submitted["submitted"] / total_assessments
                result = result.merge(
                    submitted[["id_student", "completion_rate"]].rename(columns={"id_student": "student_id"}),
                    on="student_id",
                    how="left"
                )
            else:
                result["completion_rate"] = 0.5
        else:
            result["completion_rate"] = 0.5

        # One-hot encode code_module
        if "code_module" in df.columns:
            module_per_student = grouped["code_module"].first().reset_index()
            module_per_student.columns = ["id_student", "code_module"]
            result = result.merge(
                module_per_student.rename(columns={"id_student": "student_id"}),
                on="student_id",
                how="left"
            )

            for module in ["BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]:
                result[f"module_{module}"] = (result["code_module"] == module).astype(int)

            result = result.drop(columns=["code_module"], errors="ignore")
        else:
            for module in ["BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]:
                result[f"module_{module}"] = 0
    else:
        # No id_student column - use row index
        result["num_of_prev_attempts"] = df.get("num_of_prev_attempts", 0)
        result["studied_credits"] = df.get("studied_credits", 60)
        result["avg_score"] = df.get("avg_score", df.get("score", 50.0))
        result["total_clicks"] = df.get("total_clicks", df.get("sum_click", 0))
        result["completion_rate"] = df.get("completion_rate", 0.5)

        for module in ["BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]:
            if f"module_{module}" in df.columns:
                result[f"module_{module}"] = df[f"module_{module}"]
            else:
                result[f"module_{module}"] = 0

    # Fill NaN values
    result["num_of_prev_attempts"] = result["num_of_prev_attempts"].fillna(0).astype(int)
    result["studied_credits"] = result["studied_credits"].fillna(60).astype(int)
    result["avg_score"] = result["avg_score"].fillna(50.0)
    result["total_clicks"] = result["total_clicks"].fillna(0).astype(int)
    result["completion_rate"] = result["completion_rate"].fillna(0.5).clip(0, 1)

    return result


def process_zip_file(zip_path: Path) -> pd.DataFrame:
    """Extract and process OULAD ZIP file.

    Args:
        zip_path: Path to ZIP file containing OULAD CSVs

    Returns:
        Transformed DataFrame with required features
    """
    dfs = {}

    with zipfile.ZipFile(zip_path, "r") as zf:
        for name in zf.namelist():
            # Extract CSV files
            if name.endswith(".csv"):
                # Get just the filename without path
                filename = Path(name).name
                with zf.open(name) as f:
                    dfs[filename] = pd.read_csv(f)

    return transform_oulad(dfs)


def process_uploaded_file(
    file_content: bytes,
    filename: str,
    format_hint: str | None = None
) -> tuple[pd.DataFrame, str]:
    """Process an uploaded file (CSV or ZIP).

    Args:
        file_content: Raw file bytes
        filename: Original filename
        format_hint: Optional hint about data format

    Returns:
        Tuple of (transformed DataFrame, detected format)
    """
    settings = get_settings()

    # Handle ZIP files
    if filename.lower().endswith(".zip"):
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
            tmp.write(file_content)
            tmp_path = Path(tmp.name)

        try:
            df = process_zip_file(tmp_path)
            return df, "oulad_zip"
        finally:
            tmp_path.unlink(missing_ok=True)

    # Handle CSV files
    import io
    df = pd.read_csv(io.BytesIO(file_content))

    # Detect format
    detected = detect_format(df)

    if detected == "processed":
        # Already has required features
        if "student_id" not in df.columns:
            df["student_id"] = df.index.astype(str)
        return df, "processed"

    elif detected == "combined_raw":
        # Transform combined raw data
        df = transform_combined(df)
        return df, "combined_raw"

    else:
        # Unknown format - try to use as-is with defaults
        if "student_id" not in df.columns:
            df["student_id"] = df.index.astype(str)

        # Track which columns are being defaulted
        defaulted_columns = []

        # Add missing features with defaults
        for feat in REQUIRED_FEATURES:
            if feat not in df.columns:
                defaulted_columns.append(feat)
                if feat.startswith("module_"):
                    df[feat] = 0
                elif feat == "completion_rate":
                    df[feat] = 0.5
                elif feat == "avg_score":
                    df[feat] = 50.0
                else:
                    df[feat] = 0

        # Return format string with info about defaults
        if defaulted_columns:
            return df, f"unknown_with_defaults:{','.join(defaulted_columns)}"
        return df, "unknown_with_defaults"
