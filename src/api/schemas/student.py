"""Student input validation schemas."""

from pydantic import BaseModel, Field


class StudentFeatures(BaseModel):
    """Input schema for student features used in prediction."""

    # Numeric features (will be scaled)
    num_of_prev_attempts: int = Field(
        default=0,
        ge=0,
        description="Number of previous attempts at this module"
    )
    studied_credits: int = Field(
        default=60,
        ge=0,
        description="Total credits being studied"
    )
    avg_score: float = Field(
        default=50.0,
        ge=0,
        le=100,
        description="Average assessment score (0-100)"
    )
    total_clicks: int = Field(
        default=0,
        ge=0,
        description="Total VLE clicks/interactions"
    )
    completion_rate: float = Field(
        default=0.5,
        ge=0,
        le=1,
        description="Assessment completion rate (0-1)"
    )

    # Module indicators (binary)
    module_BBB: bool = Field(default=False, description="Enrolled in module BBB")
    module_CCC: bool = Field(default=False, description="Enrolled in module CCC")
    module_DDD: bool = Field(default=False, description="Enrolled in module DDD")
    module_EEE: bool = Field(default=False, description="Enrolled in module EEE")
    module_FFF: bool = Field(default=False, description="Enrolled in module FFF")
    module_GGG: bool = Field(default=False, description="Enrolled in module GGG")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "avg_score": 45.0,
                    "completion_rate": 0.35,
                    "total_clicks": 150,
                    "studied_credits": 60,
                    "num_of_prev_attempts": 0,
                    "module_BBB": False,
                    "module_CCC": False,
                    "module_DDD": False,
                    "module_EEE": False,
                    "module_FFF": False,
                    "module_GGG": False,
                }
            ]
        }
    }


class StudentInfo(BaseModel):
    """Extended student information for data retrieval."""

    student_id: str = Field(..., description="Unique student identifier")
    code_module: str | None = Field(None, description="Module code")
    gender: str | None = Field(None, description="Student gender")
    region: str | None = Field(None, description="Geographic region")
    highest_education: str | None = Field(None, description="Highest education level")
    age_band: str | None = Field(None, description="Age band")
    disability: str | None = Field(None, description="Disability status")

    # Include prediction features
    features: StudentFeatures | None = Field(None, description="Student features for prediction")
