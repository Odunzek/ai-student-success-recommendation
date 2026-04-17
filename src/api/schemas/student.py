"""Student input validation schemas."""

from pydantic import BaseModel, Field


class StudentFeatures(BaseModel):
    """Input schema for student features used in prediction.

    Matches the 12-feature contract of catboost_baseline_production.pkl:
      - 5 numeric features
      - 7 categorical features (raw strings — no encoding needed)
    """

    # Numeric features
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

    # Categorical features — passed as raw strings to CatBoost
    code_module: str = Field(
        default="Unknown",
        description="Module code (e.g. 'AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG')"
    )
    gender: str = Field(
        default="Unknown",
        description="Student gender: 'M' or 'F'"
    )
    region: str = Field(
        default="Unknown",
        description="Geographic region (e.g. 'Scotland', 'London Region', 'South East Region')"
    )
    highest_education: str = Field(
        default="Unknown",
        description="Highest education level (e.g. 'HE Qualification', 'A Level or Equivalent')"
    )
    imd_band: str = Field(
        default="Unknown",
        description="Index of Multiple Deprivation band (e.g. '0-10%', '10-20%', ..., '90-100%')"
    )
    age_band: str = Field(
        default="Unknown",
        description="Age band: '0-35', '35-55', or '55<='"
    )
    disability: str = Field(
        default="Unknown",
        description="Disability status: 'Y' or 'N'"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "avg_score": 45.0,
                    "completion_rate": 0.35,
                    "total_clicks": 150,
                    "studied_credits": 60,
                    "num_of_prev_attempts": 0,
                    "code_module": "BBB",
                    "gender": "M",
                    "region": "Scotland",
                    "highest_education": "A Level or Equivalent",
                    "imd_band": "20-30%",
                    "age_band": "35-55",
                    "disability": "N",
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
